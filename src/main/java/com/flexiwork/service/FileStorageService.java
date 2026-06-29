package com.flexiwork.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.flexiwork.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.Map;
import java.util.Set;

@Service
public class FileStorageService {

    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png");
    private static final Set<String> DOC_TYPES   = Set.of("image/jpeg", "image/png", "application/pdf");
    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private final Cloudinary cloudinary;

    public FileStorageService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}")    String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key",    apiKey,
                "api_secret", apiSecret,
                "secure",     true
        ));
    }

    /** Store an image (jpg/png, <=5MB). Returns the Cloudinary URL. */
    public String storeImage(MultipartFile file, String subDir) {
        return upload(file, subDir, IMAGE_TYPES, "Only JPG/PNG images up to 5MB are allowed");
    }

    /** Store a document (jpg/png/pdf, <=5MB). Returns the Cloudinary URL. */
    public String storeDocument(MultipartFile file, String subDir) {
        return upload(file, subDir, DOC_TYPES, "Only JPG/PNG/PDF files up to 5MB are allowed");
    }

    private String upload(MultipartFile file, String subDir,
                          Set<String> allowedTypes, String error) {
        if (file == null || file.isEmpty()) throw new BusinessException("File is required");
        if (file.getSize() > MAX_BYTES)     throw new BusinessException(error);

        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType))
            throw new BusinessException(error);
        if (!signatureMatches(file, contentType))
            throw new BusinessException(error);

        try {
            Map result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("folder", "flexiwork/" + subDir)
            );
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new BusinessException("Failed to upload file: " + e.getMessage());
        }
    }

    /** Store raw bytes (e.g. generated QR PNG) to Cloudinary. Returns the URL. */
    public String storeBytes(byte[] bytes, String subDir, String filename) {
        try {
            Map result = cloudinary.uploader().upload(
                    bytes,
                    ObjectUtils.asMap(
                            "folder",         "flexiwork/" + subDir,
                            "public_id",      filename,
                            "resource_type",  "image"
                    )
            );
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new BusinessException("Failed to upload generated file: " + e.getMessage());
        }
    }

    /** Load a file by its URL (Cloudinary URLs are directly accessible). */
    public Resource load(String urlOrPath) {
        try {
            // If it's already a full URL (Cloudinary), serve it directly
            if (urlOrPath.startsWith("http")) {
                return new UrlResource(urlOrPath);
            }
            // fallback for any old local paths still in DB
            throw new BusinessException("File not found: " + urlOrPath);
        } catch (MalformedURLException e) {
            throw new BusinessException("Invalid file path: " + urlOrPath);
        }
    }

    private boolean signatureMatches(MultipartFile file, String contentType) {
        byte[] head = new byte[8];
        int read;
        try (var in = file.getInputStream()) {
            read = in.readNBytes(head, 0, head.length);
        } catch (IOException e) {
            return false;
        }
        if (read < 4) return false;
        return switch (contentType) {
            case "image/jpeg"      -> (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8
                    && (head[2] & 0xFF) == 0xFF;
            case "image/png"       -> (head[0] & 0xFF) == 0x89 && head[1] == 'P'
                    && head[2] == 'N' && head[3] == 'G';
            case "application/pdf" -> head[0] == '%' && head[1] == 'P'
                    && head[2] == 'D' && head[3] == 'F';
            default -> false;
        };
    }
}