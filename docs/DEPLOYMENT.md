# Deployment Guide

## Local Development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Default local database:

```env
TURSO_DATABASE_URL=file:./data/russian-accelerator.db
```

That gives you persistent local progress in the workspace `data` folder.

## GitHub Push

```bash
git status
git add .
git commit -m "Implement Russian Accelerator prototype"
git push origin design/phase-1-spec-and-plan
```

If you want to ship from `master`, merge the branch after review:

```bash
git checkout master
git merge design/phase-1-spec-and-plan
git push origin master
```

## Vercel Deploy

### Preview-safe deploy

If you deploy without Turso credentials, the app will fall back to:

```env
file:/tmp/russian-accelerator.db
```

That keeps the app functional on Vercel, but persistence is temporary and should be treated as preview-only.

### Real production deploy

Use Turso/libSQL in Vercel project settings:

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

Then deploy:

```bash
vercel --prod
```

## Recommended Vercel Project Settings

- Framework preset: `Next.js`
- Build command: `npm run build`
- Install command: `npm install`
- Output directory: leave default

## Optional AI Provider Variables

Reserved for next-phase upgrades:

```env
OPENAI_API_KEY=
GOOGLE_API_KEY=
```

## Smoke Test After Deploy

1. Load the home page.
2. Complete onboarding.
3. Trigger one review grade.
4. Trigger one pronunciation attempt.
5. Trigger one dialogue turn.
6. Save a checkpoint.
7. Refresh and confirm state still exists.

If step 7 fails on Vercel, the project is still using ephemeral fallback storage rather than Turso.
