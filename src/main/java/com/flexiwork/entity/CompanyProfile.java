package com.flexiwork.entity;

import com.flexiwork.entity.enums.District;
import com.flexiwork.entity.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Profile + KYC details for a company (the owner account). Companies cannot post jobs until an
 * admin verifies the uploaded BR certificate (status becomes VERIFIED).
 */
@Entity
@Table(name = "company_profiles")
@Getter
@Setter
@NoArgsConstructor
public class CompanyProfile extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String brNumber;

    private String brCertificatePath;
    private String logoPath;
    private String outsidePhotoPath;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private District district;

    private String addressLine;

    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VerificationStatus status = VerificationStatus.PENDING;

    /** When the profile became VERIFIED (manual or auto-approval); for display. */
    private java.time.Instant approvedAt;

    /** Set true when the company misses the payment deadline; gates all company actions. */
    @Column(nullable = false)
    private boolean suspended = false;

    private java.time.Instant suspendedAt;
}
