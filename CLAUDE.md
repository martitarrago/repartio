# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Repartio is a SaaS platform for managers of collective self-consumption (*autoconsumo colectivo*) in Spain. It generates `.txt` coefficient distribution files compliant with **Real Decreto 244/2019 (Anexo I)**.

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint check

# Database
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:push      # Sync schema to PostgreSQL (no migration file)
npm run db:migrate   # Create and apply a migration
npm run db:studio    # Open Prisma Studio at http://localhost:5555
```

## Environment Variables

```bash
DATABASE_URL="postgresql://user:password@host:5432/repartio?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="very-secure-random-string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BLOB_READ_WRITE_TOKEN=""   # Optional: Vercel Blob storage
```

## .txt File Format (RD 244/2019 Anexo I)

These rules are non-negotiable — the file must pass distributor validation:

- **Encoding:** UTF-8 without BOM
- **Filename:** `{CAU}_{AÑO}.txt`
- **Separator:** semicolon (`;`)
- **Decimal separator:** comma (`,`)
- **CUPS:** exactly 22 characters
- **Coefficient:** exactly 8 characters (e.g. `0,250000`)
- **Invariant:** sum of coefficients per hour must equal exactly `1`

## Design system

Stripe/Vercel style — clean, minimalist, B2B. Brand personality: clear, trustworthy, modern, direct.

### Colors

- **Primary:** `#111827` (brand black) — buttons, CTAs, active states, text
- **Accent (Solar Yellow):** `#EAB308` — highlights, focus rings, energy data, success states, brand accent
- **Background:** `#F9FAFB` · Cards: `#FFFFFF`
- **Text secondary:** `#6B7280` · Borders: `#E5E7EB`
- **Destructive:** `#DC2626` · Warning: `#D97706` · Info: `#2563EB`
- **Palette rule:** 85% neutrals/black · 15% yellow (accent, energy, success)

### Typography

- **Body:** Manrope (--font-manrope) · 13px · weight 400
- **Headings:** Sora (--font-sora)
- **Logo text:** Inter Bold, all lowercase

### Logo

- Concept: tilted 3×3 solar panel grid — 8 black cells + 1 yellow cell (top-left, representing the sun)
- Wordmark: "repartio" in Inter Medium, lowercase, `#111827`
- Favicon: the solar panel grid icon alone
- Auth gradient: dark-to-dark (`#111827` → `#1f2937`)

## Architecture

**Stack:** Next.js 15 (App Router) + TypeScript + Prisma 5 (PostgreSQL) + NextAuth.js v5 + Tailwind CSS + Radix UI (shadcn/ui pattern)

**Path alias:** `@/*` maps to `src/*`

### App Router layout

- `src/app/(auth)/` — Public routes: `/login`, `/register`
- `src/app/(dashboard)/` — Protected routes: `/dashboard`, `/installations/[id]`
- `src/app/api/auth/[...nextauth]/` — NextAuth handler
- `src/middleware.ts` — Redirects unauthenticated users to `/login`; redirects logged-in users away from auth pages to `/dashboard`

### Domain model (Prisma schema at `prisma/schema.prisma`)

Multi-tenant SaaS for Spanish *autoconsumo colectivo* (Real Decreto 244/2019):

- **Organizacion** — top-level tenant; owns users and installations
- **Usuario** — roles: `SUPERADMIN | ADMIN | GESTOR | LECTOR`; password stored as bcrypt hash
- **Instalacion** — a self-consumption installation with CAU code, modality, technology, power, state
- **Participante** — a consumer with a 22-char CUPS code, belonging to an installation
- **ConjuntoCoeficientes** — a versioned set of distribution coefficients (states: `BORRADOR → VALIDADO → PUBLICADO → ARCHIVADO`)
- **EntradaCoeficiente** — individual coefficient value; unique on `(conjuntoId, participanteId, hora, tipoDia)`; supports constant (β) and variable (hourly × day-type) modes
- **HistorialFichero** — audit log of generated `.txt` files

### Auth (`src/auth.ts`)

NextAuth v5 Credentials provider. JWT session strategy. Extends the session with `organizacionId`, `organizacion`, and `rol`. Updates last-access timestamp on login.

### Key source directories

| Path | Purpose |
|------|---------|
| `src/components/ui/` | Reusable Radix UI primitives |
| `src/components/editor/` | Coefficient editor UI |
| `src/components/installations/` | Installation CRUD components |
| `src/lib/prisma.ts` | Prisma singleton (use this, never instantiate directly) |
| `src/lib/generators/txtGenerator.ts` | `.txt` file generation logic |
| `src/lib/validators/` | Zod schemas |
| `src/hooks/useEditorCoeficientes.ts` | State management for the coefficient editor |
| `src/types/editor.ts` | TypeScript interfaces for the editor domain |
