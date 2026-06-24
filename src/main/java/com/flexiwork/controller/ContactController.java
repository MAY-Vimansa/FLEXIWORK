package com.flexiwork.controller;

import com.flexiwork.dto.contact.ContactRequest;
import com.flexiwork.service.ContactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Public "Contact us" form submission. No auth required. */
@RestController
@RequestMapping("/api/contact")
@Tag(name = "Contact")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Submit a contact-us message")
    public void submit(@Valid @RequestBody ContactRequest request) {
        contactService.submit(request);
    }
}
