"""Vedic astrology web app - run with:  python app.py  ->  http://127.0.0.1:8000"""
import os
import re
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from flask import Flask, jsonify, render_template, request

import astro

app = Flask(__name__)

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIME_RE = re.compile(r"^\d{1,2}:\d{2}(:\d{2})?$")


@app.get("/")
def index():
    return render_template("index.html", engine=astro.ENGINE)


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "engine": astro.ENGINE})


@app.post("/api/chart")
def chart():
    data = request.get_json(silent=True) or {}
    errors = []

    date_s = str(data.get("date", "")).strip()
    time_s = str(data.get("time", "")).strip()
    tz_name = str(data.get("tz", "")).strip()
    name = str(data.get("name", "")).strip()[:80]

    if not DATE_RE.match(date_s):
        errors.append("Date must be YYYY-MM-DD.")
    if not TIME_RE.match(time_s):
        errors.append("Time must be HH:MM (24-hour).")
    try:
        lat = float(data.get("lat"))
        lon = float(data.get("lon"))
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            errors.append("Latitude must be -90..90 and longitude -180..180.")
    except (TypeError, ValueError):
        errors.append("Latitude and longitude must be numbers.")
        lat = lon = 0.0
    try:
        ZoneInfo(tz_name)
    except (ZoneInfoNotFoundError, ValueError, KeyError):
        errors.append("Unknown timezone - use an IANA name such as Asia/Kolkata.")

    if errors:
        return jsonify({"error": " ".join(errors)}), 400

    try:
        return jsonify(astro.compute_chart(date_s, time_s, lat, lon, tz_name, name))
    except ValueError as exc:  # e.g. impossible date
        return jsonify({"error": f"Invalid input: {exc}"}), 400


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    print(f"Calculation engine: {astro.ENGINE}")
    app.run(host="127.0.0.1", port=port, debug=False)
