package com.flexiwork.repository;

import com.flexiwork.entity.Application;
import com.flexiwork.entity.Attendance;
import com.flexiwork.entity.JobPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    boolean existsByApplication(Application application);

    Optional<Attendance> findByApplication(Application application);

    /** Count of verified check-ins for a job — the basis for commission billing. */
    @Query("select count(a) from Attendance a "
            + "where a.application.jobPost = :jobPost and a.verified = true")
    long countVerifiedByJobPost(JobPost jobPost);

    /** All attendances for a job (for commission totals + roster). */
    @Query("select a from Attendance a where a.application.jobPost = :jobPost")
    java.util.List<Attendance> findByJobPost(JobPost jobPost);

    /** Workers still on-site for a job (checked in, not yet checked out) — extension targets. */
    @Query("select a from Attendance a where a.application.jobPost = :jobPost and a.checkOutTime is null")
    java.util.List<Attendance> findOnSiteByJobPost(JobPost jobPost);

    /** All attendances for a worker (for the worker dashboard stats). */
    @Query("select a from Attendance a where a.application.worker = :worker")
    java.util.List<Attendance> findByWorker(com.flexiwork.entity.WorkerProfile worker);
}
