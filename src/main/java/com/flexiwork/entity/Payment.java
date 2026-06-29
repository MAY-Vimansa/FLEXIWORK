package com.flexiwork.entity;

import com.flexiwork.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * A commission charge owed by a company for one completed job. The {@link #commissionRate} is
 * snapshotted at creation time so historical payments stay correct even if the platform rate
 * changes later — calculations must use this stored value, never a hardcoded constant.
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
public class Payment extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_post_id", nullable = false)
    private JobPost jobPost;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private CompanyProfile company;

    /** Number of verified attendances this commission was billed on. */
    @Column(nullable = false)
    private int workersAttended;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalWages;

    /** Snapshot of the commission rate (e.g. 0.10) at the time this payment was created. */
    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal commissionRate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal commissionAmount;

    @Column(nullable = false)
    private LocalDate jobDate;

    /** Payment deadline (creation + grace days). Past this while PENDING ⇒ OVERDUE + company ban.
     *  Always set in {@code PaymentService.completeJobAndBill} at creation time. */
    @Column(nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDING;

    /** Format FLX-YYYY-NNNNN. */
    @Column(unique = true)
    private String receiptNumber;

    private String transactionId;

    private Instant paidAt;
}
