package com.flexiwork.entity;

import com.flexiwork.entity.enums.District;
import com.flexiwork.entity.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Profile + KYC details for a worker. Workers cannot apply for jobs until an admin verifies
 * their NIC photos (status becomes VERIFIED). NIC number and NIC photos are immutable after
 * verification — editing them resets the status to PENDING for re-verification.
 */
@Entity
@Table(name = "worker_profiles")
@Getter
@Setter
@NoArgsConstructor
public class WorkerProfile extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String nicNumber;

    /** Stored in E.164 form, e.g. +94771234567. */
    private String whatsappNumber;

    @Column(nullable = false)
    private boolean whatsappVerified = false;

    private String profilePhotoPath;
    private String nicFrontPath;
    private String nicBackPath;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private District district;

    private Double latitude;
    private Double longitude;

    @Column(length = 500)
    private String skills;

    @Column(nullable = false)
    private double ratingAverage = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VerificationStatus status = VerificationStatus.PENDING;

    /** When the profile became VERIFIED (manual or auto-approval); for display. */
    private java.time.Instant approvedAt;
}
