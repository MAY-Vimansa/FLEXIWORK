package com.flexiwork.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Records that an accepted worker physically checked in (and later out) for a job, created when
 * their QR code is scanned. One attendance per application. Only checked-in attendances are billed
 * commission. {@link #extraWage} accumulates any shift-extension pay the worker earned while still
 * on-site, so their total day pay = job.dailyWage + extraWage.
 */
@Entity
@Table(name = "attendances")
@Getter
@Setter
@NoArgsConstructor
public class Attendance extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private Application application;

    @Column(nullable = false)
    private Instant checkInTime;

    /** Set on the second scan (check-out); null while the worker is still on-site. */
    private Instant checkOutTime;

    @Column(nullable = false)
    private boolean verified = true;

    /** Accumulated shift-extension pay earned by this worker (added while still checked-in). */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal extraWage = BigDecimal.ZERO;

    /** User id of the COMPANY owner or COMPANY_GUARD who performed the check-in scan. Always set
     *  when the row is created (see {@code AttendanceService.scan}). */
    @Column(nullable = false)
    private Long scannedByUserId;

    /** User id of whoever performed the check-out scan. */
    private Long scannedOutByUserId;
}
