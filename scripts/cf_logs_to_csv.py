#!/usr/bin/env python3
"""Merge CloudFront *.gz access logs from a local folder into one CSV (stdin-free).

Geolocation is city/region level (GeoIP), not a street address — IPs are not that precise.

  Offline (recommended): sign up at https://www.maxmind.com/en/geolite2/signup ,
  download GeoLite2-City.mmdb , then:

    python3 scripts/cf_logs_to_csv.py ./cf-logs out.csv --geoip-db ~/GeoLite2-City.mmdb

  Online (no DB; sends each unique IP to ip-api.com — personal/non‑commercial only; throttled):

    python3 scripts/cf_logs_to_csv.py ./cf-logs out.csv --online-geo
"""
from __future__ import annotations

import argparse
import csv
import gzip
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

GEO_COLUMNS = (
    "accessed_at",
    "geo_place",
    "geo_city",
    "geo_region",
    "geo_country",
    "geo_latitude",
    "geo_longitude",
)


def parse_cf_file(path: Path):
    fields = None
    rows = []
    with gzip.open(path, "rt", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.rstrip("\n")
            if line.startswith("#Fields:"):
                parts = line.split("\t")
                parts[0] = parts[0].replace("#Fields:", "").strip()
                fields = parts
            elif line.startswith("#") or not line.strip():
                continue
            elif fields:
                rows.append(line.split("\t"))
    return fields, rows


def _format_place(city: str, region: str, country: str) -> str:
    parts = [p for p in (city.strip(), region.strip(), country.strip()) if p]
    return ", ".join(parts) if parts else ""


def lookup_geoip2(mmdb: Path, ip: str) -> dict[str, Any]:
    import geoip2.database
    import geoip2.errors

    try:
        with geoip2.database.Reader(mmdb) as reader:
            r = reader.city(ip)
    except geoip2.errors.AddressNotFoundError:
        return {}
    except ValueError:
        return {}

    city = (r.city.name or "").strip()
    region = ""
    if r.subdivisions:
        region = (r.subdivisions[0].name or "").strip()
    country = (r.country.name or "").strip()
    lat = r.location.latitude
    lon = r.location.longitude
    lat_s = "" if lat is None else str(lat)
    lon_s = "" if lon is None else str(lon)
    return {
        "geo_city": city,
        "geo_region": region,
        "geo_country": country,
        "geo_latitude": lat_s,
        "geo_longitude": lon_s,
        "geo_place": _format_place(city, region, country),
    }


def lookup_ip_api(ip: str) -> dict[str, Any]:
    """https://ip-api.com — free tier; max ~45 requests/minute per client IP."""
    qs = "fields=status,message,country,regionName,city,lat,lon,query"
    url = f"http://ip-api.com/json/{ip}?{qs}"
    req = urllib.request.Request(url, headers={"User-Agent": "cf_logs_to_csv/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError):
        return {}

    if data.get("status") != "success":
        return {}

    city = (data.get("city") or "").strip()
    region = (data.get("regionName") or "").strip()
    country = (data.get("country") or "").strip()
    lat = data.get("lat")
    lon = data.get("lon")
    return {
        "geo_city": city,
        "geo_region": region,
        "geo_country": country,
        "geo_latitude": "" if lat is None else str(lat),
        "geo_longitude": "" if lon is None else str(lon),
        "geo_place": _format_place(city, region, country),
    }


def build_accessed_at(date_s: str, time_s: str) -> str:
    """CloudFront standard logs use UTC for date/time."""
    d = (date_s or "").strip()
    t = (time_s or "").strip()
    if d and t:
        return f"{d}T{t}Z"
    return d or t or ""


def enrich_rows(
    fields: list[str],
    rows: list[list[str]],
    *,
    geoip_db: Path | None,
    online_geo: bool,
) -> tuple[list[str], list[list[str]]]:
    try:
        date_i = fields.index("date")
        time_i = fields.index("time")
        ip_i = fields.index("c-ip")
    except ValueError as e:
        raise SystemExit(f"Log is missing expected column: {e}") from e

    lookup: dict[str, dict[str, Any]] = {}

    if geoip_db:
        unique = {row[ip_i].strip() for row in rows if row[ip_i].strip()}
        for ip in sorted(unique):
            lookup[ip] = lookup_geoip2(geoip_db, ip)
    elif online_geo:
        unique = [ip for ip in sorted({row[ip_i].strip() for row in rows if row[ip_i].strip()})]
        for n, ip in enumerate(unique):
            if n:
                time.sleep(60.0 / 45.0)
            lookup[ip] = lookup_ip_api(ip)
            if (n + 1) % 20 == 0:
                print(f"  geo lookup {n + 1}/{len(unique)}…", file=sys.stderr)
    else:
        return fields, rows

    out_fields = list(GEO_COLUMNS) + fields
    out_rows = []
    for row in rows:
        ip = row[ip_i].strip() if ip_i < len(row) else ""
        g = lookup.get(ip, {})
        accessed = build_accessed_at(
            row[date_i] if date_i < len(row) else "",
            row[time_i] if time_i < len(row) else "",
        )
        prefix = [
            accessed,
            g.get("geo_place", ""),
            g.get("geo_city", ""),
            g.get("geo_region", ""),
            g.get("geo_country", ""),
            g.get("geo_latitude", ""),
            g.get("geo_longitude", ""),
        ]
        out_rows.append(prefix + row)

    return out_fields, out_rows


def main():
    ap = argparse.ArgumentParser(description="CloudFront gz logs → CSV")
    ap.add_argument(
        "input_dir",
        type=Path,
        help="Folder with .gz files (e.g. from: aws s3 sync s3://bucket/.../CloudFront/ ./cf-logs)",
    )
    ap.add_argument("out_csv", type=Path, help="Output CSV path")
    ap.add_argument(
        "--geoip-db",
        type=Path,
        metavar="PATH",
        help="Path to MaxMind GeoLite2-City.mmdb (offline; pip install geoip2)",
    )
    ap.add_argument(
        "--online-geo",
        action="store_true",
        help="Resolve IPs via ip-api.com (throttled; not for commercial use; see their terms)",
    )
    args = ap.parse_args()

    if args.geoip_db and args.online_geo:
        raise SystemExit("Use either --geoip-db or --online-geo, not both.")
    if args.geoip_db:
        if not args.geoip_db.is_file():
            raise SystemExit(f"GeoIP database not found: {args.geoip_db}")
        try:
            import geoip2.database  # noqa: F401
        except ImportError:
            raise SystemExit("Install: pip install geoip2")

    gz_files = sorted(args.input_dir.glob("*.gz"))
    if not gz_files:
        gz_files = sorted(args.input_dir.rglob("*.gz"))
    if not gz_files:
        raise SystemExit(f"No .gz files under {args.input_dir}")

    all_fields = None
    all_rows = []
    for p in gz_files:
        fields, rows = parse_cf_file(p)
        if not fields:
            print(f"skip (no #Fields): {p}")
            continue
        if all_fields is None:
            all_fields = fields
        elif fields != all_fields:
            print(f"warn: field mismatch in {p}, padding/truncating to first file columns")
            exp = len(all_fields)
            for i, row in enumerate(rows):
                if len(row) < exp:
                    rows[i] = row + [""] * (exp - len(row))
                elif len(row) > exp:
                    rows[i] = row[:exp]
        all_rows.extend(rows)

    if args.geoip_db or args.online_geo:
        all_fields, all_rows = enrich_rows(
            all_fields,
            all_rows,
            geoip_db=args.geoip_db,
            online_geo=args.online_geo,
        )

    args.out_csv.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out_csv, "w", newline="", encoding="utf-8") as fp:
        w = csv.writer(fp)
        w.writerow(all_fields)
        w.writerows(all_rows)

    print(f"Wrote {len(all_rows)} rows to {args.out_csv}")


if __name__ == "__main__":
    main()
