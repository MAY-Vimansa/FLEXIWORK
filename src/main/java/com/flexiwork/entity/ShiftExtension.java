package com.flexiwork.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalTime;

/**
 * Audit record of a shift extension: when a company extended a job's end time and granted an extra
 * per-worker wage, applied to the workers still checked-in at that moment. Kept for history and for
 * the payment/receipt breakdown.
 */
@Entity
@Table(name = "shift_extensions")
@Getter
@Setter
@NoArgsConstructor
public class ShiftExtension extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_post_id", nullable = false)
    private JobPost jobPost;

    /** Per-worker extra wage granted by this extension. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal extraWage;

    @Column(nullable = false)
    private LocalTime newEndTime;

    /** How many on-site workers received this extension. */
    @Column(nullable = false)
    private int appliedToCount;
}
