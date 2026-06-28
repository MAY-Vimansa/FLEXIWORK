package com.flexiwork.entity;

import com.flexiwork.entity.enums.ApplicationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A worker's application to a job. A unique constraint on (job_post, worker) prevents a worker
 * from applying to the same job twice. {@link #qrCodeToken} is generated on acceptance and is
 * what the company/guard scans for attendance.
 */
@Entity
@Table(name = "applications",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_application_job_worker", columnNames = {"job_post_id", "worker_id"}))
@Getter
@Setter
@NoArgsConstructor
public class Application extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_post_id", nullable = false)
    private JobPost jobPost;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "worker_id", nullable = false)
    private WorkerProfile worker;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    /** Unique UUID generated when the application is ACCEPTED; encoded into the QR code. */
    @Column(unique = true)
    private String qrCodeToken;

    @Column(nullable = false)
    private Instant appliedAt = Instant.now();

    /** Set when the 2-hour shift reminder WhatsApp is sent; null means not yet sent. */
    @Column
    private Instant reminderSentAt;

    /** Cloudinary URL of the generated QR code image. */
    @Column
    private String qrImageUrl;
}
