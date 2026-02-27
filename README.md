# 💳 UPI Payment Simulation System — Backend

A production-grade Spring Boot backend simulating a UPI-like digital payment platform.

---

## 🏗️ Project Structure

```
backend/
├── src/main/java/com/upi/payment/
│   ├── UpiPaymentApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java       # JWT + CORS + method security
│   │   ├── SwaggerConfig.java        # OpenAPI 3 docs
│   │   └── ScheduledTasks.java       # Daily limit reset cron
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── TransactionController.java
│   │   ├── WalletController.java
│   │   ├── BankAccountController.java
│   │   └── AdminController.java
│   ├── entity/                       # JPA entities with auditing
│   ├── enums/                        # TransactionStatus, UserRole, etc.
│   ├── dto/request/                  # Validated request bodies
│   ├── dto/response/                 # Typed response wrappers
│   ├── repository/                   # Spring Data JPA + custom queries
│   ├── service/impl/
│   │   ├── AuthService.java
│   │   ├── TransactionService.java   # ACID transfer engine
│   │   ├── FraudDetectionService.java
│   │   ├── WalletService.java
│   │   ├── BankAccountService.java
│   │   ├── AuditServiceImpl.java
│   │   └── AdminService.java
│   ├── security/
│   │   ├── JwtService.java
│   │   └── CustomUserDetailsService.java
│   ├── filter/
│   │   └── JwtAuthFilter.java
│   ├── exception/
│   │   └── GlobalExceptionHandler.java
│   └── util/
│       └── SecurityUtils.java
└── src/test/
    └── TransactionServiceTest.java
```

---

## ⚙️ Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8.0+
- Redis 7+ (optional — for caching; falls back to in-memory)
- Docker + Docker Compose (for containerized setup)

---

## 🚀 Quick Start

### Option A: Docker (Recommended)

```bash
# From project root (where docker-compose.yml is)
docker-compose up --build
```

Starts MySQL + Redis + Spring Boot backend automatically.

### Option B: Manual

1. **Create MySQL database:**
   ```sql
   CREATE DATABASE upi_payment_db;
   ```

2. **Set environment variables** (or edit `application.yml`):
   ```bash
   export DB_USERNAME=root
   export DB_PASSWORD=yourpassword
   export JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars
   ```

3. **Run the application:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

---

## 📡 API Endpoints

| Method | Endpoint                          | Auth | Description                     |
|--------|-----------------------------------|------|---------------------------------|
| POST   | `/api/v1/auth/register`           | ❌   | Register new user               |
| POST   | `/api/v1/auth/login`              | ❌   | Login (email/phone/UPI ID)      |
| POST   | `/api/v1/auth/refresh`            | ❌   | Refresh JWT token               |
| POST   | `/api/v1/auth/set-upi-pin`        | ✅   | Set UPI PIN                     |
| GET    | `/api/v1/wallet`                  | ✅   | Get wallet balance              |
| POST   | `/api/v1/transactions/transfer`   | ✅   | P2P money transfer              |
| POST   | `/api/v1/transactions/add-money`  | ✅   | Bank → Wallet deposit           |
| GET    | `/api/v1/transactions/history`    | ✅   | Paginated transaction history   |
| GET    | `/api/v1/transactions/{ref}`      | ✅   | Get transaction by reference    |
| POST   | `/api/v1/bank-accounts`           | ✅   | Link bank account               |
| GET    | `/api/v1/bank-accounts`           | ✅   | List linked accounts            |
| DELETE | `/api/v1/bank-accounts/{id}`      | ✅   | Remove bank account             |
| GET    | `/api/v1/admin/dashboard`         | 🔑   | Admin dashboard stats           |
| GET    | `/api/v1/admin/users`             | 🔑   | List all users                  |
| PATCH  | `/api/v1/admin/users/{id}/freeze` | 🔑   | Freeze user account             |
| GET    | `/api/v1/admin/transactions/flagged` | 🔑  | View flagged transactions    |

✅ = JWT required | 🔑 = Admin JWT required

---

## 📚 Swagger UI

After starting the app, open:
```
http://localhost:8080/swagger-ui.html
```

---

## 🔒 Key Design Decisions

### ACID Transactions
The P2P transfer uses `SERIALIZABLE` isolation and **pessimistic WRITE locks** on both wallets, always acquired in ascending wallet ID order to prevent deadlocks.

### Idempotency
Every transfer request requires a client-supplied `idempotencyKey`. The server checks this before processing — duplicate submissions return the original result (HTTP 409) instead of charging twice.

### Fraud Detection
A scoring engine assigns 0–100 risk scores based on:
- Transaction velocity (last 1 hour)
- High-value amount threshold
- Off-hours activity (11 PM – 4 AM)
- Rapid repeat transfers

Score ≥ 40 → flagged for review; Score ≥ 80 → auto-blocked.

### Concurrency
Handled via both optimistic locking (`@Version` on Wallet entity) and pessimistic locking (`PESSIMISTIC_WRITE` in repository queries).

### Audit Logging
Every significant action is recorded in an immutable `audit_logs` table. Written in a separate async transaction (`REQUIRES_NEW`) so audit logs survive even if the main transaction rolls back.

---

## 🧪 Running Tests

```bash
cd backend
mvn test
```

---

## 🌱 Default Admin Account

After Docker startup:
- **Email:** `admin@upi.com`
- **Password:** `Admin@1234`
- **Role:** `ROLE_ADMIN`

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Spring Boot 3.2 |
| Security | Spring Security + JWT (JJWT) |
| Database | MySQL 8 + Spring Data JPA |
| Caching | Redis + Spring Cache |
| Docs | SpringDoc OpenAPI (Swagger) |
| Testing | JUnit 5 + Mockito |
| Container | Docker + Docker Compose |
| Build | Maven |
