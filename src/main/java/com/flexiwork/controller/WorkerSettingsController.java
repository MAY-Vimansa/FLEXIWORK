package com.flexiwork.controller;

import com.flexiwork.dto.account.ChangeEmailRequest;
import com.flexiwork.dto.account.VerifyOtpRequest;
import com.flexiwork.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Worker account settings. Email change is two-step: confirm current password, then prove
 *  ownership of the new address with an emailed OTP before it becomes the login email. */
@RestController
@RequestMapping("/api/worker/account")
@PreAuthorize("hasRole('WORKER')")
@Tag(name = "Worker account")
public class WorkerSettingsController {

    private final AccountService accountService;

    public WorkerSettingsController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping("/email/request")
    @Operation(summary = "Step 1: confirm password, send confirmation code to the new email")
    public ResponseEntity<Map<String, String>> requestEmailChange(
            @Valid @RequestBody ChangeEmailRequest request) {
        accountService.requestEmailChange(request.currentPassword(), request.newEmail());
        return ResponseEntity.ok(Map.of("message", "Confirmation code sent to your new email."));
    }

    @PostMapping("/email/confirm")
    @Operation(summary = "Step 2: verify the code sent to the new email and apply the change")
    public ResponseEntity<Map<String, String>> confirmEmailChange(
            @Valid @RequestBody VerifyOtpRequest request) {
        accountService.confirmEmailChange(request.otp());
        return ResponseEntity.ok(Map.of("message", "Email updated. Use it next time you log in."));
    }
}
