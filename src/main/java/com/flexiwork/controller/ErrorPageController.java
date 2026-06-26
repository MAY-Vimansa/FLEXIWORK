package com.flexiwork.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Server-rendered error page for the Thymeleaf admin/session side (academic requirement:
 * 404/400/401/403 must be handled gracefully, not as Spring's default whitelabel page). The
 * REST API side already has its own consistent JSON envelope via {@code GlobalExceptionHandler};
 * this controller only covers browser navigations that aren't under {@code /api/**}.
 */
@Controller
public class ErrorPageController implements ErrorController {

    private volatile String adminCss;

    @org.springframework.web.bind.annotation.ModelAttribute("adminCss")
    public String adminCss() throws IOException {
        if (adminCss == null) {
            var resource = new org.springframework.core.io.ClassPathResource("static/css/admin.css");
            try (var in = resource.getInputStream()) {
                adminCss = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            }
        }
        return adminCss;
    }

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request, Model model) {
        Object statusAttr = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        int status = statusAttr != null ? (int) statusAttr : 500;

        String title;
        String message;
        switch (status) {
            case 404 -> {
                title = "Page not found";
                message = "The page you're looking for doesn't exist or may have been moved.";
            }
            case 400 -> {
                title = "Bad request";
                message = "The request couldn't be understood. Please check the form and try again.";
            }
            case 401 -> {
                title = "Sign-in required";
                message = "You need to sign in to view this page.";
            }
            case 403 -> {
                title = "Access denied";
                message = "You don't have permission to view this page.";
            }
            default -> {
                title = "Something went wrong";
                message = "An unexpected error occurred. Please try again later.";
            }
        }

        model.addAttribute("status", status);
        model.addAttribute("title", title);
        model.addAttribute("message", message);
        return "error/error";
    }
}
