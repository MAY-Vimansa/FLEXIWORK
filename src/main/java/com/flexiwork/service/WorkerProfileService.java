package com.flexiwork.service;

import com.flexiwork.dto.worker.WorkerProfileResponse;
import com.flexiwork.dto.worker.WorkerProfileUpdateRequest;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.repository.WorkerProfileRepository;
import com.flexiwork.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/** View and edit the logged-in worker's own profile (NIC details remain immutable here). */
@Service
public class WorkerProfileService {

    private final WorkerProfileRepository workerRepository;
    private final CurrentUserService currentUserService;
    private final FileStorageService fileStorageService;

    public WorkerProfileService(WorkerProfileRepository workerRepository,
                                CurrentUserService currentUserService,
                                FileStorageService fileStorageService) {
        this.workerRepository = workerRepository;
        this.currentUserService = currentUserService;
        this.fileStorageService = fileStorageService;
    }

    @Transactional(readOnly = true)
    public WorkerProfileResponse myProfile() {
        return toResponse(requireWorker());
    }

    @Transactional
    public WorkerProfileResponse update(WorkerProfileUpdateRequest req) {
        WorkerProfile worker = requireWorker();
        worker.setFullName(req.fullName());
        worker.setDistrict(req.district());
        worker.setLatitude(req.latitude());
        worker.setLongitude(req.longitude());
        worker.setSkills(req.skills());
        return toResponse(workerRepository.save(worker));
    }

    @Transactional
    public WorkerProfileResponse replacePhoto(MultipartFile photo) {
        WorkerProfile worker = requireWorker();
        String path = fileStorageService.storeImage(photo, "workers/" + worker.getUser().getId());
        worker.setProfilePhotoPath(path);
        return toResponse(workerRepository.save(worker));
    }

    private WorkerProfile requireWorker() {
        Long userId = currentUserService.requireCurrentUser().getId();
        return workerRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Worker profile not found"));
    }

    private WorkerProfileResponse toResponse(WorkerProfile w) {
        return new WorkerProfileResponse(
                w.getId(), w.getFullName(), w.getNicNumber(), w.getWhatsappNumber(),
                w.isWhatsappVerified(), w.getDistrict(), w.getLatitude(), w.getLongitude(),
                w.getSkills(), w.getRatingAverage(), w.getProfilePhotoPath(), w.getStatus());
    }
}
