package com.flexiwork.controller;

import com.flexiwork.dto.payment.PayRequest;
import com.flexiwork.dto.payment.PaymentResponse;
import com.flexiwork.dto.payment.PaymentSummary;
import com.flexiwork.entity.enums.PaymentStatus;
import com.flexiwork.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Company-only payment endpoints: complete/bill a job, list payments, pay, and download PDFs. */
@RestController
@RequestMapping("/api/company")
@PreAuthorize("hasRole('COMPANY')")
@Tag(name = "Payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/jobs/{jobId}/complete")
    @Operation(summary = "Mark a job COMPLETED and bill commission on attended workers")
    public PaymentResponse complete(@PathVariable Long jobId) {
        return paymentService.completeJobAndBill(jobId);
    }

    @GetMapping("/payments")
    @Operation(summary = "List the company's payments, optionally filtered by status")
    public List<PaymentResponse> payments(@RequestParam(required = false) PaymentStatus status) {
        return paymentService.myPayments(status);
    }

    @GetMapping("/payments/summary")
    @Operation(summary = "Outstanding balance summary")
    public PaymentSummary summary() {
        return paymentService.summary();
    }

    @PostMapping("/payments/{id}/pay")
    @Operation(summary = "Pay a pending commission via the (simulated) gateway")
    public PaymentResponse pay(@PathVariable Long id, @Valid @RequestBody PayRequest request) {
        return paymentService.pay(id, request);
    }

    @GetMapping("/payments/{id}/receipt")
    @Operation(summary = "Download the PDF receipt (paid) or invoice (pending)")
    public ResponseEntity<byte[]> receipt(@PathVariable Long id) {
        PaymentService.ReceiptDownload download = paymentService.renderReceipt(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + download.filename() + "\"")
                .body(download.pdf());
    }
}
