package com.flexiwork.util;

/** Geospatial helpers: Sri Lanka bounds + Haversine distance + Google Maps navigation links. */
public final class GeoUtil {

    // Approximate bounding box of Sri Lanka, used for coordinate validation.
    public static final double MIN_LAT = 5.5;
    public static final double MAX_LAT = 10.0;
    public static final double MIN_LNG = 79.5;
    public static final double MAX_LNG = 82.0;

    private static final double EARTH_RADIUS_KM = 6371.0;

    private GeoUtil() {
    }

    public static boolean withinSriLanka(Double lat, Double lng) {
        return lat != null && lng != null
                && lat >= MIN_LAT && lat <= MAX_LAT
                && lng >= MIN_LNG && lng <= MAX_LNG;
    }

    /** Great-circle distance in kilometres between two points, rounded to one decimal place. */
    public static Double distanceKm(Double lat1, Double lng1, Double lat2, Double lng2) {
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
            return null;
        }
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(EARTH_RADIUS_KM * c * 10.0) / 10.0;
    }

    /** Google Maps directions deep link to a destination (no API key required). */
    public static String mapsDirectionsLink(Double lat, Double lng) {
        if (lat == null || lng == null) {
            return null;
        }
        return "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng;
    }
}
