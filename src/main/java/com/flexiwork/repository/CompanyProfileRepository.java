package com.flexiwork.repository;

import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface CompanyProfileRepository extends JpaRepository<CompanyProfile, Long>,
        JpaSpecificationExecutor<CompanyProfile> {

    Optional<CompanyProfile> findByUserId(Long userId);

    List<CompanyProfile> findByStatus(VerificationStatus status);

    /** PENDING profiles registered before a cutoff — auto-approval targets. */
    List<CompanyProfile> findByStatusAndCreatedAtBefore(VerificationStatus status, java.time.Instant cutoff);

    /** Currently suspended companies (admin overview). */
    List<CompanyProfile> findBySuspendedTrue();

    long countByStatus(VerificationStatus status);
}
