package com.flexiwork.service;

import com.flexiwork.dto.contact.ContactRequest;
import com.flexiwork.entity.ContactMessage;
import com.flexiwork.repository.ContactMessageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Public "Contact us" form: persisted for admin review and forwarded to the support inbox. */
@Service
public class ContactService {

    private final ContactMessageRepository contactMessageRepository;
    private final EmailService emailService;
    private final String supportEmail;

    public ContactService(ContactMessageRepository contactMessageRepository,
                          EmailService emailService,
                          @Value("${flexiwork.support-email}") String supportEmail) {
        this.contactMessageRepository = contactMessageRepository;
        this.emailService = emailService;
        this.supportEmail = supportEmail;
    }

    @Transactional
    public void submit(ContactRequest req) {
        ContactMessage msg = new ContactMessage();
        msg.setTopic(req.topic());
        msg.setFirstName(req.firstName());
        msg.setLastName(req.lastName());
        msg.setPhone(req.phone());
        msg.setEmail(req.email());
        msg.setMessage(req.message());
        contactMessageRepository.save(msg);

        emailService.send(supportEmail, "[FlexiWork Contact] " + req.topic(),
                "From: " + req.firstName() + " " + req.lastName()
                        + "\nPhone: " + req.phone()
                        + "\nEmail: " + (req.email() == null || req.email().isBlank() ? "(not provided)" : req.email())
                        + "\n\n" + req.message());
    }
}
