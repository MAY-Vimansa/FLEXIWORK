package com.flexiwork.controller;

import com.flexiwork.dto.application.ApplicantResponse;
import com.flexiwork.dto.application.ApplicationResponse;
import com.flexiwork.dto.application.ApplyRequest;
import com.flexiwork.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Worker application endpoints and company-side accept/reject of applicants. */
@RestController
@RequestMapping("/api/applications")
@Tag(name = "Applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    // ---- Worker ----
    @PostMapping
    @PreAuthorize("hasRole('WORKER')")
    @Operation(summary = "Apply for a job")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse apply(@Valid @RequestBody ApplyRequest request) {
        return applicationService.apply(request.jobId());
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('WORKER')")
    @Operation(summary = "List the worker's own applications (with QR for accepted ones)")
    public List<ApplicationResponse> mine() {
        return applicationService.myApplications();
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('WORKER')")
    @Operation(summary = "Cancel one of the worker's own applications")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        applicationService.cancelOwn(id);
        return ResponseEntity.noContent().build();
    }

    // ---- Company / Poster ----
    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasAnyRole('COMPANY','COMPANY_POSTER')")
    @Operation(summary = "List applicants for one of the company's jobs (read-only; acceptance is automatic)")
    public List<ApplicantResponse> applicants(@PathVariable Long jobId) {
        return applicationService.applicantsForJob(jobId);
    }
}
