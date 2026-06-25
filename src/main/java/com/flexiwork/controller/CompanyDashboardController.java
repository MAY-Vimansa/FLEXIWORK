package com.flexiwork.controller;

import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.enums.ApplicationStatus;
import com.flexiwork.entity.enums.JobStatus;
import com.flexiwork.repository.ApplicationRepository;
import com.flexiwork.repository.JobPostRepository;
import com.flexiwork.security.CurrentUserService;
import com.flexiwork.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

/** Aggregated stats for the company owner's dashboard landing page. */
@RestController
@RequestMapping("/api/company/dashboard")
@PreAuthorize("hasRole('COMPANY')")
@Tag(name = "Company dashboard")
public class CompanyDashboardController {

    private final JobPostRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final PaymentService paymentService;
    private final CurrentUserService currentUserService;

    public CompanyDashboardController(JobPostRepository jobRepository,
                                      ApplicationRepository applicationRepository,
                                      PaymentService paymentService,
                                      CurrentUserService currentUserService) {
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.paymentService = paymentService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @Operation(summary = "Company dashboard statistics")
    public DashboardResponse dashboard() {
        var company = currentUserService.requireActingCompany();
        var jobs = jobRepository.findByCompany(company, PageRequest.of(0, 1000)).getContent();
        long open = jobs.stream().filter(j -> j.getStatus() == JobStatus.OPEN).count();
        long filled = jobs.stream().filter(j -> j.getStatus() == JobStatus.FILLED).count();
        long completed = jobs.stream().filter(j -> j.getStatus() == JobStatus.COMPLETED).count();
        long cancelled = jobs.stream().filter(j -> j.getStatus() == JobStatus.CANCELLED).count();
        long pendingApplicants = jobs.stream()
                .mapToLong(j -> applicationRepository.countByJobPostAndStatus(j, ApplicationStatus.PENDING))
                .sum();
        BigDecimal outstanding = paymentService.summary().totalOutstanding();
        return new DashboardResponse(jobs.size(), open, filled, completed, cancelled, pendingApplicants, outstanding,
                new CompanyInfo(company.getCompanyName(), company.getBrNumber(),
                        company.getDistrict() == null ? null : company.getDistrict().name(),
                        company.getAddressLine(), company.getLogoPath(), company.getStatus().name(),
                        company.isSuspended(), company.getApprovedAt()));
    }

    public record DashboardResponse(
            long totalJobs, long openJobs, long filledJobs, long completedJobs, long cancelledJobs,
            long pendingApplicants, BigDecimal outstandingCommission, CompanyInfo company) {
    }

    public record CompanyInfo(
            String companyName, String brNumber, String district, String addressLine,
            String logoPath, String verificationStatus, boolean suspended, java.time.Instant approvedAt) {
    }
}
