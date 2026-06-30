package com.flexiwork.repository;

import com.flexiwork.entity.Application;
import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    boolean existsByJobPostAndWorker(JobPost jobPost, WorkerProfile worker);

    Optional<Application> findByJobPostAndWorker(JobPost jobPost, WorkerProfile worker);

    Optional<Application> findByQrCodeToken(String qrCodeToken);

    List<Application> findByJobPost(JobPost jobPost);

    List<Application> findByJobPostAndStatus(JobPost jobPost, ApplicationStatus status);

    List<Application> findByWorkerOrderByAppliedAtDesc(WorkerProfile worker);

    List<Application> findByWorkerAndStatus(WorkerProfile worker, ApplicationStatus status);

    /** The worker's active applications for jobs on a given day — used to block double-booking
     *  when a new job's shift overlaps one they're already enrolled in. */
    List<Application> findByWorkerAndStatusInAndJobPost_JobDate(
            WorkerProfile worker, Collection<ApplicationStatus> statuses, LocalDate jobDate);

    long countByJobPostAndStatus(JobPost jobPost, ApplicationStatus status);

    /** All ACCEPTED applications for today's jobs that haven't had a reminder sent yet. */
    List<Application> findByStatusAndReminderSentAtIsNullAndJobPost_JobDate(
            ApplicationStatus status, LocalDate jobDate);
}
