package com.flexiwork.service;

import com.flexiwork.exception.BusinessException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;

/**
 * Stores uploaded files and generated assets (QR codes) on disk under the configured uploads
 * directory, and serves them back as {@link Resource}s. Enforces server-side validation of image
 * uploads (type + size) — a core "beyond CRUD" requirement. Paths are sanitised to prevent
 * traversal outside the uploads root.
 */
@Service
public class FileStorageService {

    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png");
    private static final Set<String> DOC_TYPES = Set.of("image/jpeg", "image/png", "application/pdf");
    private static final long MAX_BYTES = 5L * 1024 * 1024; // 5MB

    private final Path root;

    public FileStorageService(@Value("${flexiwork.uploads.dir}") String dir) {
        this.root = Paths.get(dir).toAbsolutePath().normalize();
    }

    @PostConstruct
    void init() {
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create uploads directory: " + root, e);
        }
    }

    /** Store an image (jpg/png, <=5MB). Returns the relative path stored in the DB. */
    public String storeImage(MultipartFile file, String subDir) {
        return store(file, subDir, IMAGE_TYPES, "Only JPG/PNG images up to 5MB are allowed");
    }

    /** Store a document (jpg/png/pdf, <=5MB) such as a BR certificate. */
    public String storeDocument(MultipartFile file, String subDir) {
        return store(file, subDir, DOC_TYPES, "Only JPG/PNG/PDF files up to 5MB are allowed");
    }

    private String store(MultipartFile file, String subDir, Set<String> allowedTypes, String error) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("File is required");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessException(error);
        }
        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new BusinessException(error);
        }
        // The declared Content-Type is client-supplied and spoofable; verify the actual file
        // signature (magic bytes) matches the declared type before trusting it.
        if (!signatureMatches(file, contentType)) {
            throw new BusinessException(error);
        }
        String ext = switch (contentType) {
            case "image/png" -> ".png";
            case "application/pdf" -> ".pdf";
            default -> ".jpg";
        };
        String filename = StringUtils.cleanPath(System.currentTimeMillis() + "_"
                + java.util.UUID.randomUUID().toString().substring(0, 8) + ext);
        Path target = resolve(subDir).resolve(filename);
        try {
            Files.createDirectories(target.getParent());
            file.transferTo(target);
        } catch (IOException e) {
            throw new BusinessException("Failed to store file: " + e.getMessage());
        }
        return root.relativize(target).toString().replace('\\', '/');
    }

    /**
     * Confirms the uploaded bytes actually start with the magic number for the declared MIME type.
     * JPEG: {@code FF D8 FF}; PNG: {@code 89 50 4E 47}; PDF: {@code 25 50 44 46} ("%PDF").
     */
    private boolean signatureMatches(MultipartFile file, String contentType) {
        byte[] head = new byte[8];
        int read;
        try (var in = file.getInputStream()) {
            read = in.readNBytes(head, 0, head.length);
        } catch (IOException e) {
            return false;
        }
        if (read < 4) {
            return false;
        }
        return switch (contentType) {
            case "image/jpeg" -> (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8
                    && (head[2] & 0xFF) == 0xFF;
            case "image/png" -> (head[0] & 0xFF) == 0x89 && head[1] == 'P' && head[2] == 'N'
                    && head[3] == 'G';
            case "application/pdf" -> head[0] == '%' && head[1] == 'P' && head[2] == 'D'
                    && head[3] == 'F';
            default -> false;
        };
    }

    /** Persist raw bytes (e.g. a generated QR PNG) at {@code subDir/filename}; returns rel path. */
    public String storeBytes(byte[] bytes, String subDir, String filename) {
        Path target = resolve(subDir).resolve(StringUtils.cleanPath(filename));
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
        } catch (IOException e) {
            throw new BusinessException("Failed to store generated file: " + e.getMessage());
        }
        return root.relativize(target).toString().replace('\\', '/');
    }

    /** Load a stored file as a serveable resource, guarding against path traversal. */
    public Resource load(String relativePath) {
        Path file = resolve(relativePath);
        try {
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new BusinessException("File not found: " + relativePath);
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new BusinessException("Invalid file path: " + relativePath);
        }
    }

    private Path resolve(String relativePath) {
        Path resolved = root.resolve(relativePath).normalize();
        if (!resolved.startsWith(root)) {
            throw new BusinessException("Invalid path");
        }
        return resolved;
    }
}
