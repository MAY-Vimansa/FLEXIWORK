package com.flexiwork.entity;

import com.flexiwork.entity.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Authentication principal. One row per login identity regardless of role.
 *
 * <p>Staff sub-accounts (COMPANY_GUARD, COMPANY_POSTER) reference their owning company via
 * {@link #parentCompany}. Every action such accounts take must be scoped to this company,
 * resolved from the authenticated user — never from request parameters.
 */
@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_users_email", columnNames = "email")
        })
@Getter
@Setter
@NoArgsConstructor
public class User extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    /** BCrypt hash — never the plain password. */
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    /** Set only for COMPANY_GUARD / COMPANY_POSTER staff accounts. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_company_id")
    private CompanyProfile parentCompany;

    @Column(nullable = false)
    private boolean active = true;
}
