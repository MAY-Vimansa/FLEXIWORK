package com.flexiwork.repository;

import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, Long>,
        JpaSpecificationExecutor<WorkerProfile> {

    Optional<WorkerProfile> findByUserId(Long userId);

    Optional<WorkerProfile> findByWhatsappNumber(String whatsappNumber);

    List<WorkerProfile> findByStatus(VerificationStatus status);

    /** PENDING profiles registered before a cutoff — auto-approval targets. */
    List<WorkerProfile> findByStatusAndCreatedAtBefore(VerificationStatus status, java.time.Instant cutoff);

    long countByStatus(VerificationStatus status);
}
