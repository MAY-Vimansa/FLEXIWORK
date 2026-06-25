package com.flexiwork.controller;

import com.flexiwork.dto.staff.CreateStaffRequest;
import com.flexiwork.dto.staff.StaffResponse;
import com.flexiwork.service.StaffService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Company-owner-only staff (guard/poster) management. */
@RestController
@RequestMapping("/api/company/staff")
@PreAuthorize("hasRole('COMPANY')")
@Tag(name = "Staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @PostMapping
    @Operation(summary = "Create a guard or poster sub-account")
    @ResponseStatus(HttpStatus.CREATED)
    public StaffResponse create(@Valid @RequestBody CreateStaffRequest request) {
        return staffService.create(request);
    }

    @GetMapping
    @Operation(summary = "List the company's staff accounts")
    public List<StaffResponse> list() {
        return staffService.list();
    }

    @PutMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a staff account")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        staffService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
