package com.flexiwork.repository;

import com.flexiwork.config.AuditorAwareImpl;
import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.User;
import com.flexiwork.entity.enums.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the composable {@link JobPostSpecifications} against a real (H2) database via the
 * repository's {@code JpaSpecificationExecutor}.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(AuditorAwareImpl.class) // supply the named "auditorAware" bean for JPA auditing
class JobPostRepositoryTest {

    @Autowired TestEntityManager em;
    @Autowired JobPostRepository jobRepository;

    private CompanyProfile company;

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setEmail("co@test.lk");
        user.setPassword("x");
        user.setRole(Role.COMPANY);
        em.persist(user);

        company = new CompanyProfile();
        company.setUser(user);
        company.setCompanyName("Test Co");
        company.setBrNumber("BR1");
        company.setStatus(VerificationStatus.VERIFIED);
        em.persist(company);

        em.persist(job("Kitchen Helper", JobCategory.RESTAURANT_KITCHEN, District.COLOMBO,
                new BigDecimal("3000"), LocalDate.of(2030, 1, 1), JobStatus.OPEN));
        em.persist(job("Hotel Steward", JobCategory.HOTEL, District.COLOMBO,
                new BigDecimal("5000"), LocalDate.of(2030, 1, 2), JobStatus.OPEN));
        em.persist(job("Factory Packer", JobCategory.FACTORY, District.GAMPAHA,
                new BigDecimal("2800"), LocalDate.of(2030, 1, 1), JobStatus.OPEN));
        em.persist(job("Old Filled Job", JobCategory.HOTEL, District.COLOMBO,
                new BigDecimal("9000"), LocalDate.of(2030, 1, 1), JobStatus.FILLED));
        em.flush();
    }

    @Test
    void isOpen_excludesNonOpenJobs() {
        long count = jobRepository.count(JobPostSpecifications.isOpen());
        assertThat(count).isEqualTo(3); // the FILLED one is excluded
    }

    @Test
    void filterByDistrict() {
        var spec = Specification.where(JobPostSpecifications.isOpen())
                .and(JobPostSpecifications.hasDistrict(District.COLOMBO));
        assertThat(jobRepository.findAll(spec)).hasSize(2);
    }

    @Test
    void filterByCategoryAndMinWage() {
        var spec = Specification.where(JobPostSpecifications.isOpen())
                .and(JobPostSpecifications.hasCategory(JobCategory.HOTEL))
                .and(JobPostSpecifications.wageAtLeast(new BigDecimal("4000")));
        assertThat(jobRepository.findAll(spec)).hasSize(1);
    }

    @Test
    void keywordMatchesTitle() {
        var spec = Specification.where(JobPostSpecifications.isOpen())
                .and(JobPostSpecifications.keywordMatches("kitchen"));
        assertThat(jobRepository.findAll(spec)).hasSize(1);
    }

    @Test
    void nullFilters_areNoOps() {
        var spec = Specification.where(JobPostSpecifications.isOpen())
                .and(JobPostSpecifications.hasDistrict(null))
                .and(JobPostSpecifications.wageAtLeast(null))
                .and(JobPostSpecifications.onDate(null));
        assertThat(jobRepository.findAll(spec)).hasSize(3);
    }

    private JobPost job(String title, JobCategory cat, District dist, BigDecimal wage,
                        LocalDate date, JobStatus status) {
        JobPost j = new JobPost();
        j.setCompany(company);
        j.setTitle(title);
        j.setDescription("desc for " + title);
        j.setCategory(cat);
        j.setDistrict(dist);
        j.setAddressLine("addr");
        j.setLatitude(6.9);
        j.setLongitude(79.8);
        j.setJobDate(date);
        j.setStartTime(LocalTime.of(9, 0));
        j.setEndTime(LocalTime.of(17, 0));
        j.setDailyWage(wage);
        j.setWorkersNeeded(5);
        j.setStatus(status);
        return j;
    }
}
