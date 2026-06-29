package com.flexiwork.repository;

import com.flexiwork.entity.Application;
import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
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

    long countByJobPostAndStatus(JobPost jobPost, ApplicationStatus status);

    /** All ACCEPTED applications for today's jobs that haven't had a reminder sent yet. */
    List<Application> findByStatusAndReminderSentAtIsNullAndJobPost_JobDate(
            ApplicationStatus status, LocalDate jobDate);
}
