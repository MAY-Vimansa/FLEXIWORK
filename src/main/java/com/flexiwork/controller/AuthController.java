package com.flexiwork.controller;

import com.flexiwork.dto.account.ForgotPasswordRequest;
import com.flexiwork.dto.account.ResetPasswordRequest;
import com.flexiwork.dto.auth.AuthResponse;
import com.flexiwork.dto.auth.CurrentUserResponse;
import com.flexiwork.dto.auth.LoginRequest;
import com.flexiwork.service.AccountService;
import com.flexiwork.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** JWT authentication endpoints (public login + authenticated self-lookup). */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;
    private final AccountService accountService;

    public AuthController(AuthService authService, AccountService accountService) {
        this.authService = authService;
        this.accountService = accountService;
    }

    @PostMapping("/login")
    @Operation(summary = "Log in and receive a JWT")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Describe the currently authenticated user")
    public ResponseEntity<CurrentUserResponse> me() {
        return ResponseEntity.ok(authService.currentUser());
    }

    @PostMapping("/password/forgot")
    @Operation(summary = "Request a password reset code by email")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        accountService.requestPasswordReset(request.email());
        return ResponseEntity.ok(Map.of("message",
                "If that email exists, a reset code has been sent."));
    }

    @PostMapping("/password/reset")
    @Operation(summary = "Reset the password using an emailed OTP")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        accountService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password updated. You can now log in."));
    }
}
