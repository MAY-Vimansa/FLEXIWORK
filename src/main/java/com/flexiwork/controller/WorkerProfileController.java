package com.flexiwork.controller;

import com.flexiwork.dto.worker.WorkerProfileResponse;
import com.flexiwork.dto.worker.WorkerProfileUpdateRequest;
import com.flexiwork.service.WorkerProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** The logged-in worker's own profile. */
@RestController
@RequestMapping("/api/worker/profile")
@PreAuthorize("hasRole('WORKER')")
@Tag(name = "Worker profile")
public class WorkerProfileController {

    private final WorkerProfileService workerProfileService;

    public WorkerProfileController(WorkerProfileService workerProfileService) {
        this.workerProfileService = workerProfileService;
    }

    @GetMapping
    @Operation(summary = "Get my worker profile")
    public WorkerProfileResponse get() {
        return workerProfileService.myProfile();
    }

    @PutMapping
    @Operation(summary = "Update my editable profile fields")
    public WorkerProfileResponse update(@Valid @RequestBody WorkerProfileUpdateRequest request) {
        return workerProfileService.update(request);
    }

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Replace my profile photo")
    public WorkerProfileResponse photo(@RequestPart("photo") MultipartFile photo) {
        return workerProfileService.replacePhoto(photo);
    }
}
