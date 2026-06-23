package com.flexiwork.controller;

import com.flexiwork.dto.account.ChangeWhatsappRequest;
import com.flexiwork.dto.account.VerifyOtpRequest;
import com.flexiwork.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Worker WhatsApp verification (the third step of the worker registration flow). */
@RestController
@RequestMapping("/api/worker/whatsapp")
@PreAuthorize("hasRole('WORKER')")
@Tag(name = "Worker account")
public class WorkerAccountController {

    private final AccountService accountService;

    public WorkerAccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping("/send-otp")
    @Operation(summary = "Send a WhatsApp verification code to the worker's number")
    public ResponseEntity<Map<String, String>> sendOtp() {
        accountService.requestWhatsappOtp();
        return ResponseEntity.ok(Map.of("message", "Verification code sent via WhatsApp."));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify the WhatsApp code and mark the number verified")
    public ResponseEntity<Map<String, String>> verify(@Valid @RequestBody VerifyOtpRequest request) {
        accountService.verifyWhatsapp(request.otp());
        return ResponseEntity.ok(Map.of("message", "WhatsApp number verified."));
    }

    @PostMapping("/change/request")
    @Operation(summary = "Send a verification code to a new WhatsApp number to confirm the change")
    public ResponseEntity<Map<String, String>> requestChange(@Valid @RequestBody ChangeWhatsappRequest request) {
        accountService.requestWhatsappChange(request.newNumber());
        return ResponseEntity.ok(Map.of("message", "Verification code sent to the new number via WhatsApp."));
    }

    @PostMapping("/change/confirm")
    @Operation(summary = "Verify the code sent to the new number and apply the change")
    public ResponseEntity<Map<String, String>> confirmChange(@Valid @RequestBody VerifyOtpRequest request) {
        accountService.confirmWhatsappChange(request.otp());
        return ResponseEntity.ok(Map.of("message", "WhatsApp number updated."));
    }
}
