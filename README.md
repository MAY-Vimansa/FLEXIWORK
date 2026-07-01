# FlexiWork

A temporary-workforce management platform for Sri Lanka — *"PickMe for daily labour."* It connects
companies (hotels, factories, restaurants, event organisers) with verified blue-collar workers for
next-day temporary jobs, featuring QR-based attendance, a 10% commission model, PDF receipts, and
WhatsApp/email notifications.

Built for the **Development of Enterprise Applications** module.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3.3.5 (Java 21), layered Controller → Service → Repository → Entity |
| Database | MySQL 8 + Spring Data JPA (Hibernate) |
| Security | Spring Security — **dual** filter chains (stateless JWT for the API, session + cookie + CSRF for the admin) |
| Frontend (workers/companies) | React 18 + Vite 8, plain CSS, mobile-first |
| Admin panel | Thymeleaf (server-rendered, CSRF, PUT/DELETE method override) |
| Maps | react-leaflet + OpenStreetMap (no API key); Google Maps deep links for navigation |
| QR codes | ZXing (generation) + html5-qrcode (scanning) |
| PDF | openhtmltopdf (receipts / invoices) |
| Media uploads | Cloudinary (cloud storage for KYC/BR/logo images) + local disk fallback |
| Email | Resend transactional email API (email OTP + contact-form forwarding) |
| Notifications | Meta WhatsApp Cloud API (Node micro-service) + Resend email |
| API docs | springdoc-openapi (Swagger UI) |
| Auth tokens | JJWT 0.12 |

---

## Architecture

```
React (Vite, :5173)  ──proxy /api──►  Spring Boot (:8080)
  • workers, companies, guard kiosk        ├─ /api/**   JWT chain (stateless)
  • JWT in localStorage                     └─ /admin/** session chain (CSRF)
                                                 │
Thymeleaf admin (server-rendered) ───────────────┤
                                                 │
                                          Service layer
                                          Repository (Spring Data JPA + Specifications)
                                                 │
                                             MySQL 8
                                                 │
Node WhatsApp micro-service (whatsapp-service/) ─┘  Meta WhatsApp Cloud API
```

Core JPA entities (all auditable via `Auditable`): `User`, `CompanyProfile`, `WorkerProfile`,
`JobPost`, `Application`, `Attendance`, `Payment`, `OtpToken`, plus `ContactMessage`,
`ShiftExtension`, and `SystemSettings`.

---

## Prerequisites

- **JDK 21** (Temurin recommended)
- **Maven 3.9+**
- **MySQL 8** running locally
- **Node.js 18+** (for the React frontend and the WhatsApp micro-service)

---

## Setup & run

### 1. Database
MySQL must be running. The app auto-creates the `flexiwork` schema on first run
(`createDatabaseIfNotExist=true`). Set your MySQL credentials in
`src/main/resources/application.yml` (default assumes `root` / `root`):

```yaml
spring:
  datasource:
    username: root
    password: root
```

A ready-made dump is available at `database/flexiwork_dump.sql` if you prefer to seed manually.

### 2. Backend
```bash
# from the project root
mvn spring-boot:run
```
The API starts on **http://localhost:8080**. On first run a seeder populates demo accounts and jobs
(skipped if any users already exist).

- Swagger UI: **http://localhost:8080/swagger-ui.html** (click **Authorize**, paste a JWT from `/api/auth/login`)
- Admin panel: **http://localhost:8080/login**

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
The React app starts on **http://localhost:5173** and proxies `/api` to the backend.

### 4. WhatsApp micro-service (optional)
```bash
cd whatsapp-service
npm install
node index.js
```
Handles outbound WhatsApp Cloud API messages. Disabled by default — messages are logged to the
server console instead.

### 5. Tests
```bash
mvn test
```

### Docker
A multi-stage `Dockerfile` builds the backend jar and runs it on a JRE-Alpine image (designed for
Railway; see `deploy/DEPLOY.md`). The frontend and WhatsApp service ship their own Dockerfiles.

---

## Demo accounts

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@flexiwork.lk` | `Admin@123` | Thymeleaf admin panel (`/login`) |
| Company owner | `hr@serendibresorts.lk` | `Company@123` | VERIFIED — "Serendib Resorts", Galle |
| Company guard | `guard@serendibresorts.lk` | `Guard@123` | Kiosk scanner only |
| Company poster | `poster@serendibresorts.lk` | `Poster@123` | Post/manage jobs only |
| Company owner | `ops@lankaharvest.lk` | `Company@123` | VERIFIED — "Lanka Harvest Logistics", Kurunegala |
| Company owner | `bookings@cinnamongrove.lk` | `Company@123` | VERIFIED — "Cinnamon Grove Events", Kandy |
| Worker | `nimal.silva@gmail.com` | `Worker@123` | VERIFIED, Galle |
| Worker | `ishara.fernando@gmail.com` | `Worker@123` | VERIFIED, Kurunegala |
| Worker | `ravindu.bandara@gmail.com` | `Worker@123` | VERIFIED, Kandy |
| Worker | `dilini.perera@gmail.com` | `Worker@123` | VERIFIED, Colombo |

> **Notifications are stubbed by default** (`flexiwork.whatsapp.enabled=false`, blank Resend/Cloudinary keys).
> WhatsApp messages and email OTP codes are **logged to the server console** instead of sent —
> watch the log to grab OTP codes during the demo. The payment gateway is simulated. To enable
> real delivery, set the WhatsApp token / phone-number-id, the **Resend** API key, and the
> **Cloudinary** credentials in `application.yml` (or via the matching env vars).

---

## Configuration (`application.yml`)

| Key | Purpose |
|---|---|
| `flexiwork.jwt.secret` / `.expiration-ms` | JWT signing + TTL |
| `flexiwork.uploads.dir` | Disk location for uploaded files & QR images |
| `flexiwork.payment.commission-rate` | Platform commission (default `0.10`) |
| `flexiwork.whatsapp.*` | Meta WhatsApp Cloud API token / phone-number-id / enabled flag |
| `flexiwork.otp.*` | OTP length, TTL, max attempts, resend cooldown |
| `cloudinary.cloud-name` / `.api-key` / `.api-secret` | Cloudinary media-storage credentials (`CLOUDINARY_*` env vars) |
| `resend.api-key` / `.from` | Resend transactional email API key + verified sender address |

The **prod profile** (`application-prod.yml`, run with `--spring.profiles.active=prod`) hardens
session cookies to `HttpOnly + Secure + SameSite=strict`.

---

## Key flows

- **Worker registration** — 3 steps (details → KYC files → WhatsApp OTP). Account is PENDING until
  an admin verifies the NIC photos.
- **Company registration** — details + BR certificate / logo / premises upload + Leaflet location
  pin. PENDING until an admin verifies the BR certificate.
- **Apply → accept → QR** — a worker applies; the company accepts → a unique QR token + image is
  issued and sent over WhatsApp; the job auto-fills and remaining applicants are auto-rejected.
- **Attendance** — a guard scans the QR at the gate; validated against company + today's date +
  duplicate check.
- **Completion & commission** — the company marks the job completed; commission (10%) is billed on
  the **verified attendances only**; payment via the simulated gateway; downloadable PDF
  receipt/invoice.

---

## Project structure

```
FLEXIWORK-main/
├─ src/main/java/com/flexiwork/
│  ├─ config/        security (dual chains), JWT, OpenAPI, auditing, seed
│  ├─ entity/        JPA entities (+ enums, Auditable base)
│  ├─ repository/    Spring Data JPA + JobPostSpecifications
│  ├─ dto/           request/response records (account, auth, job, payment, …)
│  ├─ service/       business logic (+ payment/ gateway, notifications)
│  ├─ controller/    REST endpoints (auth, jobs, applications, attendance, payments, …)
│  ├─ admin/         Thymeleaf admin controller
│  ├─ security/      JWT filter, principal, entry point
│  ├─ exception/     global handler + custom exceptions
│  └─ util/          helpers (QR, PDF, files)
├─ src/main/resources/
│  ├─ application.yml, application-prod.yml
│  ├─ templates/admin/   Thymeleaf pages
│  └─ static/css/        admin styles
├─ src/test/java/…       unit, MockMvc, @DataJpaTest
├─ frontend/             React + Vite app (pages: worker, company, guard)
├─ whatsapp-service/     Node WhatsApp Cloud API micro-service
├─ database/             flexiwork_dump.sql
├─ deploy/               DEPLOY.md (Railway)
└─ Dockerfile            multi-stage backend build
```

---

## License

Academic project — Development of Enterprise Applications module.
