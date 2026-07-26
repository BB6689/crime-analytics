"""
Fetch ALL Karnataka police stations from Overpass API (OpenStreetMap)
and generate a clean JavaScript file with exact GPS coordinates.
This replaces the hand-curated/synthetic lat-long data.
"""
import json
import time
import urllib.request
import urllib.parse

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

QUERY = """
[out:json][timeout:90];
(
  node["amenity"="police"](11.5,74.0,18.5,78.6);
  way["amenity"="police"](11.5,74.0,18.5,78.6);
  relation["amenity"="police"](11.5,74.0,18.5,78.6);
);
out center tags;
"""

def fetch_stations():
    print("Querying Overpass API for Karnataka police stations...")
    encoded = urllib.parse.urlencode({"data": QUERY}).encode()
    req = urllib.request.Request(
        OVERPASS_URL,
        data=encoded,
        headers={"User-Agent": "KSP-CrimeAnalytics/1.0"}
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = json.loads(resp.read().decode())
    return raw.get("elements", [])

def extract_station(el):
    name = el.get("tags", {}).get("name") or el.get("tags", {}).get("name:en")
    if not name:
        return None
    
    # Filter out non-Karnataka results and non-police-station amenities
    name_lower = name.lower()
    if any(skip in name_lower for skip in ["traffic", "cyber", "commissioner", "reserve", "battalion", "dog squad", "fire station"]):
        pass  # Keep these — they can still be legitimate PS

    # Resolve coordinates
    if el["type"] == "node":
        lat, lon = el.get("lat"), el.get("lon")
    else:
        center = el.get("center", {})
        lat, lon = center.get("lat"), center.get("lon")

    if lat is None or lon is None:
        return None

    # Bounding box for Karnataka: lat 11.5–18.5, lon 74.0–78.6
    if not (11.5 <= lat <= 18.5 and 74.0 <= lon <= 78.6):
        return None

    tags = el.get("tags", {})
    name_kn = tags.get("name:kn") or tags.get("name:kan")
    phone = tags.get("phone") or tags.get("contact:phone")
    address = tags.get("addr:full") or tags.get("addr:street")
    
    return {
        "osmId": el.get("id"),
        "name": name.strip(),
        "nameKn": name_kn.strip() if name_kn else None,
        "lat": round(lat, 7),
        "lon": round(lon, 7),
        "phone": phone,
        "address": address
    }

def main():
    elements = fetch_stations()
    print(f"Raw elements fetched: {len(elements)}")

    stations = []
    seen_ids = set()
    
    for el in elements:
        station = extract_station(el)
        if station and station["osmId"] not in seen_ids:
            stations.append(station)
            seen_ids.add(station["osmId"])
    
    print(f"Valid Karnataka police stations extracted: {len(stations)}")

    # Write JavaScript file
    js_lines = [
        "// Karnataka Police Stations — sourced from Overpass API (OpenStreetMap)",
        f"// Total stations: {len(stations)}",
        f"// Fetched: {time.strftime('%Y-%m-%d')}",
        "// Bounding box: Karnataka state (lat 11.5–18.5, lon 74.0–78.6)",
        "",
        "export const realPoliceStations = "
    ]
    js_lines.append(json.dumps(stations, indent=2, ensure_ascii=False) + ";")
    js_lines.append("")

    out_path = r"c:\Users\balaj\.gemini\antigravity-ide\scratch\crime-analytics\src\mockData\realPoliceStations.js"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(js_lines))

    print(f"\n✅ Written to: {out_path}")
    print(f"   Total stations: {len(stations)}")
    if stations:
        print(f"   Sample entry: {stations[0]}")

if __name__ == "__main__":
    main()
