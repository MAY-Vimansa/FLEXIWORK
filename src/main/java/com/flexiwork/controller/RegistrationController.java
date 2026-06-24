package com.flexiwork.controller;

import com.flexiwork.dto.registration.CompanyRegistrationRequest;
import com.flexiwork.dto.registration.RegistrationResponse;
import com.flexiwork.dto.registration.WorkerRegistrationRequest;
import com.flexiwork.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Public self-registration endpoints. Each consumes {@code multipart/form-data}: a JSON {@code data}
 * part carrying the validated fields plus the required file parts. New accounts are PENDING.
 */
@RestController
@RequestMapping("/api/auth/register")
@Tag(name = "Registration")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping(value = "/worker", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Register a worker (profile photo + NIC front/back required)")
    @ResponseStatus(HttpStatus.CREATED)
    public RegistrationResponse registerWorker(
            @Valid @RequestPart("data") WorkerRegistrationRequest data,
            @RequestPart("profilePhoto") MultipartFile profilePhoto,
            @RequestPart("nicFront") MultipartFile nicFront,
            @RequestPart("nicBack") MultipartFile nicBack) {
        return registrationService.registerWorker(data, profilePhoto, nicFront, nicBack);
    }

    @PostMapping(value = "/company", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Register a company (BR certificate + logo + premises photo required)")
    @ResponseStatus(HttpStatus.CREATED)
    public RegistrationResponse registerCompany(
            @Valid @RequestPart("data") CompanyRegistrationRequest data,
            @RequestPart("brCertificate") MultipartFile brCertificate,
            @RequestPart("logo") MultipartFile logo,
            @RequestPart("premisesPhoto") MultipartFile premisesPhoto) {
        return registrationService.registerCompany(data, brCertificate, logo, premisesPhoto);
    }
}
