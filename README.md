# 🚀 Blogfolio Server (Backend)

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Advanced-blue?logo=postgresql)](https://www.postgresql.org/)
[![Testing](https://img.shields.io/badge/Vitest-Passing-success?logo=vitest)](https://vitest.dev/)

> The robust, 100% type-safe REST API powering the decoupled Blogfolio CMS ecosystem. 

This repository houses the backend architecture for Blogfolio. It is built to prioritize **end-to-end type safety**, **database query performance**, and **deterministic testing infrastructure**. Rather than relying on heavy ORMs, this project leverages raw, optimized SQL validated at build-time using `PgTyped`, ensuring the performance of raw SQL with the safety of modern TypeScript.

## ✨ Engineering Highlights

This codebase implements several advanced architectural patterns to ensure maintainability, type-safety, and scale:

### 1. End-to-End Type Safety (Without an ORM)
* **`PgTyped` Integration:** SQL queries are written in raw `.sql` files and statically analyzed to generate strict TypeScript interfaces. This provides maximum database performance and utilizing advanced Postgres features without sacrificing type safety.
* **Shared Zod Contracts:** Requests and responses are validated via composable Zod schemas imported from a custom utility package (`@blogfolio/types`). 
* **Strict Error Handling:** Application-specific error Enums are mapped into strictly typed discriminated unions, guaranteeing that the client receives predictable, well-typed error objects.

### 2. Advanced Database Architecture
* **Recursive CTEs:** Complex nested data structures, such as infinite-depth comment threads, are flattened and retrieved efficiently using PostgreSQL Recursive Common Table Expressions (CTEs) (`comments.sql`).
* **Dynamic Query Resolution:** Complex filtering, sorting, and pagination logic is handled via custom Pl/pgSQL functions using `JSONB` relation maps to dynamically resolve dependencies (e.g., `resolve_dependencies` in `2-utils.sql`).
* **Full-Text Search:** Utilizes Postgres `TSVECTOR` and `pg_trgm` (trigram) extensions for highly optimized, weighted full-text searching across posts and user profiles.

### 3. Ephemeral Integration Testing
* **Programmatic Docker Environments:** Testing is powered by a Vitest Workspace divided into `node` (unit) and `postgres` (integration) suites.
* Integration tests programmatically spin up isolated, ephemeral PostgreSQL Docker containers (`PgContainer.ts`) on dynamic ports. This ensures tests are deterministic, parallelizable, and completely agnostic to the host machine's local environment.

### 4. Custom Controller Abstraction
* Features a strongly-typed custom `createController` wrapper. It acts as a boundary that automatically catches Zod validation errors, enforces strict response payloads, and handles Express `NextFunction` error propagation, allowing the business logic to remain clean and focused.

## 🛠️ Tech Stack

* **Runtime:** Node.js, Express.js
* **Language:** TypeScript (Strict Mode)
* **Database:** PostgreSQL (with `pg_trgm`), `pg` (node-postgres)
* **Type Safety:** Zod, `@pgtyped/cli`, `@pgtyped/runtime`
* **Authentication:** Dual JWT & HTTP-Only Secure Cookie Sessions, `bcrypt`
* **Testing & CI:** Vitest, Docker, GitHub Actions

## 📂 Architecture & Directory Structure

```text
src/
├── app.ts                 # Express application entry point & global middleware
├── controllers/           # Route controllers & Zod-aware createController wrapper
├── db/                    # DB connection pool, PgTyped generated queries, and test data synthesizers
├── routes/                # Express routers with role-based authorization middleware
├── services/              # Core business logic, Auth (JWT/Sessions), and DB orchestration
└── util/                  # Shared utilities and global type definitions
sql/                       # Raw SQL migrations and advanced PL/pgSQL function definitions
docker/                    # Ephemeral Postgres container classes for test/dev orchestration
```

## 🚀 Getting Started

### Prerequisites
* Node.js (v20+)
* Yarn
* Docker (Desktop/Engine running locally)

### Local Development Setup

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Spin up the development database:**
   This custom script leverages the internal `PgContainer` class to build and expose a local Postgres database pre-seeded with the project's migrations.
   ```bash
   yarn docker-postgres up
   ```

3. **Start the API:**
   Runs the server with hot-reloading.
   ```bash
   yarn start-dev
   ```

4. **Watch SQL Queries (Optional):**
   If modifying `.sql` files, run PgTyped in watch mode to automatically regenerate TypeScript types.
   ```bash
   yarn pgtyped-start
   ```

## 🧪 Testing

The testing suite utilizes `Vitest` and is split into two workspaces: pure Node functions and Postgres-dependent queries. 

To run the entire suite (spins up Docker containers automatically):
```bash
yarn test-all
```
To run only unit tests:
```bash
yarn test
```
To run only DB integration tests:
```bash
yarn test-queries
```
