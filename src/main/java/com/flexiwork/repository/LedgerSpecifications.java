package com.flexiwork.repository;

import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.District;
import com.flexiwork.entity.enums.VerificationStatus;
import org.springframework.data.jpa.domain.Specification;

/**
 * Composable {@link Specification} fragments for the admin ledger (all-workers / all-companies
 * directory). Each predicate is null-safe — a no-op when its filter value is absent — so the
 * controller can chain only the filters the admin actually picked.
 */
public final class LedgerSpecifications {

    private LedgerSpecifications() {
    }

    public static Specification<WorkerProfile> workerHasStatus(VerificationStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<WorkerProfile> workerHasDistrict(District district) {
        return (root, query, cb) -> district == null ? null : cb.equal(root.get("district"), district);
    }

    /** Case-insensitive match on full name or NIC number. */
    public static Specification<WorkerProfile> workerMatches(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return null;
            }
            String like = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("fullName")), like),
                    cb.like(cb.lower(root.get("nicNumber")), like));
        };
    }

    public static Specification<CompanyProfile> companyHasStatus(VerificationStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<CompanyProfile> companyHasDistrict(District district) {
        return (root, query, cb) -> district == null ? null : cb.equal(root.get("district"), district);
    }

    /** Case-insensitive match on company name or BR number. */
    public static Specification<CompanyProfile> companyMatches(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return null;
            }
            String like = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("companyName")), like),
                    cb.like(cb.lower(root.get("brNumber")), like));
        };
    }
}
