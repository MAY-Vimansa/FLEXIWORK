package com.flexiwork.entity.enums;

/**
 * The 25 administrative districts of Sri Lanka. {@code centerLat}/{@code centerLng} let the
 * frontend map jump to a district's centre when a user selects it in the pin picker.
 */
public enum District {
    AMPARA(7.2917, 81.6720),
    ANURADHAPURA(8.3114, 80.4037),
    BADULLA(6.9934, 81.0550),
    BATTICALOA(7.7170, 81.7000),
    COLOMBO(6.9271, 79.8612),
    GALLE(6.0535, 80.2210),
    GAMPAHA(7.0917, 80.0000),
    HAMBANTOTA(6.1240, 81.1185),
    JAFFNA(9.6615, 80.0255),
    KALUTARA(6.5854, 79.9607),
    KANDY(7.2906, 80.6337),
    KEGALLE(7.2513, 80.3464),
    KILINOCHCHI(9.3803, 80.3770),
    KURUNEGALA(7.4863, 80.3647),
    MANNAR(8.9810, 79.9044),
    MATALE(7.4675, 80.6234),
    MATARA(5.9549, 80.5550),
    MONARAGALA(6.8728, 81.3510),
    MULLAITIVU(9.2671, 80.8142),
    NUWARA_ELIYA(6.9497, 80.7891),
    POLONNARUWA(7.9403, 81.0188),
    PUTTALAM(8.0362, 79.8283),
    RATNAPURA(6.6828, 80.3992),
    TRINCOMALEE(8.5874, 81.2152),
    VAVUNIYA(8.7514, 80.4971);

    private final double centerLat;
    private final double centerLng;

    District(double centerLat, double centerLng) {
        this.centerLat = centerLat;
        this.centerLng = centerLng;
    }

    public double getCenterLat() {
        return centerLat;
    }

    public double getCenterLng() {
        return centerLng;
    }
}
