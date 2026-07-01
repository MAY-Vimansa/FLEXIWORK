package com.flexiwork.repository;

import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.enums.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

/**
 * {@link JpaSpecificationExecutor} enables the dynamic, composable filtering used by the public
 * job feed (see {@code JobPostSpecifications}).
 */
public interface JobPostRepository extends JpaRepository<JobPost, Long>,
        JpaSpecificationExecutor<JobPost> {

    Page<JobPost> findByCompany(CompanyProfile company, Pageable pageable);

    /** Pessimistic row lock used by {@code ApplicationService.acceptInternal} so concurrent
     *  accepts for the same job serialize instead of racing past the workersNeeded check. */
    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select j from JobPost j where j.id = :id")
    Optional<JobPost> findByIdForUpdate(Long id);

    List<JobPost> findByCompanyAndStatus(CompanyProfile company, JobStatus status);

    /** Every job a company posted — used by the admin hard-delete to clean up its job graph. */
    List<JobPost> findByCompany(CompanyProfile company);

    /** Drives the scheduled auto-expiry of OPEN jobs whose shift end has already passed. */
    List<JobPost> findByStatus(JobStatus status);

    List<JobPost> findByCompanyAndJobDate(CompanyProfile company, java.time.LocalDate jobDate);

    /** Eagerly fetch the company so server-rendered admin views can read it after the tx closes. */
    @Query("select j from JobPost j join fetch j.company order by j.id desc")
    List<JobPost> findAllWithCompany();

    /** Number of jobs scheduled per date, ascending — powers the dashboard line chart. */
    @Query(
            "select j.jobDate as d, count(j) as c from JobPost j group by j.jobDate order by j.jobDate")
    List<Object[]> countJobsByDate();

    long countByStatus(JobStatus status);
}
