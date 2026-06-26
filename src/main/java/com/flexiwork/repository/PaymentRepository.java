package com.flexiwork.repository;

import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.Payment;
import com.flexiwork.entity.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByJobPost(JobPost jobPost);

    boolean existsByJobPost(JobPost jobPost);

    List<Payment> findByCompany(CompanyProfile company);

    List<Payment> findByCompanyAndStatus(CompanyProfile company, PaymentStatus status);

    long countByReceiptNumberStartingWith(String prefix);

    /** PENDING payments past their due date — overdue + ban targets. */
    List<Payment> findByStatusAndDueDateBefore(PaymentStatus status, java.time.LocalDate date);

    /** Eagerly fetch company + job for the notification feed. */
    @Query("select p from Payment p join fetch p.company join fetch p.jobPost where p.status = :status order by p.id desc")
    List<Payment> findByStatusWithDetails(PaymentStatus status);

    /** Any still-unpaid (PENDING/OVERDUE) payments for a company — used to lift a suspension. */
    List<Payment> findByCompanyAndStatusIn(CompanyProfile company, java.util.Collection<PaymentStatus> statuses);

    /** Eagerly fetch company + job so the admin payments view can read them after the tx closes. */
    @Query("select p from Payment p join fetch p.company join fetch p.jobPost order by p.id desc")
    List<Payment> findAllWithDetails();

    @Query("select coalesce(sum(p.commissionAmount), 0) from Payment p where p.status = :status")
    BigDecimal sumCommissionByStatus(PaymentStatus status);
}
