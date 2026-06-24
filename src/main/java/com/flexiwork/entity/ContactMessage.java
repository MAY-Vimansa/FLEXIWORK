package com.flexiwork.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A message submitted via the public Contact Us form. Reviewed by admins. */
@Entity
@Table(name = "contact_messages")
@Getter
@Setter
@NoArgsConstructor
public class ContactMessage extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String topic;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, length = 20)
    private String phone;

    private String email;

    @Column(nullable = false, length = 2000)
    private String message;

    // "read" is a reserved word in MySQL, so the column is named "is_read".
    @Column(name = "is_read", nullable = false)
    private boolean read = false;
}
