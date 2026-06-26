package com.flexiwork.controller;

import com.flexiwork.dto.attendance.JobWorkerRow;
import com.flexiwork.dto.attendance.PreviewResponse;
import com.flexiwork.dto.attendance.ScanRequest;
import com.flexiwork.dto.attendance.ScanResponse;
import com.flexiwork.dto.attendance.TodayJobSummary;
import com.flexiwork.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** QR attendance endpoints for the company owner and guard kiosk. */
@RestController
@RequestMapping("/api/attendance")
@Tag(name = "Attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping("/preview/{token}")
    @PreAuthorize("hasAnyRole('COMPANY','COMPANY_GUARD')")
    @Operation(summary = "Preview what would happen if this QR token is scanned (read-only)")
    public PreviewResponse preview(@PathVariable String token) {
        return attendanceService.preview(token);
    }

    @PostMapping("/scan")
    @PreAuthorize("hasAnyRole('COMPANY','COMPANY_GUARD')")
    @Operation(summary = "Scan a worker's QR code to mark attendance")
    public ScanResponse scan(@Valid @RequestBody ScanRequest request) {
        return attendanceService.scan(request.token());
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('COMPANY','COMPANY_GUARD')")
    @Operation(summary = "Today's jobs for the kiosk, with live accepted/checked-in counts")
    public List<TodayJobSummary> today() {
        return attendanceService.todaysJobs();
    }

    @GetMapping("/jobs/{jobId}/workers")
    @PreAuthorize("hasAnyRole('COMPANY','COMPANY_GUARD')")
    @Operation(summary = "Accepted workers for a job with live check-in status")
    public List<JobWorkerRow> jobWorkers(@PathVariable Long jobId) {
        return attendanceService.jobWorkers(jobId);
    }
}
