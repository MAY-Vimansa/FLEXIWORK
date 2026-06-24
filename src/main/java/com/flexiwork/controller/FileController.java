package com.flexiwork.controller;

import com.flexiwork.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Serves stored uploads and generated QR images. Public read access (matching the security config)
 * so QR codes and logos render in the browser and WhatsApp; the storage service guards against
 * path traversal.
 */
@RestController
@RequestMapping("/api/files")
@Tag(name = "Files")
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/**")
    @Operation(summary = "Serve a stored file (image / QR / document) by its relative path")
    public ResponseEntity<Resource> serve(HttpServletRequest request) {
        String fullPath = (String) request.getAttribute(
                HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        // Strip the "/api/files/" prefix to get the stored relative path.
        String relativePath = fullPath.replaceFirst("^/api/files/", "");
        Resource resource = fileStorageService.load(relativePath);
        MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(resource);
    }
}
