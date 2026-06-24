package com.flexiwork.service;

import com.flexiwork.dto.registration.CompanyRegistrationRequest;
import com.flexiwork.dto.registration.RegistrationResponse;
import com.flexiwork.dto.registration.WorkerRegistrationRequest;
import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.User;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.Role;
import com.flexiwork.entity.enums.VerificationStatus;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.repository.CompanyProfileRepository;
import com.flexiwork.repository.UserRepository;
import com.flexiwork.repository.WorkerProfileRepository;
import com.flexiwork.util.PhoneUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Worker and company self-registration with KYC file uploads. New accounts are created PENDING and
 * cannot apply for / post jobs until an admin verifies them. Uploaded files are validated
 * server-side (type + size) by {@link FileStorageService}.
 */
@Service
public class RegistrationService {

    private final UserRepository userRepository;
    private final WorkerProfileRepository workerRepository;
    private final CompanyProfileRepository companyRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(UserRepository userRepository,
                               WorkerProfileRepository workerRepository,
                               CompanyProfileRepository companyRepository,
                               FileStorageService fileStorageService,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.workerRepository = workerRepository;
        this.companyRepository = companyRepository;
        this.fileStorageService = fileStorageService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public RegistrationResponse registerWorker(WorkerRegistrationRequest req,
                                               MultipartFile profilePhoto,
                                               MultipartFile nicFront,
                                               MultipartFile nicBack) {
        requireEmailAvailable(req.email());
        String whatsapp = PhoneUtil.toE164(req.whatsappNumber());

        User user = new User();
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRole(Role.WORKER);
        user.setActive(true);
        user = userRepository.save(user);

        String dir = "workers/" + user.getId();
        String kycDir = "kyc/workers/" + user.getId();
        WorkerProfile profile = new WorkerProfile();
        profile.setUser(user);
        profile.setFullName(req.fullName());
        profile.setNicNumber(req.nicNumber());
        profile.setWhatsappNumber(whatsapp);
        profile.setWhatsappVerified(false);
        profile.setDistrict(req.district());
        profile.setLatitude(req.latitude());
        profile.setLongitude(req.longitude());
        profile.setSkills(req.skills());
        profile.setProfilePhotoPath(fileStorageService.storeImage(profilePhoto, dir));
        profile.setNicFrontPath(fileStorageService.storeImage(nicFront, kycDir));
        profile.setNicBackPath(fileStorageService.storeImage(nicBack, kycDir));
        profile.setStatus(VerificationStatus.PENDING);
        workerRepository.save(profile);

        return new RegistrationResponse(user.getId(), user.getEmail(), Role.WORKER.name(),
                VerificationStatus.PENDING.name(),
                "Registration successful. Verify your WhatsApp number, then await admin approval.");
    }

    @Transactional
    public RegistrationResponse registerCompany(CompanyRegistrationRequest req,
                                                MultipartFile brCertificate,
                                                MultipartFile logo,
                                                MultipartFile premisesPhoto) {
        requireEmailAvailable(req.email());

        User user = new User();
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRole(Role.COMPANY);
        user.setActive(true);
        user = userRepository.save(user);

        String dir = "companies/" + user.getId();
        String kycDir = "kyc/companies/" + user.getId();
        CompanyProfile profile = new CompanyProfile();
        profile.setUser(user);
        profile.setCompanyName(req.companyName());
        profile.setBrNumber(req.brNumber());
        profile.setDistrict(req.district());
        profile.setAddressLine(req.addressLine());
        profile.setLatitude(req.latitude());
        profile.setLongitude(req.longitude());
        profile.setBrCertificatePath(fileStorageService.storeDocument(brCertificate, kycDir));
        profile.setLogoPath(fileStorageService.storeImage(logo, dir));
        profile.setOutsidePhotoPath(fileStorageService.storeImage(premisesPhoto, dir));
        profile.setStatus(VerificationStatus.PENDING);
        companyRepository.save(profile);

        return new RegistrationResponse(user.getId(), user.getEmail(), Role.COMPANY.name(),
                VerificationStatus.PENDING.name(),
                "Registration successful. Await admin verification of your BR certificate.");
    }

    private void requireEmailAvailable(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("An account with this email already exists");
        }
    }
}
