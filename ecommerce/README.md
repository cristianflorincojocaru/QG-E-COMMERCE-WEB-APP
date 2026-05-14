# LuxeCart — Full-Stack E-Commerce Platform

Angular 17 + ASP.NET Core 8 + MS SQL Server · no ORM · Docker-ready

---

## Tech Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | Angular 17, Standalone Components, RxJS, Signals    |
| Backend  | ASP.NET Core 8 Web API, ADO.NET raw SQL (no EF Core)|
| Database | MS SQL Server 2022                                  |
| Auth     | JWT Bearer + BCrypt (work factor 12)                |
| Docs     | Swagger / OpenAPI (auto-generated)                  |
| Logging  | Serilog — console + rolling file                    |
| Tests    | xUnit + Moq (C#) · Jasmine + Karma (Angular)        |
| Docker   | docker compose up — one command, full stack          |

---

## Project Structure

```
ecommerce/
├── docker-compose.yml            ← one-command full-stack setup
├── .env.example                  ← copy to .env, fill secrets
├── database/
│   └── ECommerceDB.sql           ← creates DB + seeds 30 products
├── backend/
│   ├── Dockerfile
│   ├── ECommerce.sln
│   ├── ECommerceAPI/
│   │   ├── Controllers/          ← Auth, Products, Cart, Orders
│   │   ├── Services/             ← business logic (DI interfaces)
│   │   ├── Models/               ← domain POCOs
│   │   ├── DTOs/                 ← request / response contracts
│   │   ├── Data/                 ← IDbContext (raw SqlConnection)
│   │   └── Program.cs            ← DI, JWT, Swagger, Serilog
│   └── ECommerceAPI.Tests/       ← xUnit tests
└── frontend/
    ├── Dockerfile
    ├── nginx.conf                ← SPA routing + API proxy
    └── src/app/
        ├── components/           ← Home, ProductList, Cart,
        │                           Checkout, Orders, Register,
        │                           Login, Navbar, Toast, 404
        ├── services/             ← Auth, Cart (BehaviorSubject),
        │                           Product, Order, Toast
        ├── guards/               ← authGuard
        ├── interceptors/         ← JWT interceptor
        └── models/               ← TypeScript interfaces
```

---

## Option A — Docker (recommended, zero setup)

```bash
# 1. Copy and fill secrets
cp .env.example .env
# Edit .env: set DB_PASSWORD and JWT_SECRET

# 2. Start everything
docker compose up --build
```

| Service  | URL                              |
|----------|----------------------------------|
| App      | http://localhost:4200            |
| API      | http://localhost:5000            |
| Swagger  | http://localhost:5000/swagger    |
| SQL      | localhost:1433 (sa / from .env)  |

```bash
# Stop and remove volumes
docker compose down -v
```

---

## Option B — Manual Setup

### Prerequisites

| Tool            | Version  | Link                                      |
|-----------------|----------|-------------------------------------------|
| .NET SDK        | 8.0+     | https://dotnet.microsoft.com/download     |
| Node.js         | 18+ LTS  | https://nodejs.org                        |
| Angular CLI     | 17+      | `npm install -g @angular/cli`             |
| MS SQL Server   | 2019+    | https://www.microsoft.com/sql-server      |

### 1 — Database

```bash
# Option 1: sqlcmd
sqlcmd -S localhost -E -i database/ECommerceDB.sql

# Option 2: Open in SSMS and press F5
```

Creates `ECommerceDB` with all tables and seeds **30 products** across 8 categories.

### 2 — Backend

Edit `backend/ECommerceAPI/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ECommerceDB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Secret": "REPLACE_WITH_32_CHAR_RANDOM_STRING",
    "Issuer": "ECommerceAPI",
    "Audience": "ECommerceClient"
  }
}
```

```bash
cd backend
dotnet restore ECommerce.sln
dotnet run --project ECommerceAPI/ECommerceAPI.csproj
# API → http://localhost:5000
# Swagger → http://localhost:5000/swagger
```

### 3 — Frontend

```bash
cd frontend
npm install
ng serve
# App → http://localhost:4200
```

---

## Running Tests

```bash
# Backend (xUnit)
cd backend
dotnet test ECommerceAPI.Tests/ --verbosity normal

# Frontend (Jasmine / Karma)
cd frontend
ng test --watch=false --browsers=ChromeHeadless
```

---

## API Reference

### Auth
| Method | Endpoint              | Body                              |
|--------|-----------------------|-----------------------------------|
| POST   | `/api/auth/register`  | `firstName, lastName, email, password` |
| POST   | `/api/auth/login`     | `email, password`                 |

### Products *(public)*
| Method | Endpoint                   | Query params                         |
|--------|----------------------------|--------------------------------------|
| GET    | `/api/products`            | `category`, `search`, `page`, `pageSize` |
| GET    | `/api/products/{id}`       | —                                    |
| GET    | `/api/products/categories` | —                                    |

Paginated — response: `{ items, totalItems, page, pageSize, totalPages, hasNext, hasPrevious }`

### Cart *(JWT required)*
| Method | Endpoint                | Body               |
|--------|-------------------------|--------------------|
| GET    | `/api/cart`             | —                  |
| POST   | `/api/cart`             | `productId, quantity` |
| PUT    | `/api/cart/{productId}` | `quantity`         |
| DELETE | `/api/cart/{productId}` | —                  |

### Orders *(JWT required)*
| Method | Endpoint               | Body               |
|--------|------------------------|--------------------|
| POST   | `/api/orders/checkout` | `shippingAddress`  |
| GET    | `/api/orders`          | —                  |
| GET    | `/api/orders/{id}`     | —                  |

---

## Security Design

### Price integrity (critical business rule)
```
Client → POST /api/orders/checkout  { shippingAddress: "..." }
                                     ↑ NO price sent
Server → queries Products table → sums UnitPrice × Quantity → saves TotalPrice
```
Client-supplied totals are **never trusted**. Price tampering is impossible.

### Password storage
Passwords are hashed with **BCrypt (work factor 12)** — never stored plain.

### SQL injection prevention
Every query uses **parameterized SQL**:
```csharp
cmd.Parameters.AddWithValue("@Email", email);  // ✓ safe
// Never: $"WHERE Email = '{email}'"            // ✗ injection
```

### JWT lifecycle
- 8-hour expiry · `ClockSkew = TimeSpan.Zero`
- Attached to every request by the Angular `jwtInterceptor`

---

## State Management (Frontend)

```
CartService.cartSubject (BehaviorSubject<Cart>)
    │
    ├── NavbarComponent   → updates badge count + pop animation
    ├── CartComponent     → shows full item list + totals
    └── CheckoutComponent → shows order summary sidebar

AuthService (Angular Signals)
    isLoggedIn  = signal<boolean>()
    currentUser = signal<AuthResponse | null>()
```

---

## Logging (Serilog)

```
[10:30:01 INF] HTTP GET /api/products responded 200 in 12.3ms
[10:30:05 INF] HTTP POST /api/auth/login responded 200 in 45.1ms
[10:30:12 INF] HTTP POST /api/orders/checkout responded 200 in 38.7ms
```

Logs are written to console and `logs/api-YYYYMMDD.log` (7-day rolling).

---

## Health Check

```bash
# Full status report (JSON)
curl http://localhost:5000/health

# Liveness probe (used by Docker)
curl http://localhost:5000/health/live
```

Example response:
```json
{
  "status": "Healthy",
  "checks": [
    { "name": "self",     "status": "Healthy", "description": "API is running." },
    { "name": "database", "status": "Healthy", "description": "SQL Server is reachable." }
  ],
  "totalDuration": "8.2ms"
}
```

---

## Rate Limiting

The `POST /api/auth/login` endpoint is protected against brute-force attacks:

- **5 requests** per **60 seconds** per IP address
- Exceeding the limit returns `429 Too Many Requests`
- All other API endpoints allow **120 requests / minute**

---

## CI/CD

GitHub Actions runs on every push and PR to `main`:

1. `backend-tests` — restores, builds, and runs all xUnit tests
2. `frontend-tests` — installs, runs Jasmine/Karma in headless Chrome
3. `docker-build` — verifies both Dockerfiles build successfully (only if tests pass)

Workflow file: `.github/workflows/ci.yml`

---

## Error Handling Strategy

### Backend
- All unhandled exceptions return `{ "message": "..." }` JSON — stack traces never leak
- Each controller returns semantic HTTP status codes (400, 401, 404, 409, 429)
- SQL Server errors are caught in the health check and reported as `Unhealthy`

### Frontend
| Status | `httpErrorInterceptor` action |
|--------|-------------------------------|
| `0`    | Toast "Cannot reach server"   |
| `401`  | Auto-logout + redirect `/login` + Toast |
| `403`  | Toast "No permission"         |
| `429`  | Toast "Too many requests"     |
| `5xx`  | Toast "Server error"          |
| Auth endpoints | Skipped — component handles them |
