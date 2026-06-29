package com.flexiwork.entity;

import com.flexiwork.entity.enums.District;
import com.flexiwork.entity.enums.JobCategory;
import com.flexiwork.entity.enums.JobStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/** A temporary job posted by a company. The main CRUD entity of the platform. */
@Entity
@Table(name = "job_posts")
@Getter
@Setter
@NoArgsConstructor
public class JobPost extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private CompanyProfile company;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private JobCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private District district;

    @Column(nullable = false)
    private String addressLine;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private LocalDate jobDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyWage;

    @Column(nullable = false)
    private int workersNeeded;

    @Column(nullable = false)
    private int workersAccepted = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JobStatus status = JobStatus.OPEN;

    /** Guards concurrent accept/cancel updates to workersAccepted against overfilling the job. */
    @Version
    private Long version;
}
