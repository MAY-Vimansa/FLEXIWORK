package com.flexiwork.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Single-row table holding the admin-tunable business rules. Always read/written through
 * {@link com.flexiwork.service.SettingsService} so the rest of the app never caches a stale value
 * — a change here applies on the very next read, no restart needed.
 */
@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
public class SystemSettings {

    /** Fixed at 1 — this table only ever has one row. */
    @Id
    private Long id = 1L;

    private BigDecimal commissionRate;

    private int paymentGraceDays;

    private int approvalAutoWindowMinutes;

    private int cancelCutoffHours;
}
