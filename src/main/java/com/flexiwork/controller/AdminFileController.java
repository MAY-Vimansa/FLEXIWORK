package com.flexiwork.controller;

import com.flexiwork.service.FileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.stereotype.Controller;

/**
 * Serves KYC documents (NIC photos, BR certificates) for the Thymeleaf admin panel only. Unlike
 * {@link FileController}, this sits behind the session-authenticated {@code /admin/**} chain
 * (ROLE_ADMIN required) — these files are never exposed via the public {@code /api/files/**} route.
 */
@Controller
@RequestMapping("/admin/files")
public class AdminFileController {

    private final FileStorageService fileStorageService;

    public AdminFileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/**")
    public ResponseEntity<Resource> serve(HttpServletRequest request) {
        String fullPath = (String) request.getAttribute(
                HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String relativePath = fullPath.replaceFirst("^/admin/files/", "");
        Resource resource = fileStorageService.load(relativePath);
        MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(resource);
    }
}
