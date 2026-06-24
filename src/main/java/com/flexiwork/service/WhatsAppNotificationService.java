package com.flexiwork.service;

import com.flexiwork.entity.Application;
import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.enums.ApplicationStatus;
import com.flexiwork.repository.ApplicationRepository;
import org.springframework.stereotype.Service;

@Service
public class WhatsAppNotificationService implements NotificationService {

    private final WhatsAppClient client;
    private final ApplicationRepository applicationRepository;

    public WhatsAppNotificationService(WhatsAppClient client, ApplicationRepository applicationRepository) {
        this.client = client;
        this.applicationRepository = applicationRepository;
    }

    @Override
    public void sendApplicationApproved(Application application) {
        var job = application.getJobPost();
        client.sendText(application.getWorker().getWhatsappNumber(),
                "🎉 You're confirmed for '" + job.getTitle() + "' on " + job.getJobDate()
                        + " at " + job.getAddressLine() + ". Your QR code is ready in the app — "
                        + "bring it to check in on shift day.");
    }

    @Override
    public void sendApplicationRejected(Application application) {
        client.sendText(application.getWorker().getWhatsappNumber(),
                "Your application for '" + application.getJobPost().getTitle()
                        + "' was not accepted — the job filled up. Keep browsing the FlexiWork app "
                        + "for more openings.");
    }

    @Override
    public void sendJobCancelled(JobPost job) {
        applicationRepository.findByJobPostAndStatus(job, ApplicationStatus.ACCEPTED)
                .forEach(application -> client.sendText(application.getWorker().getWhatsappNumber(),
                        "⚠️ The job '" + job.getTitle() + "' on " + job.getJobDate()
                                + " has been cancelled by the company. Sorry for the inconvenience — "
                                + "check the app for other openings."));
    }

    @Override
    public void sendCheckIn(Application application) {
        client.sendText(application.getWorker().getWhatsappNumber(),
                "✅ Check-IN confirmed for '" + application.getJobPost().getTitle()
                        + "'. Have a great shift!");
    }

    @Override
    public void sendCheckOut(Application application) {
        client.sendText(application.getWorker().getWhatsappNumber(),
                "👋 Check-OUT confirmed for '" + application.getJobPost().getTitle()
                        + "'. Thanks for your work today — your pay is being processed.");
    }

    @Override
    public void sendShiftExtended(Application application, java.math.BigDecimal extraWage) {
        client.sendText(application.getWorker().getWhatsappNumber(),
                "⏱ The shift for '" + application.getJobPost().getTitle()
                        + "' has been extended. You've earned an extra LKR "
                        + extraWage.toPlainString() + " — please check out when you finish.");
    }

    @Override
    public void sendShiftReminder(Application application) {
        var job = application.getJobPost();
        client.sendText(application.getWorker().getWhatsappNumber(),
                "⏰ Reminder: Your shift '" + job.getTitle() + "' starts in 2 hours ("
                        + job.getStartTime().toString().substring(0, 5) + "). "
                        + "Please be on time. You can no longer cancel this application.");
    }
}
