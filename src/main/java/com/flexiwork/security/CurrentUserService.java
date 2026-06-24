package com.flexiwork.security;

import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.User;
import com.flexiwork.entity.enums.Role;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.exception.ResourceNotFoundException;
import com.flexiwork.repository.CompanyProfileRepository;
import com.flexiwork.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Resolves the authenticated {@link User} from the security context, transparently handling both
 * authentication styles: the JWT chain sets the principal to the user id (Long), while the admin
 * session chain sets it to an {@link AppUserPrincipal}.
 *
 * <p>Crucially, the owning company for staff actions is always derived here from the logged-in
 * user — never from request parameters — so guards/posters cannot act on another company's data.
 */
@Service
public class CurrentUserService {

    private final UserRepository userRepository;
    private final CompanyProfileRepository companyProfileRepository;

    public CurrentUserService(UserRepository userRepository,
                              CompanyProfileRepository companyProfileRepository) {
        this.userRepository = userRepository;
        this.companyProfileRepository = companyProfileRepository;
    }

    public User requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new BusinessException("No authenticated user");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof AppUserPrincipal p) {
            return p.getUser();
        }
        if (principal instanceof Long userId) {
            return userRepository.findById(userId)
                    .orElseThrow(() -> ResourceNotFoundException.of("User", userId));
        }
        throw new BusinessException("Unsupported principal type");
    }

    /**
     * Returns the company the current user acts on behalf of: their own company if they are a
     * COMPANY owner, or their {@code parentCompany} if they are a guard/poster staff account.
     */
    public CompanyProfile requireActingCompany() {
        User user = requireCurrentUser();
        if (user.getRole() == Role.COMPANY) {
            return companyProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new BusinessException("Company profile not found"));
        }
        if (user.getRole() == Role.COMPANY_GUARD || user.getRole() == Role.COMPANY_POSTER) {
            CompanyProfile parent = user.getParentCompany();
            if (parent == null) {
                throw new BusinessException("Staff account has no parent company");
            }
            return parent;
        }
        throw new BusinessException("Current user is not associated with a company");
    }
}
