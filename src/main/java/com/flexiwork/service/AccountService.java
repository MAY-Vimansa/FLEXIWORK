package com.flexiwork.service;

import com.flexiwork.dto.account.ResetPasswordRequest;
import com.flexiwork.entity.User;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.OtpPurpose;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.repository.UserRepository;
import com.flexiwork.repository.WorkerProfileRepository;
import com.flexiwork.security.CurrentUserService;
import com.flexiwork.util.PhoneUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Account self-service: password reset via email OTP, and WhatsApp number verification via WhatsApp
 * OTP. OTP creation/validation is delegated to {@link OtpService}; delivery to {@link EmailService}
 * / {@link WhatsAppClient}.
 */
@Service
public class AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountService.class);

    private final UserRepository userRepository;
    private final WorkerProfileRepository workerRepository;
    private final OtpService otpService;
    private final EmailService emailService;
    private final WhatsAppClient whatsAppClient;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;

    public AccountService(UserRepository userRepository,
                          WorkerProfileRepository workerRepository,
                          OtpService otpService,
                          EmailService emailService,
                          WhatsAppClient whatsAppClient,
                          PasswordEncoder passwordEncoder,
                          CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.workerRepository = workerRepository;
        this.otpService = otpService;
        this.emailService = emailService;
        this.whatsAppClient = whatsAppClient;
        this.passwordEncoder = passwordEncoder;
        this.currentUserService = currentUserService;
    }

    /** Email a password-reset OTP. Always succeeds outwardly to avoid leaking which emails exist. */
    @Transactional
    public void requestPasswordReset(String email) {
        userRepository.findByEmail(email).ifPresentOrElse(user -> {
            String code = otpService.generate(user.getId(), OtpPurpose.PASSWORD_RESET);
            emailService.send(email, "Your FlexiWork password reset code",
                    "Your password reset code is " + code + ". It expires in 5 minutes.");
        }, () -> log.info("Password reset requested for unknown email {} (ignored)", email));
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new BusinessException("Invalid reset request"));
        otpService.verify(user.getId(), OtpPurpose.PASSWORD_RESET, req.otp());
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
    }

    /** Send a WhatsApp verification code to the logged-in worker's number. */
    @Transactional
    public void requestWhatsappOtp() {
        WorkerProfile worker = requireWorker();
        if (worker.getWhatsappNumber() == null) {
            throw new BusinessException("No WhatsApp number on file");
        }
        String code = otpService.generate(worker.getUser().getId(), OtpPurpose.WHATSAPP_VERIFY);
        whatsAppClient.sendText(worker.getWhatsappNumber(),
                "Your FlexiWork verification code is " + code + ". It expires in 5 minutes.");
    }

    /** Step 1: confirm current password, then email an OTP to the new address to prove ownership
     *  before it becomes the login email. */
    @Transactional
    public void requestEmailChange(String currentPassword, String newEmail) {
        User user = currentUserService.requireCurrentUser();
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BusinessException("Current password is incorrect");
        }
        if (userRepository.existsByEmail(newEmail)) {
            throw new BusinessException("That email is already in use");
        }
        String code = otpService.generate(user.getId(), OtpPurpose.EMAIL_CHANGE, newEmail);
        emailService.send(newEmail, "Confirm your new FlexiWork email",
                "Your email change confirmation code is " + code + ". It expires in 5 minutes.");
    }

    /** Step 2: verify the OTP sent to the new address and apply the change. */
    @Transactional
    public void confirmEmailChange(String otp) {
        User user = currentUserService.requireCurrentUser();
        String newEmail = otpService.verifyAndGetPayload(user.getId(), OtpPurpose.EMAIL_CHANGE, otp);
        if (userRepository.existsByEmail(newEmail)) {
            throw new BusinessException("That email is already in use");
        }
        user.setEmail(newEmail);
        userRepository.save(user);
    }

    @Transactional
    public void verifyWhatsapp(String otp) {
        WorkerProfile worker = requireWorker();
        otpService.verify(worker.getUser().getId(), OtpPurpose.WHATSAPP_VERIFY, otp);
        worker.setWhatsappVerified(true);
        workerRepository.save(worker);
    }

    /** Step 1: send an OTP to the candidate new number to prove the worker controls it before it
     *  replaces the current one. */
    @Transactional
    public void requestWhatsappChange(String newNumberRaw) {
        WorkerProfile worker = requireWorker();
        String newNumber = PhoneUtil.toE164(newNumberRaw);
        if (workerRepository.findByWhatsappNumber(newNumber).isPresent()) {
            throw new BusinessException("That WhatsApp number is already registered");
        }
        String code = otpService.generate(worker.getUser().getId(), OtpPurpose.WHATSAPP_CHANGE, newNumber);
        whatsAppClient.sendText(newNumber,
                "Your FlexiWork verification code is " + code + ". It expires in 5 minutes.");
    }

    /** Step 2: verify the OTP sent to the new number and apply the change. */
    @Transactional
    public void confirmWhatsappChange(String otp) {
        WorkerProfile worker = requireWorker();
        String newNumber = otpService.verifyAndGetPayload(worker.getUser().getId(), OtpPurpose.WHATSAPP_CHANGE, otp);
        if (workerRepository.findByWhatsappNumber(newNumber).isPresent()) {
            throw new BusinessException("That WhatsApp number is already registered");
        }
        worker.setWhatsappNumber(newNumber);
        worker.setWhatsappVerified(true);
        workerRepository.save(worker);
    }

    private WorkerProfile requireWorker() {
        Long userId = currentUserService.requireCurrentUser().getId();
        return workerRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Worker profile not found"));
    }
}
