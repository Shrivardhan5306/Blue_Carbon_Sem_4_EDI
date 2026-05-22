"""
geo_routes.py — Geospatial prediction routes for Blue Carbon AI API
Mounted into the main FastAPI app from api.py

Endpoints:
  GET /geo-predict?location=Thane&area=500
  GET /maharashtra-districts
"""

import os
import json
import urllib.request
import numpy as np


# ─── Maharashtra District Knowledge Base ─────────────────────────────────────
# Pre-calibrated NDVI/EVI/area values derived from FSI & ISRO mangrove surveys
MAHARASHTRA_DISTRICTS = {
    "Mumbai":     {"ndvi": 0.28, "evi": 0.22, "area": 603,   "ecosystem": "Urban Coastal"},
    "Thane":      {"ndvi": 0.65, "evi": 0.50, "area": 4214,  "ecosystem": "Mangrove Forest"},
    "Raigad":     {"ndvi": 0.72, "evi": 0.55, "area": 7152,  "ecosystem": "Dense Mangrove"},
    "Ratnagiri":  {"ndvi": 0.76, "evi": 0.58, "area": 8208,  "ecosystem": "Coastal Mangrove"},
    "Sindhudurg": {"ndvi": 0.78, "evi": 0.61, "area": 5207,  "ecosystem": "Rich Mangrove"},
    "Palghar":    {"ndvi": 0.70, "evi": 0.53, "area": 5344,  "ecosystem": "Tidal Wetland"},
    "Pune":       {"ndvi": 0.42, "evi": 0.33, "area": 15642, "ecosystem": "Semi-Arid Forest"},
    "Nashik":     {"ndvi": 0.48, "evi": 0.38, "area": 15582, "ecosystem": "Tropical Dry Forest"},
    "Kolhapur":   {"ndvi": 0.55, "evi": 0.44, "area": 7685,  "ecosystem": "Western Ghats"},
    "Satara":     {"ndvi": 0.52, "evi": 0.41, "area": 10480, "ecosystem": "Ghats Forest"},
    "Sangli":     {"ndvi": 0.38, "evi": 0.30, "area": 8572,  "ecosystem": "Dry Scrubland"},
    "Solapur":    {"ndvi": 0.28, "evi": 0.21, "area": 14895, "ecosystem": "Semi-Arid Savanna"},
    "Aurangabad": {"ndvi": 0.34, "evi": 0.26, "area": 10107, "ecosystem": "Dry Deciduous"},
    "Nagpur":     {"ndvi": 0.46, "evi": 0.37, "area": 9892,  "ecosystem": "Central Plateau Forest"},
    "Amravati":   {"ndvi": 0.44, "evi": 0.35, "area": 12235, "ecosystem": "Vidarbha Forest"},
    "Yavatmal":   {"ndvi": 0.40, "evi": 0.31, "area": 13582, "ecosystem": "Cotton Belt Scrub"},
    "Chandrapur": {"ndvi": 0.62, "evi": 0.49, "area": 11443, "ecosystem": "Tadoba Forest"},
    "Gadchiroli": {"ndvi": 0.74, "evi": 0.58, "area": 14412, "ecosystem": "Tropical Moist Forest"},
    "Bhandara":   {"ndvi": 0.55, "evi": 0.44, "area": 3717,  "ecosystem": "Wainganga Forest"},
    "Gondia":     {"ndvi": 0.57, "evi": 0.46, "area": 5431,  "ecosystem": "Humid Forest"},
    "Wardha":     {"ndvi": 0.38, "evi": 0.30, "area": 6310,  "ecosystem": "Dry Deciduous"},
    "Washim":     {"ndvi": 0.32, "evi": 0.25, "area": 5150,  "ecosystem": "Semi-Arid"},
    "Akola":      {"ndvi": 0.31, "evi": 0.24, "area": 5431,  "ecosystem": "Semi-Arid Savanna"},
    "Buldhana":   {"ndvi": 0.36, "evi": 0.28, "area": 9661,  "ecosystem": "Dry Scrubland"},
    "Jalgaon":    {"ndvi": 0.35, "evi": 0.27, "area": 11765, "ecosystem": "Tapi Alluvial Plain"},
    "Dhule":      {"ndvi": 0.33, "evi": 0.26, "area": 8063,  "ecosystem": "Arid Savanna"},
    "Nandurbar":  {"ndvi": 0.51, "evi": 0.40, "area": 5037,  "ecosystem": "Tribal Forest Belt"},
    "Ahmednagar": {"ndvi": 0.37, "evi": 0.29, "area": 17048, "ecosystem": "Dry Plateau"},
    "Beed":       {"ndvi": 0.30, "evi": 0.23, "area": 10693, "ecosystem": "Semi-Arid"},
    "Latur":      {"ndvi": 0.27, "evi": 0.21, "area": 7157,  "ecosystem": "Deccan Plateau"},
    "Osmanabad":  {"ndvi": 0.29, "evi": 0.22, "area": 7569,  "ecosystem": "Dry Deccan"},
    "Nanded":     {"ndvi": 0.35, "evi": 0.27, "area": 10528, "ecosystem": "Godavari Basin"},
    "Hingoli":    {"ndvi": 0.36, "evi": 0.28, "area": 4527,  "ecosystem": "Dry Deciduous"},
    "Parbhani":   {"ndvi": 0.31, "evi": 0.24, "area": 6511,  "ecosystem": "Semi-Arid Flat"},
}


def geocode_location(location: str):
    """Nominatim geocoding: location name → (lat, lon, display_name)."""
    query = f"{location}, Maharashtra, India"
    url = (
        "https://nominatim.openstreetmap.org/search"
        f"?q={urllib.request.quote(query)}&format=json&limit=1"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "BlueCarbon-AI/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode())
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"]), data[0].get("display_name", query)
    except Exception as e:
        print(f"Geocoding error: {e}")
    return None, None, None


def fetch_modis_ndvi(lat: float, lon: float, token: str):
    """
    NASA AppEEARS point sample for MOD13Q1 250m NDVI.
    Returns NDVI in [0, 1] or None if unavailable.
    """
    try:
        url = (
            "https://appeears.earthdatacloud.nasa.gov/api/point/sample"
            f"?lat={lat}&lon={lon}&product=MOD13Q1&layer=_250m_16_days_NDVI"
        )
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            if isinstance(data, list) and data:
                raw = data[0].get("value", None)
                # MODIS NDVI scale factor = 10000; fill value = -3000
                if raw is not None and raw != -3000:
                    return round(float(raw) / 10000.0, 4)
    except Exception as e:
        print(f"MODIS NDVI fetch error: {e}")
    return None


def district_lookup(location: str):
    """Fuzzy-match location string against district knowledge base."""
    loc_lower = location.lower()
    for district, data in MAHARASHTRA_DISTRICTS.items():
        if district.lower() in loc_lower or loc_lower in district.lower():
            return district, data
    return None, None


def derive_bands(ndvi: float):
    """Derive RED and SWIR from NDVI using empirical coefficients."""
    red  = round(max(0.01, 0.15 - ndvi * 0.12), 4)
    swir = round(max(0.04, 0.20 - ndvi * 0.13), 4)
    return red, swir


def run_ml_pipeline(ndvi, evi, red, swir, area, biomass_model, anomaly_model):
    """Run anomaly detection + biomass regression + confidence scoring."""
    try:
        import pandas as pd
        features = pd.DataFrame(
            [[ndvi, evi, red, swir, area]],
            columns=["NDVI", "EVI", "RED", "SWIR", "Area"]
        )
    except ImportError:
        features = np.array([[ndvi, evi, red, swir, area]])

    anomaly_result = anomaly_model.predict(features)[0]
    if anomaly_result == -1:
        return None  # suspicious

    biomass       = max(0.0, float(biomass_model.predict(features)[0]))
    carbon        = round(max(0.0, biomass * 0.47), 2)
    anomaly_score = float(anomaly_model.decision_function(features)[0])
    confidence    = round(min(99.0, max(50.0, 50.0 + anomaly_score * 200.0)), 1)

    feature_names = ["NDVI", "EVI", "RED", "SWIR", "Area"]
    raw_imp = biomass_model.feature_importances_
    total   = raw_imp.sum() or 1.0
    importances = sorted(
        [{"feature": n, "importance": round(float(i / total) * 100, 2)}
         for n, i in zip(feature_names, raw_imp)],
        key=lambda x: x["importance"], reverse=True,
    )
    return {
        "predicted_biomass":   round(biomass, 2),
        "carbon_estimate":     carbon,
        "confidence_pct":      confidence,
        "feature_importances": importances,
    }


def register_geo_routes(app, biomass_model, anomaly_model):
    """Attach geo endpoints onto the FastAPI app instance."""

    @app.get("/geo-predict")
    def geo_predict(location: str, area: float = None):
        """
        Pipeline:
        1. Geocode → lat/lng (Nominatim, free, no key)
        2. Fetch live NDVI from NASA MODIS AppEEARS (NASA token)
        3. Fallback: district knowledge base or Maharashtra mean
        4. Run biomass/carbon/confidence ML pipeline
        """
        lat, lon, display_name = geocode_location(location)
        if lat is None:
            return {"error": f"Could not geocode '{location}'. Try a district or city name."}

        # District knowledge base lookup
        district_name, district_data = district_lookup(location)
        ecosystem_type = "Unknown"
        effective_area = area

        if district_data:
            ndvi_val = district_data["ndvi"]
            evi_val  = district_data["evi"]
            effective_area = area if area else district_data["area"]
            ecosystem_type = district_data["ecosystem"]
            ndvi_source = "district_knowledge_base"
        else:
            ndvi_val = 0.55
            evi_val  = 0.42
            effective_area = area if area else 500
            ndvi_source = "maharashtra_default"

        # Try NASA MODIS – overrides district baseline if successful
        nasa_token = os.environ.get("NASA_EARTHDATA_TOKEN", "")
        if nasa_token:
            modis_ndvi = fetch_modis_ndvi(lat, lon, nasa_token)
            if modis_ndvi is not None and 0.0 <= modis_ndvi <= 1.0:
                ndvi_val    = modis_ndvi
                evi_val     = round(ndvi_val * 0.78, 4)
                ndvi_source = "nasa_modis_live"

        red_val, swir_val = derive_bands(ndvi_val)

        ml = run_ml_pipeline(ndvi_val, evi_val, red_val, swir_val, effective_area,
                             biomass_model, anomaly_model)
        if ml is None:
            return {
                "location": display_name, "lat": lat, "lon": lon,
                "ndvi": ndvi_val, "ndvi_source": ndvi_source,
                "anomaly_detection_status": "suspicious_data",
                "message": "Environmental data appears outside normal range for this location",
            }

        return {
            "location":                 display_name,
            "lat":                      lat,
            "lon":                      lon,
            "district":                 district_name,
            "ecosystem_type":           ecosystem_type,
            "ndvi":                     ndvi_val,
            "evi":                      evi_val,
            "red":                      red_val,
            "swir":                     swir_val,
            "area_ha":                  effective_area,
            "ndvi_source":              ndvi_source,
            "anomaly_detection_status": "valid_data",
            **ml,
        }

    @app.get("/maharashtra-districts")
    def maharashtra_districts():
        """All districts with ML-estimated carbon stock — powers the regional heatmap."""
        results = []
        for district, data in MAHARASHTRA_DISTRICTS.items():
            ndvi = data["ndvi"]
            evi  = data["evi"]
            red, swir = derive_bands(ndvi)
            area = data["area"]
            ml = run_ml_pipeline(ndvi, evi, red, swir, area, biomass_model, anomaly_model)
            if ml:
                results.append({
                    "district":          district,
                    "ecosystem":         data["ecosystem"],
                    "ndvi":              ndvi,
                    "area_ha":           area,
                    "predicted_biomass": ml["predicted_biomass"],
                    "carbon_estimate":   ml["carbon_estimate"],
                    "confidence_pct":    ml["confidence_pct"],
                    "status":            "valid_data",
                })
            else:
                results.append({
                    "district": district, "ecosystem": data["ecosystem"],
                    "ndvi": ndvi, "area_ha": area,
                    "predicted_biomass": 0.0, "carbon_estimate": 0.0,
                    "confidence_pct": 0.0, "status": "suspicious_data",
                })

        results.sort(key=lambda x: x["carbon_estimate"], reverse=True)
        return {"districts": results, "total": len(results)}
