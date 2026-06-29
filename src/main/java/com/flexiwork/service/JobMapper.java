package com.flexiwork.service;

import com.flexiwork.dto.job.JobResponse;
import com.flexiwork.entity.JobPost;
import com.flexiwork.util.GeoUtil;
import org.springframework.stereotype.Component;

/** Maps {@link JobPost} entities to {@link JobResponse}, computing derived fields server-side. */
@Component
public class JobMapper {

    public JobResponse toResponse(JobPost job, Double viewerLat, Double viewerLng) {
        int slotsLeft = Math.max(0, job.getWorkersNeeded() - job.getWorkersAccepted());
        Double distance = GeoUtil.distanceKm(viewerLat, viewerLng,
                job.getLatitude(), job.getLongitude());
        return new JobResponse(
                job.getId(),
                job.getTitle(),
                job.getDescription(),
                job.getCategory(),
                job.getDistrict(),
                job.getAddressLine(),
                job.getLatitude(),
                job.getLongitude(),
                GeoUtil.mapsDirectionsLink(job.getLatitude(), job.getLongitude()),
                job.getJobDate(),
                job.getStartTime(),
                job.getEndTime(),
                job.getDailyWage(),
                job.getWorkersNeeded(),
                job.getWorkersAccepted(),
                slotsLeft,
                job.getStatus(),
                job.getCompany().getId(),
                job.getCompany().getCompanyName(),
                job.getCompany().getLogoPath(),
                distance);
    }
}
