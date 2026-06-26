package com.flexiwork.config;

import com.flexiwork.entity.*;
import com.flexiwork.entity.enums.*;
import com.flexiwork.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Seeds demo accounts and jobs on first run only (skipped if any user already exists), so the app
 * is immediately demonstrable. Credentials are documented in the README.
 */
@Component
@Order(1)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final CompanyProfileRepository companyRepository;
    private final WorkerProfileRepository workerRepository;
    private final JobPostRepository jobRepository;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository userRepository,
                      CompanyProfileRepository companyRepository,
                      WorkerProfileRepository workerRepository,
                      JobPostRepository jobRepository,
                      PasswordEncoder encoder) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.workerRepository = workerRepository;
        this.jobRepository = jobRepository;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Seed skipped: users already present.");
            return;
        }
        log.info("Seeding demo data...");

        // --- Admin ---
        createUser("admin@flexiwork.lk", "Admin@123", Role.ADMIN, null);

        // --- Company 1: Serendib Resorts (hospitality, Galle) ---
        User serendibUser = createUser("hr@serendibresorts.lk", "Company@123", Role.COMPANY, null);
        CompanyProfile serendib = new CompanyProfile();
        serendib.setUser(serendibUser);
        serendib.setCompanyName("Serendib Resorts");
        serendib.setBrNumber("PV-00451209");
        serendib.setDistrict(District.GALLE);
        serendib.setAddressLine("12 Lighthouse Street, Galle Fort");
        serendib.setLatitude(6.0261);
        serendib.setLongitude(80.2168);
        serendib.setStatus(VerificationStatus.VERIFIED);
        serendib = companyRepository.save(serendib);
        createUser("guard@serendibresorts.lk", "Guard@123", Role.COMPANY_GUARD, serendib);
        createUser("poster@serendibresorts.lk", "Poster@123", Role.COMPANY_POSTER, serendib);

        // --- Company 2: Lanka Harvest Logistics (warehouse/delivery, Kurunegala) ---
        User harvestUser = createUser("ops@lankaharvest.lk", "Company@123", Role.COMPANY, null);
        CompanyProfile harvest = new CompanyProfile();
        harvest.setUser(harvestUser);
        harvest.setCompanyName("Lanka Harvest Logistics");
        harvest.setBrNumber("PV-00778821");
        harvest.setDistrict(District.KURUNEGALA);
        harvest.setAddressLine("88 Puttalam Road, Kurunegala");
        harvest.setLatitude(7.4818);
        harvest.setLongitude(80.3609);
        harvest.setStatus(VerificationStatus.VERIFIED);
        harvest = companyRepository.save(harvest);
        createUser("guard@lankaharvest.lk", "Guard@123", Role.COMPANY_GUARD, harvest);

        // --- Company 3: Cinnamon Grove Events (events, Kandy) ---
        User cinnamonUser = createUser("bookings@cinnamongrove.lk", "Company@123", Role.COMPANY, null);
        CompanyProfile cinnamon = new CompanyProfile();
        cinnamon.setUser(cinnamonUser);
        cinnamon.setCompanyName("Cinnamon Grove Events");
        cinnamon.setBrNumber("PV-00963407");
        cinnamon.setDistrict(District.KANDY);
        cinnamon.setAddressLine("21 Peradeniya Road, Kandy");
        cinnamon.setLatitude(7.2750);
        cinnamon.setLongitude(80.5950);
        cinnamon.setStatus(VerificationStatus.VERIFIED);
        cinnamon = companyRepository.save(cinnamon);

        // --- Workers (VERIFIED) across districts and skills ---
        createWorker("nimal.silva@gmail.com", "Worker@123", "Nimal Silva", "199203456712",
                "+94719731494", District.GALLE, 6.0535, 80.2210, "Waiter, Bartender, Housekeeping", 4.7);
        createWorker("ishara.fernando@gmail.com", "Worker@123", "Ishara Fernando", "199611223344",
                "+94776655443", District.KURUNEGALA, 7.4863, 80.3647, "Forklift operator, Packing, Loading", 4.3);
        createWorker("ravindu.bandara@gmail.com", "Worker@123", "Ravindu Bandara", "199805566778",
                "+94701112233", District.KANDY, 7.2906, 80.6337, "Event setup, Sound system, Crowd marshalling", 4.6);
        createWorker("dilini.perera@gmail.com", "Worker@123", "Dilini Perera", "199409988776",
                "+94759876543", District.COLOMBO, 6.9271, 79.8612, "Cleaning, Laundry, Kitchen helper", 4.8);

        // --- Open jobs across districts/categories ---
        createJob(serendib, "Beachfront Resort Housekeeper",
                "Clean and prepare guest rooms, restock amenities, and report maintenance issues.",
                JobCategory.HOTEL, District.GALLE, "Serendib Resorts, Galle Fort",
                6.0261, 80.2168, 1, LocalTime.of(8, 0), LocalTime.of(16, 0),
                new BigDecimal("3200"), 6);

        createJob(serendib, "Seafood Restaurant Line Cook Assistant",
                "Prep ingredients and plate dishes under chef supervision during dinner service.",
                JobCategory.RESTAURANT_KITCHEN, District.GALLE, "Serendib Resorts Beach Restaurant",
                6.0270, 80.2175, 1, LocalTime.of(15, 0), LocalTime.of(22, 0),
                new BigDecimal("3300"), 4);

        createJob(harvest, "Warehouse Packing Assistant",
                "Sort, pack, and label fresh produce crates for next-day distribution.",
                JobCategory.WAREHOUSE, District.KURUNEGALA, "Lanka Harvest Distribution Centre",
                7.4818, 80.3609, 1, LocalTime.of(6, 0), LocalTime.of(14, 0),
                new BigDecimal("2900"), 15);

        createJob(harvest, "Delivery Loader",
                "Load delivery trucks and verify order manifests before dispatch.",
                JobCategory.DELIVERY, District.KURUNEGALA, "Lanka Harvest Distribution Centre",
                7.4818, 80.3609, 2, LocalTime.of(5, 0), LocalTime.of(11, 0),
                new BigDecimal("2700"), 8);

        createJob(cinnamon, "Wedding Event Crew",
                "Set up stage, seating, and decor for an outdoor wedding reception.",
                JobCategory.EVENT_CAMPAIGN, District.KANDY, "Cinnamon Grove Gardens, Kandy",
                7.2750, 80.5950, 3, LocalTime.of(10, 0), LocalTime.of(19, 0),
                new BigDecimal("3800"), 12);

        createJob(cinnamon, "Conference Hall Cleaning Crew",
                "Deep-clean conference halls and restrooms ahead of a corporate summit.",
                JobCategory.CLEANING, District.KANDY, "Cinnamon Grove Convention Centre",
                7.2761, 80.5972, 2, LocalTime.of(7, 0), LocalTime.of(13, 0),
                new BigDecimal("2600"), 10);

        log.info("Seeding complete: {} users, {} jobs.",
                userRepository.count(), jobRepository.count());
    }

    private void createWorker(String email, String rawPassword, String fullName, String nic,
                              String whatsapp, District district, double lat, double lng,
                              String skills, double rating) {
        User user = createUser(email, rawPassword, Role.WORKER, null);
        WorkerProfile worker = new WorkerProfile();
        worker.setUser(user);
        worker.setFullName(fullName);
        worker.setNicNumber(nic);
        worker.setWhatsappNumber(whatsapp);
        worker.setWhatsappVerified(true);
        worker.setDistrict(district);
        worker.setLatitude(lat);
        worker.setLongitude(lng);
        worker.setSkills(skills);
        worker.setRatingAverage(rating);
        worker.setStatus(VerificationStatus.VERIFIED);
        workerRepository.save(worker);
    }

    private User createUser(String email, String rawPassword, Role role, CompanyProfile parent) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(encoder.encode(rawPassword));
        user.setRole(role);
        user.setParentCompany(parent);
        user.setActive(true);
        return userRepository.save(user);
    }

    private void createJob(CompanyProfile company, String title, String description,
                           JobCategory category, District district, String address,
                           double lat, double lng, int dayOffset, LocalTime start, LocalTime end,
                           BigDecimal wage, int needed) {
        JobPost job = new JobPost();
        job.setCompany(company);
        job.setTitle(title);
        job.setDescription(description);
        job.setCategory(category);
        job.setDistrict(district);
        job.setAddressLine(address);
        job.setLatitude(lat);
        job.setLongitude(lng);
        job.setJobDate(LocalDate.now().plusDays(dayOffset));
        job.setStartTime(start);
        job.setEndTime(end);
        job.setDailyWage(wage);
        job.setWorkersNeeded(needed);
        job.setStatus(JobStatus.OPEN);
        jobRepository.save(job);
    }
}
