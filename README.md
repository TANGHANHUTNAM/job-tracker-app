# JobPilot

JobPilot is a job application tracker built with Next.js, Prisma, and Supabase PostgreSQL.

## Stack

- Next.js 16
- React 19
- TypeScript
- Prisma ORM
- Supabase Auth
- Supabase PostgreSQL

## Database Design

The current MVP database includes:

- `profiles`
- `job_sources`
- `job_applications`
- `reminders`

Authentication is handled by Supabase Auth. App-level authorization is stored in `profiles` using:

- `role`: `ADMIN | USER`
- `isBlocked`: soft block flag

Job sources are stored in `job_sources` and managed by admins. Sources use soft disable with `isActive` so existing jobs keep their historical source data.

## Environment Variables

Create `.env` from `.env.example` and fill in:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:6543/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Database Initialization

### 1. Create a Supabase project

- Create a new Supabase project
- Open project settings
- Copy the Postgres connection strings
- Copy the project URL and publishable key

### 2. Configure environment variables

- Put the pooled connection into `DATABASE_URL`
- Put the direct connection into `DIRECT_URL`
- Add your Supabase URL and publishable key
- Add `SUPABASE_SERVICE_ROLE_KEY` for privileged server-side flows

### 3. Validate and generate Prisma

```bash
npx prisma validate
npx prisma generate
```

### 4. Create the first migration

```bash
npx prisma migrate dev --name init_auth_profiles_jobs_reminders
```

### 5. Seed default job sources

```bash
npm run db:seed
```

This seeds a default admin-managed source list:

- LinkedIn
- TopCV
- VietnamWorks
- Indeed
- Company Website
- Referral
- Other

### 6. Create the first admin user

Recommended flow:

1. Create the auth account with Supabase Auth
2. Insert the matching record into `profiles`
3. Set `role = ADMIN`
4. Keep `isBlocked = false`

The `profiles.id` value must match the Supabase Auth user id.

### 7. Profile creation strategy

This project uses app-side profile creation after signup.

Flow:

1. User signs up with Supabase Auth
2. App receives the auth user id
3. App inserts a row into `profiles`
4. Default values:
   - `role = USER`
   - `isBlocked = false`

### 8. Development commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
```

## Prisma 7 Note

This project uses Prisma config-based datasource URLs.

- `schema.prisma` keeps only `provider` in the `datasource` block
- connection URLs live in `prisma.config.ts`
- runtime Prisma uses `@prisma/adapter-pg` with `DIRECT_URL` or `DATABASE_URL`

## Windows Prisma CLI Issue

On some Windows machines, Windows Defender may quarantine `node_modules/prisma/build/index.js` after install.

Symptoms:

- `db:validate`, `db:generate`, `db:push`, `db:migrate`, `db:seed`, or `db:studio` fail immediately
- local Prisma CLI entrypoint is missing from `node_modules/prisma/build/index.js`

Recommended fix:

1. Add a Windows Security exclusion for this project folder or for `node_modules/prisma/build/index.js`
2. Reinstall Prisma:

```bash
npm install prisma@latest --save-dev
```

3. Re-run:

```bash
npm run db:validate
npm run db:generate
```

The repo includes a wrapper script that prints a clear message when this specific quarantine issue happens.
