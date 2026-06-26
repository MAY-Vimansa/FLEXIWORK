package com.flexiwork.controller;

import com.flexiwork.dto.PageResponse;
import com.flexiwork.dto.job.JobFeedQuery;
import com.flexiwork.dto.job.JobRequest;
import com.flexiwork.dto.job.JobResponse;
import com.flexiwork.entity.enums.District;
import com.flexiwork.entity.enums.JobCategory;
import com.flexiwork.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Job posting endpoints. The public feed and single-job read require no auth; create/update/cancel
 * are restricted to COMPANY owners and COMPANY_POSTER staff via method security.
 */
@RestController
@RequestMapping("/api/jobs")
@Tag(name = "Jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    // ---- Public ----
    @GetMapping
    @Operation(summary = "Public job feed with filtering, sorting and pagination")
    public PageResponse<JobResponse> feed(
            @RequestParam(required = false) District district,
            @RequestParam(required = false) JobCategory category,
            @RequestParam(required = false) BigDecimal minWage,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(required = false) Double workerLat,
            @RequestParam(required = false) Double workerLng,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        JobFeedQuery query = new JobFeedQuery(
                district, category, minWage, date, keyword, sort, workerLat, workerLng);
        return jobService.feed(query, page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single job")
    public JobResponse getOne(@PathVariable Long id,
                              @RequestParam(required = false) Double workerLat,
                              @RequestParam(required = false) Double workerLng) {
        return jobService.getById(id, workerLat, workerLng);
    }

    // ---- Company / Poster ----
    @PostMapping
    @PreAuthorize("hasAnyRole('COMPANY','COMPANY_POSTER')")
    @Operation(summary = "Create a job post")
    @ResponseStatus(HttpStatus.CREATED)
    public JobResponse create(@Valid @RequestBody JobRequest request) {
        return jobService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY','COMPANY_POSTER')")
    @Operation(summary = "Update a job (only while OPEN)")
    public JobResponse update(@PathVariable Long id, @Valid @RequestBody JobRequest request) {
        return jobService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY','COMPANY_POSTER')")
    @Operation(summary = "Cancel a job (soft delete; notifies accepted workers)")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        jobService.cancel(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/extend")
    @PreAuthorize("hasAnyRole('COMPANY','COMPANY_POSTER')")
    @Operation(summary = "Extend a job's shift with extra per-worker pay for on-site workers")
    public JobResponse extend(@PathVariable Long id,
                              @Valid @RequestBody com.flexiwork.dto.job.ExtendShiftRequest request) {
        return jobService.extendShift(id, request.newEndTime(), request.extraWage());
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('COMPANY','COMPANY_POSTER')")
    @Operation(summary = "List the acting company's own jobs")
    public PageResponse<JobResponse> myJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return jobService.myJobs(page, size);
    }
}
