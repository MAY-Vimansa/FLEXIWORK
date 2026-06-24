package com.flexiwork.repository;

import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.User;
import com.flexiwork.entity.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByParentCompany(CompanyProfile parentCompany);

    /** Only ACTIVE staff occupy a role slot, so a deactivated guard/poster can be replaced. */
    long countByParentCompanyAndRoleAndActiveTrue(CompanyProfile parentCompany, Role role);

    long countByRole(Role role);
}
