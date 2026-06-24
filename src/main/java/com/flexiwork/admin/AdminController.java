package com.flexiwork.admin;

import com.flexiwork.entity.SystemSettings;
import com.flexiwork.entity.enums.District;
import com.flexiwork.entity.enums.VerificationStatus;
import com.flexiwork.service.AdminService;
import com.flexiwork.service.PaymentService;
import com.flexiwork.service.SettingsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/**
 * Server-rendered admin panel (Thymeleaf, session-authenticated). Demonstrates the academic
 * requirements for session/cookie auth, CSRF-protected form posts, and HTTP method override:
 * status changes use PUT and job cancellation uses DELETE via the hidden {@code _method} field.
 */
@Controller
public class AdminController {

    private final AdminService adminService;
    private final PaymentService paymentService;
    private final SettingsService settingsService;

    public AdminController(AdminService adminService, PaymentService paymentService,
                            SettingsService settingsService) {
        this.adminService = adminService;
        this.paymentService = paymentService;
        this.settingsService = settingsService;
    }

    /** Inlined admin stylesheet. Served in-page (not via an external {@code <link>}) so the panel
     *  renders even when a browser refuses to apply the external stylesheet (forced colors, cached
     *  sub-resource, MIME enforcement, etc.). Loaded once from the classpath and cached. */
    private volatile String adminCss;

    @org.springframework.web.bind.annotation.ModelAttribute("adminCss")
    public String adminCss() throws java.io.IOException {
        if (adminCss == null) {
            var resource = new org.springframework.core.io.ClassPathResource("static/css/admin.css");
            try (var in = resource.getInputStream()) {
                adminCss = new String(in.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
            }
        }
        return adminCss;
    }

    @org.springframework.web.bind.annotation.ModelAttribute("pendingCounts")
    public AdminService.PendingCounts pendingCounts() {
        return adminService.pendingCounts();
    }

    @org.springframework.web.bind.annotation.ModelAttribute("notifications")
    public java.util.List<AdminService.NotificationItem> notifications() {
        return adminService.recentNotifications();
    }

    @org.springframework.web.bind.annotation.ModelAttribute("systemSettings")
    public SystemSettings systemSettings() {
        return settingsService.getSettings();
    }

    @org.springframework.web.bind.annotation.ModelAttribute("adminName")
    public String adminName() {
        var auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "Admin";
    }

    @GetMapping("/")
    public String root() {
        return "redirect:/admin";
    }

    @GetMapping("/login")
    public String login() {
        return "admin/login";
    }

    @GetMapping({"/admin", "/admin/"})
    public String dashboard(Model model) {
        model.addAttribute("stats", adminService.dashboardStats());
        model.addAttribute("trend", adminService.jobsTrend());
        return "admin/dashboard";
    }

    // ---- Company verifications ----
    @GetMapping("/admin/companies")
    public String companies(Model model) {
        model.addAttribute("companies", adminService.pendingCompanies());
        return "admin/companies";
    }

    @PutMapping("/admin/companies/{id}/status")
    public String setCompanyStatus(@PathVariable Long id, @RequestParam VerificationStatus status) {
        adminService.setCompanyStatus(id, status);
        return "redirect:/admin/companies";
    }

    // ---- Worker verifications ----
    @GetMapping("/admin/workers")
    public String workers(Model model) {
        model.addAttribute("workers", adminService.pendingWorkers());
        return "admin/workers";
    }

    @PutMapping("/admin/workers/{id}/status")
    public String setWorkerStatus(@PathVariable Long id, @RequestParam VerificationStatus status) {
        adminService.setWorkerStatus(id, status);
        return "redirect:/admin/workers";
    }

    // ---- Jobs ----
    @GetMapping("/admin/jobs")
    public String jobs(Model model) {
        model.addAttribute("jobs", adminService.allJobs());
        return "admin/jobs";
    }

    @DeleteMapping("/admin/jobs/{id}")
    public String cancelJob(@PathVariable Long id) {
        adminService.cancelJob(id);
        return "redirect:/admin/jobs";
    }

    // ---- Payments ----
    @GetMapping("/admin/payments")
    public String payments(Model model) {
        model.addAttribute("payments", adminService.allPayments());
        model.addAttribute("commissionEarned", adminService.dashboardStats().commissionEarned());
        model.addAttribute("suspendedCompanies", adminService.suspendedCompanies());
        return "admin/payments";
    }

    @PutMapping("/admin/payments/{id}/paid")
    public String markPaid(@PathVariable Long id) {
        paymentService.adminMarkPaid(id);
        return "redirect:/admin/payments";
    }

    @PutMapping("/admin/companies/{id}/unsuspend")
    public String unsuspendCompany(@PathVariable Long id) {
        adminService.unsuspendCompany(id);
        return "redirect:/admin/payments";
    }

    // ---- Ledger (full worker/company directory with filters) ----
    @GetMapping("/admin/ledger")
    public String ledger(@RequestParam(defaultValue = "workers") String type,
                          @RequestParam(required = false) VerificationStatus status,
                          @RequestParam(required = false) District district,
                          @RequestParam(required = false) String search,
                          @RequestParam(defaultValue = "name") String sortField,
                          @RequestParam(defaultValue = "asc") String sortDir,
                          Model model) {
        model.addAttribute("type", type);
        model.addAttribute("status", status);
        model.addAttribute("district", district);
        model.addAttribute("search", search);
        model.addAttribute("sortField", sortField);
        model.addAttribute("sortDir", sortDir);
        model.addAttribute("statuses", VerificationStatus.values());
        model.addAttribute("districts", District.values());
        if ("companies".equals(type)) {
            model.addAttribute("companies", adminService.ledgerCompanies(status, district, search, sortField, sortDir));
        } else {
            model.addAttribute("workers", adminService.ledgerWorkers(status, district, search, sortField, sortDir));
        }
        return "admin/ledger";
    }

    // ---- Contact us messages ----
    @GetMapping("/admin/messages")
    public String messages(Model model) {
        model.addAttribute("messages", adminService.contactMessages());
        return "admin/messages";
    }

    @PutMapping("/admin/messages/{id}/read")
    public String markMessageRead(@PathVariable Long id) {
        adminService.markMessageRead(id);
        return "redirect:/admin/messages";
    }

    // ---- Platform settings ----
    @PutMapping("/admin/settings")
    public String updateSettings(@RequestParam BigDecimal commissionRate,
                                  @RequestParam int paymentGraceDays,
                                  @RequestParam int approvalAutoWindowMinutes,
                                  @RequestParam int cancelCutoffHours,
                                  HttpServletRequest request) {
        settingsService.updateSettings(commissionRate, paymentGraceDays,
                approvalAutoWindowMinutes, cancelCutoffHours);
        String referer = request.getHeader("Referer");
        return "redirect:" + (referer != null ? referer : "/admin");
    }
}
