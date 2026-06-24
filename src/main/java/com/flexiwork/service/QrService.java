package com.flexiwork.service;

import com.flexiwork.exception.BusinessException;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Map;

/**
 * Generates and persists QR code PNGs that encode an application's {@code qrCodeToken}. The image
 * is stored under {@code qr/} and served via the file endpoint, and is also sent to the worker over
 * WhatsApp on acceptance.
 */
@Service
public class QrService {

    private static final int SIZE = 320;

    private final FileStorageService fileStorageService;

    public QrService(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    /** Generate the QR for a token, store it, and return its relative path. */
    public String generateAndStore(String token) {
        byte[] png = toPng(token);
        return fileStorageService.storeBytes(png, "qr", token + ".png");
    }

    public byte[] toPng(String token) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = Map.of(
                    EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
                    EncodeHintType.MARGIN, 1);
            BitMatrix matrix = writer.encode(token, BarcodeFormat.QR_CODE, SIZE, SIZE, hints);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new BusinessException("Failed to generate QR code: " + e.getMessage());
        }
    }
}
