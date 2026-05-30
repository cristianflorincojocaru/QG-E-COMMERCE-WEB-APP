# Quest Global - E-COMMERCE WEB APP

<div align="center">

**🛍️ LuxeCart — a full-stack e-commerce vertical slice built with Angular 17 + ASP.NET Core 10 + MS SQL Server for Quest Global.**

![Angular](https://img.shields.io/badge/Angular-17-DD0031?style=for-the-badge&logo=angular)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-10-512BD4?style=for-the-badge&logo=dotnet)
![MS SQL](https://img.shields.io/badge/MS%20SQL%20Server-Database-CC2927?style=for-the-badge&logo=microsoftsqlserver)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)

</div>


## OVERVIEW

**LuxeCart** is a production-quality e-commerce platform implementing a full vertical slice — from database to UI — covering product browsing, cart management, checkout, order history, and a complete admin back-office. Built against the [AUTOMATION EXERCISE](https://automationexercise.com) API specification.

### DESIGN LANGUAGE

Minimalist luxury aesthetic: warm off-white backgrounds, charcoal text, amber-gold accents (`#C5973A`), Playfair Display display font paired with DM Sans body copy. Every interaction has a considered animation — accordion expansions, price bumps, SVG checkmark draws on order confirmation.


## ARCHITECTURE

```
ecommerce/
├── backend/
│   ├── ECommerceAPI/
│   │   ├── Controllers/
│   │   │   ├── AdminController.cs
│   │   │   ├── AuthController.cs
│   │   │   ├── CartOrderControllers.cs
│   │   │   └── ProductsController.cs
│   │   ├── Data/
│   │   │   └── DbContext.cs
│   │   ├── DTOs/
│   │   │   └── DTOs.cs
│   │   ├── Models/
│   │   │   └── Models.cs
│   │   ├── Properties/
│   │   │   └── launchSettings.json
│   │   ├── Services/
│   │   │   ├── AuthService.cs
│   │   │   ├── CartService.cs
│   │   │   ├── OrderService.cs
│   │   │   ├── ProductService.cs
│   │   │   └── SqlHealthCheck.cs
│   │   ├── logs/
│   │   ├── appsettings.json
│   │   ├── Program.cs
│   │   └── ECommerceAPI.csproj
│   ├── ECommerceAPI.Tests/
│   │   ├── AuthServiceTests.cs
│   │   └── OrderServiceTests.cs
│   └── Dockerfile
│
├── frontend/
│   └── src/app/
│       ├── components/
│       │   ├── admin/
│       │   ├── cart/
│       │   ├── checkout/
│       │   ├── login/
│       │   ├── navbar/
│       │   ├── not-found/
│       │   ├── orders/
│       │   ├── product-list/
│       │   ├── register/
│       │   └── toast/
│       ├── guards/
│       │   └── auth.guard.ts
│       ├── interceptors/
│       │   ├── jwt.interceptor.ts
│       │   └── error.interceptor.ts
│       ├── models/
│       │   └── models.ts
│       └── services/
│           ├── auth.service.ts
│           ├── cart.service.ts
│           ├── product-order.service.ts
│           └── toast.service.ts
│
├── docker-compose.yml
└── .github/
    └── workflows/
        └── ci.yml
```


## TECH STACK

| LAYER | TECHNOLOGY |
|---|---|
| Frontend | Angular 17 (standalone components, Signals, RxJS) |
| Backend | ASP.NET Core (.NET 10) |
| Database | Microsoft SQL Server |
| ORM | Raw ADO.NET — no ORM (per exercise requirements) |
| Auth | JWT Bearer tokens + BCrypt password hashing |
| Logging | Serilog (structured, file + console sinks) |
| API Docs | Swagger / OpenAPI with JWT authorization support |
| Testing (BE) | xUnit + Moq + FluentAssertions |
| Testing (FE) | Jasmine + Karma |
| Containerization | Docker + Docker Compose |
| CI | GitHub Actions |



## FEATURES

### 🔐 AUTHENTICATION
- Register / Login with BCrypt-hashed passwords
- JWT Bearer tokens stored in `localStorage`
- Global HTTP interceptor attaches tokens to every request
- Rate limiting on `/api/auth/login` — 5 attempts per IP per minute (429 Too Many Requests)
- Angular Signals for reactive auth state across the app

### 🛍️ SHOP
- Paginated product listing with search and category filtering
- Debounced search input (no request spam)
- Add to cart with animated navbar badge pop

### 🛒 CART
* Real-time quantity controls (+ / −) with optimistic UI
* Price bump animation on total when quantity changes
* Skeleton loading state on first load
* `BehaviorSubject` for shared state — single `loadCart()` call at app init, all components subscribe
* Empty state with consistent SVG icon matching the rest of the app

### ✅ CHECKOUT
- Multi-field shipping form with inline validation
- Server-side total verification (client only sends address)
- Animated SVG checkmark on order confirmation
- Order summary sidebar with sticky positioning

### 📦 ORDERS
* Full order history with expandable accordion rows
* Smooth `max-height` CSS transition for open/close animation (both directions)
* Items table with unit price, quantity, subtotal per line
* Full shipping address display
* Status badges (Pending / Shipped / Delivered / Cancelled)

### 🔧 ADMIN DASHBOARD
- **Users tab** — role toggle (Customer ↔ Admin), delete (protected account cannot be deleted)
- **Orders tab** — expandable order details, inline status dropdown
- **Products tab** — full CRUD with add/edit form, low-stock highlight
- Tab animations with underline indicator

### 🏥 HEALTH CHECKS
- `/health` — full dependency check (SQL Server connectivity)
- `/health/live` — lightweight liveness probe

### 🚫 404 PAGE
- Consistent design with decorative floating shapes and `fadeUp` animation



## DATABASE SCHEMA

### ENTITIES

| ENTITY | KEY FIELDS |
|---|---|
| `Users` | `Id`, `FirstName`, `LastName`, `Email`, `PasswordHash`, `Role`, `CreatedAt` |
| `Products` | `Id`, `Name`, `Description`, `Price`, `Category`, `ImageUrl`, `Stock` |
| `Cart` | `Id`, `UserId` |
| `CartItems` | `Id`, `CartId`, `ProductId`, `Quantity` |
| `Orders` | `Id`, `UserId`, `TotalPrice`, `ShippingAddress`, `Status`, `CreatedAt` |
| `OrderItems` | `Id`, `OrderId`, `ProductId`, `Quantity`, `UnitPrice` |

### RELATIONSHIPS

```
Users ──< Cart ──< CartItems >── Products
Users ──< Orders ──< OrderItems >── Products

Products ──< CartItems
Products ──< OrderItems
```



## API ENDPOINTS

### AUTH
| METHOD | ENDPOINT | ACCESS |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public (rate-limited) |

### PRODUCTS
| METHOD | ENDPOINT | ACCESS |
|---|---|---|
| GET | `/api/products` | Public |
| GET | `/api/products/categories` | Public |
| POST | `/api/products` | Admin |
| PUT | `/api/products/{id}` | Admin |
| DELETE | `/api/products/{id}` | Admin |

### CART
| METHOD | ENDPOINT | ACCESS |
|---|---|---|
| GET | `/api/cart` | Customer |
| POST | `/api/cart` | Customer |
| PUT | `/api/cart/{productId}` | Customer |
| DELETE | `/api/cart/{productId}` | Customer |

### ORDERS
| METHOD | ENDPOINT | ACCESS |
|---|---|---|
| GET | `/api/orders` | Customer |
| POST | `/api/orders/checkout` | Customer |

### ADMIN
| METHOD | ENDPOINT | ACCESS |
|---|---|---|
| GET | `/api/admin/users` | Admin |
| PUT | `/api/admin/users/{id}/role` | Admin |
| DELETE | `/api/admin/users/{id}` | Admin |
| GET | `/api/admin/orders` | Admin |
| PUT | `/api/admin/orders/{id}/status` | Admin |

### HEALTH
| METHOD | ENDPOINT | ACCESS |
|---|---|---|
| GET | `/health` | Public |
| GET | `/health/live` | Public |



## GETTING STARTED

### PREREQUISITES

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org) + Angular CLI (`npm i -g @angular/cli`)
- [SQL Server](https://www.microsoft.com/en-us/sql-server) (or Docker)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (optional)



### Option A — DOCKER COMPOSE (recommended)

Spins up SQL Server, seeds the database, runs the API, and serves the Angular build via nginx in one command:

```bash
git clone https://github.com/<your-username>/LuxeCart.git
cd LuxeCart
docker-compose up --build
```

| SERVICE | URL |
|---|---|
| Angular frontend | http://localhost:4200 |
| ASP.NET Core API | http://localhost:5000 |
| Swagger UI | http://localhost:5000/swagger |



### Option B — MANUAL SETUP

**1. BACKEND**

```bash
cd ecommerce/backend/ECommerceAPI
```

Update `appsettings.json` with your SQL Server connection string:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=LuxeCartDb;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

Set your JWT secret:

```json
"Jwt": {
  "Key": "your-256-bit-secret-here",
  "Issuer": "LuxeCartAPI",
  "Audience": "LuxeCartClient"
}
```

Run the API (creates and seeds the database on first run):

```bash
dotnet run
```

API available at https://localhost:{port} · Swagger at /swagger
(port shown in terminal after dotnet run)

**2. FRONTEND**

```bash
cd ecommerce/frontend
npm install
ng serve
```

Frontend available at `http://localhost:4200`



## RUNNING TESTS

### BACKEND (xUnit)

```bash
cd ecommerce/backend
dotnet test
```

### FRONTEND (Jasmine / Karma)

```bash
cd ecommerce/frontend
ng test
```



## CI / CD

GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on every push and pull request to `main`:

1. **Backend** — `dotnet build` + `dotnet test`
2. **Frontend** — `npm ci` + `ng build` + `ng test --watch=false`
3. **Docker** — `docker-compose build` verification



## DEFAULT CREDENTIALS

| ROLE | EMAIL | PASSWORD |
|---|---|---|
| Admin | `admin@luxecart.com` | `Admin123!` |
| Customer | *(register via UI)* | — |

> The admin account is protected — it cannot be deleted or demoted via the UI.



## DESIGN PATTERNS

| PATTERN | IMPLEMENTATION |
|---|---|
| **Raw ADO.NET** | All DB access via parameterized `SqlCommand` — no ORM |
| **Service Layer** | Business logic in `Services/` — controllers are thin |
| **BehaviorSubject** | Cart state shared across components via RxJS |
| **Angular Signals** | Auth state (`isLoggedIn`, `currentUser`, `isAdmin`) |
| **JWT Interceptor** | Global `HttpInterceptor` attaches Bearer token |
| **Error Interceptor** | Global handler for 401 / 403 / 429 / 5xx responses |
| **Rate Limiting** | Per-IP sliding window on login endpoint |
| **Structured Logging** | Serilog with daily rolling file sink |
| **Guard** | `AuthGuard` protects routes — redirects unauthenticated users to login |


## PROJECT NOTES

* No ORM — all database interactions use raw `SqlDataReader` and parameterized queries as required by the exercise specification
* Server-side total — checkout endpoint recomputes the order total from the database; the client only sends the shipping address
* Single `loadCart()` call — `AppComponent` loads the cart once on init; all components subscribe to the `BehaviorSubject` stream rather than making additional requests
* Protected admin account — `admin@luxecart.com` is excluded from role toggle and delete operations at both API and UI level
* Rate limiting — login endpoint enforces a per-IP sliding window; repeated failed attempts return 429 Too Many Requests before lockout



## CONTRIBUTIONS

Project created by **Cristian Florin Cojocaru** (**CSE.3** - **University of Craiova / Faculty of Automatics, Computer Science and Electronics**). Contributions are welcome ! If you have suggestions for improving the code or documentation, please submit a pull request.


## LICENSE

This project is licensed under the [MIT License](LICENSE).
