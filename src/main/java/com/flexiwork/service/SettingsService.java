package com.flexiwork.service;

import com.flexiwork.entity.SystemSettings;
import com.flexiwork.repository.SystemSettingsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Source of truth for the admin-tunable business rules (commission rate, payment grace period,
 * auto-approval window, cancel cutoff). Backed by a single-row {@link SystemSettings} table that
 * is seeded from {@code application.yml} the first time it's read, then always read live from the
 * database — so changes made in the admin settings popup apply immediately, no restart required.
 */
@Service
public class SettingsService {

    private final SystemSettingsRepository repository;
    private final BigDecimal defaultCommissionRate;
    private final int defaultGraceDays;
    private final int defaultAutoWindowMinutes;
    private final int defaultCancelCutoffHours;

    public SettingsService(SystemSettingsRepository repository,
                            @Value("${flexiwork.payment.commission-rate}") BigDecimal defaultCommissionRate,
                            @Value("${flexiwork.payment.grace-days}") int defaultGraceDays,
                            @Value("${flexiwork.approval.auto-window-minutes}") int defaultAutoWindowMinutes,
                            @Value("${flexiwork.application.cancel-cutoff-hours}") int defaultCancelCutoffHours) {
        this.repository = repository;
        this.defaultCommissionRate = defaultCommissionRate;
        this.defaultGraceDays = defaultGraceDays;
        this.defaultAutoWindowMinutes = defaultAutoWindowMinutes;
        this.defaultCancelCutoffHours = defaultCancelCutoffHours;
    }

    @Transactional
    public SystemSettings getSettings() {
        return repository.findById(1L).orElseGet(this::seedDefaults);
    }

    private SystemSettings seedDefaults() {
        SystemSettings settings = new SystemSettings();
        settings.setCommissionRate(defaultCommissionRate);
        settings.setPaymentGraceDays(defaultGraceDays);
        settings.setApprovalAutoWindowMinutes(defaultAutoWindowMinutes);
        settings.setCancelCutoffHours(defaultCancelCutoffHours);
        return repository.save(settings);
    }

    @Transactional
    public void updateSettings(BigDecimal commissionRate, int paymentGraceDays,
                                int approvalAutoWindowMinutes, int cancelCutoffHours) {
        SystemSettings settings = getSettings();
        settings.setCommissionRate(commissionRate);
        settings.setPaymentGraceDays(paymentGraceDays);
        settings.setApprovalAutoWindowMinutes(approvalAutoWindowMinutes);
        settings.setCancelCutoffHours(cancelCutoffHours);
        repository.save(settings);
    }

    public BigDecimal commissionRate() {
        return getSettings().getCommissionRate();
    }

    public int paymentGraceDays() {
        return getSettings().getPaymentGraceDays();
    }

    public long approvalAutoWindowMinutes() {
        return getSettings().getApprovalAutoWindowMinutes();
    }

    public long cancelCutoffHours() {
        return getSettings().getCancelCutoffHours();
    }
}
