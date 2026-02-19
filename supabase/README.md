# Motus Supabase

This folder is the source of truth for Supabase schema migrations and functions used by Motus.

## What lives here

- `migrations/` SQL migrations
- `functions/` Supabase Edge Functions (if/when added)
- `billing.md` Billing system schema and usage notes
- `onboarding.md` Local/personal development setup and workflow

## CI/CD

Workflows live in `/.github/workflows/`:

- `supabase-development.yml` deploys `staging` branch to the dev project
- `supabase-production.yml` deploys `main` branch to the prod project

On each deploy, GitHub Actions:

1. Installs Supabase CLI
2. Links the target project
3. Runs `supabase db push`
4. Deploys functions if any exist

## Quick links

- Local setup and workflow: `onboarding.md`
- Billing schema and usage: `billing.md`
