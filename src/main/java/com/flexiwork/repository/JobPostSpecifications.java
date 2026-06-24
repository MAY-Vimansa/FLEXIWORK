package com.flexiwork.repository;

import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.enums.District;
import com.flexiwork.entity.enums.JobCategory;
import com.flexiwork.entity.enums.JobStatus;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Composable JPA {@link Specification} fragments for the public job feed. Each method returns a
 * predicate that is null-safe (no-op when its filter value is absent), so the service can chain
 * only the filters the caller actually supplied:
 *
 * <pre>{@code
 * Specification<JobPost> spec = Specification.where(isOpen())
 *         .and(hasDistrict(district))
 *         .and(hasCategory(category))
 *         .and(wageAtLeast(minWage))
 *         .and(onDate(date))
 *         .and(keywordMatches(keyword));
 * }</pre>
 */
public final class JobPostSpecifications {

    private JobPostSpecifications() {
    }

    /** Only show jobs that are still accepting workers. */
    public static Specification<JobPost> isOpen() {
        return (root, query, cb) -> cb.equal(root.get("status"), JobStatus.OPEN);
    }

    public static Specification<JobPost> hasDistrict(District district) {
        return (root, query, cb) ->
                district == null ? null : cb.equal(root.get("district"), district);
    }

    public static Specification<JobPost> hasCategory(JobCategory category) {
        return (root, query, cb) ->
                category == null ? null : cb.equal(root.get("category"), category);
    }

    public static Specification<JobPost> wageAtLeast(BigDecimal minWage) {
        return (root, query, cb) ->
                minWage == null ? null : cb.greaterThanOrEqualTo(root.get("dailyWage"), minWage);
    }

    public static Specification<JobPost> onDate(LocalDate date) {
        return (root, query, cb) ->
                date == null ? null : cb.equal(root.get("jobDate"), date);
    }

    /** Case-insensitive match across title and description. */
    public static Specification<JobPost> keywordMatches(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return null;
            }
            String like = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), like),
                    cb.like(cb.lower(root.get("description")), like));
        };
    }
}
