package com.flexiwork.service;

import com.flexiwork.dto.auth.AuthResponse;
import com.flexiwork.dto.auth.CurrentUserResponse;
import com.flexiwork.dto.auth.LoginRequest;
import com.flexiwork.entity.User;
import com.flexiwork.repository.WorkerProfileRepository;
import com.flexiwork.security.CurrentUserService;
import com.flexiwork.security.JwtService;
import com.flexiwork.util.PhoneUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.flexiwork.repository.UserRepository;

/** Authentication use cases for the JWT chain: login and current-user lookup. */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentUserService currentUserService;
    private final LoginAttemptService loginAttemptService;

    public AuthService(UserRepository userRepository,
                       WorkerProfileRepository workerProfileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       CurrentUserService currentUserService,
                       LoginAttemptService loginAttemptService) {
        this.userRepository = userRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.currentUserService = currentUserService;
        this.loginAttemptService = loginAttemptService;
    }

    public AuthResponse login(LoginRequest request) {
        String id = request.identifier().trim();
        loginAttemptService.checkNotLocked(id);
        User user = resolveUser(id).orElse(null);
        if (user == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            loginAttemptService.onFailure(id);
            throw new BadCredentialsException("Invalid email or password");
        }
        if (!user.isActive()) {
            throw new DisabledException("This account has been deactivated");
        }
        loginAttemptService.onSuccess(id);
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole().name());
    }

    private java.util.Optional<User> resolveUser(String identifier) {
        // Try email first
        if (identifier.contains("@")) {
            return userRepository.findByEmail(identifier);
        }
        // Otherwise normalise as a Sri Lankan mobile number and look up via WorkerProfile
        try {
            String e164 = PhoneUtil.toE164(identifier);
            return workerProfileRepository.findByWhatsappNumber(e164)
                    .map(wp -> wp.getUser());
        } catch (Exception ignored) {
            return java.util.Optional.empty();
        }
    }

    public CurrentUserResponse currentUser() {
        User user = currentUserService.requireCurrentUser();
        Long parentId = user.getParentCompany() != null ? user.getParentCompany().getId() : null;
        boolean suspended = false;
        switch (user.getRole()) {
            case COMPANY, COMPANY_GUARD, COMPANY_POSTER -> {
                try {
                    suspended = currentUserService.requireActingCompany().isSuspended();
                } catch (RuntimeException ignored) {
                    // no company resolvable yet — treat as not suspended
                }
            }
            default -> { }
        }
        return new CurrentUserResponse(
                user.getId(), user.getEmail(), user.getRole().name(), user.isActive(), parentId, suspended);
    }
}
