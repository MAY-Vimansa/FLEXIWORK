package com.flexiwork.service;

import com.flexiwork.dto.staff.CreateStaffRequest;
import com.flexiwork.dto.staff.StaffResponse;
import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.User;
import com.flexiwork.entity.enums.Role;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.exception.ResourceNotFoundException;
import com.flexiwork.repository.UserRepository;
import com.flexiwork.security.CurrentUserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Company-owner management of staff sub-accounts (one ACTIVE guard + one ACTIVE poster at a time).
 * Deactivating a staff member frees their role slot — sub-account rows are never deleted (kept for
 * audit/history). Re-adding the same email reactivates that deactivated row (so the owner can reuse
 * the address); a different email simply creates a fresh row. Staff are always scoped to the
 * owner's company via {@code parentCompany}, resolved from the authenticated owner.
 */
@Service
public class StaffService {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final PasswordEncoder passwordEncoder;

    public StaffService(UserRepository userRepository,
                        CurrentUserService currentUserService,
                        PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public StaffResponse create(CreateStaffRequest req) {
        if (req.role() != Role.COMPANY_GUARD && req.role() != Role.COMPANY_POSTER) {
            throw new BusinessException("Staff role must be a guard or a poster");
        }
        CompanyProfile company = currentUserService.requireActingCompany();

        // An email already used by a *deactivated* staff member of this company is reused by
        // reactivating that row (audit history is preserved). Active accounts, or emails owned by
        // someone else / another company, still collide.
        User existing = userRepository.findByEmail(req.email()).orElse(null);
        if (existing != null) {
            boolean reusableSeat = !existing.isActive()
                    && existing.getParentCompany() != null
                    && existing.getParentCompany().getId().equals(company.getId());
            if (!reusableSeat) {
                throw new BusinessException("An account with this email already exists");
            }
            if (userRepository.countByParentCompanyAndRoleAndActiveTrue(company, req.role()) >= 1) {
                throw new BusinessException("You can only create one " + label(req.role()) + " account");
            }
            existing.setPassword(passwordEncoder.encode(req.tempPassword()));
            existing.setRole(req.role());
            existing.setActive(true);
            return toResponse(userRepository.save(existing));
        }

        if (userRepository.countByParentCompanyAndRoleAndActiveTrue(company, req.role()) >= 1) {
            throw new BusinessException("You can only create one " + label(req.role()) + " account");
        }
        User user = new User();
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.tempPassword()));
        user.setRole(req.role());
        user.setParentCompany(company);
        user.setActive(true);
        return toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<StaffResponse> list() {
        CompanyProfile company = currentUserService.requireActingCompany();
        return userRepository.findByParentCompany(company).stream().map(this::toResponse).toList();
    }

    @Transactional
    public void deactivate(Long staffId) {
        CompanyProfile company = currentUserService.requireActingCompany();
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> ResourceNotFoundException.of("Staff", staffId));
        if (staff.getParentCompany() == null
                || !staff.getParentCompany().getId().equals(company.getId())) {
            throw new BusinessException("This staff member does not belong to your company");
        }
        staff.setActive(false);
        userRepository.save(staff);
    }

    private String label(Role role) {
        return role == Role.COMPANY_GUARD ? "guard" : "poster";
    }

    private StaffResponse toResponse(User u) {
        return new StaffResponse(u.getId(), u.getEmail(), u.getRole().name(), u.isActive());
    }
}
