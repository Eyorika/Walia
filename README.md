# WaliaBet - Enterprise Sports Betting Platform

WaliaBet is a high-performance, modular enterprise-grade sportsbook platform tailored for the Ethiopian market, featuring deep integrations for local payment systems like Telebirr, CBE Birr, Chapa, and M-Pesa.

## Project Structure
- `apps/web`: Public website and Customer App (React 19 + Vite + Tailwind)
- `apps/admin`: Administrative control panel (React 19 + Vite + Tailwind)
- `apps/bot`: Telegraf.js Telegram Betting Bot
- `packages/api`: REST API server (Node + Express + TS)
- `packages/shared`: Shared types, validators, and constants
- `packages/database`: PostgreSQL migrations and DB schema scripts

## Local Development Setup

1. **Install Dependencies**
   Ensure you have Node.js 20+ and pnpm installed:
   ```bash
   pnpm install
   ```

2. **Configure Environment Variables**
   Copy the example template file to create `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Start Development Stack**
   Start all applications concurrently using Turborepo commands:
   ```bash
   pnpm dev
   ```
   Or spin up the dockerized services locally:
   ```bash
   docker-compose up --build
   ```

4. **Verify Application Links**
   - Web App: `http://localhost:3000`
   - Admin Panel: `http://localhost:3001`
   - Express REST API: `http://localhost:4000`
   - API Docs (Swagger): `http://localhost:4000/docs`

## Features & Security
- Fully parameterized configurations targeting ETB (Ethiopian Birr).
- Rate Limiting and Helmet protection middleware checks standard.
- Shared schema rules validating bet slips, deposits, and withdrawal boundaries.
- Telegram linking commands mapping codes to users instantly.
