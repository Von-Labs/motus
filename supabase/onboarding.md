# Supabase Onboarding

This guide is for local or personal development projects. It explains how to mirror the current schema and how to contribute migrations back.

## Environments

We use two environments:

- `staging` branch -> Supabase dev project
- `main` branch -> Supabase prod project

Avoid direct schema changes in shared hosted environments. Changes should flow through migrations in this repo.

## Install Supabase CLI

Pick one of the options below.

macOS (Homebrew):

```bash
brew install supabase/tap/supabase
```

Windows (Scoop):

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Windows (Chocolatey):

```powershell
choco install supabase
```

Linux/macOS/Windows (Node-based, no global install):

```bash
npx supabase --version
```

## Apply changes from `staging` into your own dev project

Use this when you want a personal Supabase project that mirrors the current schema.

1. Checkout `staging`.
2. Create your own Supabase project in the dashboard.
3. Ensure Docker is installed and running (required for `supabase start`).
4. Login and link to your new project.
5. Start local Supabase and push migrations.

Commands:

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase start
supabase db push
```

Notes:

- You can find `PROJECT_REF` in Supabase dashboard -> Project Settings -> General.
- The `db push` applies local migrations to the linked remote project.

## Create a new migration

```bash
supabase migration new <short_name>
```

Edit the generated SQL file under `supabase/migrations/`.

Apply migrations locally (or to the linked project):

```bash
supabase db push
```

## Pull changes from your dev project into this repo

If you made schema changes in your own Supabase project and want to create a migration file:

1. Ensure Docker is running.
2. Login and link to your project.
3. Run a `db pull` to generate a migration.
4. Review the migration file.
5. Commit to a branch and open a PR targeting `staging`.

Commands:

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db pull <migration_name>
```

## Edge functions

Functions live in `supabase/functions/`.

Deploy all functions:

```bash
supabase functions deploy
```

Deploy a single function:

```bash
supabase functions deploy <function_name>
```

## CI/CD flow

On push to `staging` or `main`, GitHub Actions will:

1. Checkout the repo
2. Install Supabase CLI
3. Link the target project with `supabase link --project-ref ...`
4. Apply migrations with `supabase db push`
5. Deploy functions if any exist

You can also trigger workflows manually from GitHub Actions (workflow_dispatch).

## Notes

- The Supabase CLI uses the `SUPABASE_*_ACCESS_TOKEN` to authenticate in CI.
- Do not commit generated secrets, keys, or local `.env` files.
