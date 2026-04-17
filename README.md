# Feedback Hub

Internal feedback tool for Indegene (~20 users). Submit questions, suggestions, and requests to the CTO during a product testing phase.

## Tech Stack

- Next.js 14 (App Router), TypeScript (strict mode)
- Tailwind CSS, Inter font
- Supabase (Auth + PostgreSQL + Realtime + Storage)
- @supabase/ssr for Next.js App Router auth
- Tiptap rich text editor
- isomorphic-dompurify for server/client HTML sanitization
- exceljs for Excel export
- date-fns, sonner, lucide-react

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=random-32-char-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production (Vercel), set `NEXT_PUBLIC_APP_URL` to your deployed URL (e.g., `https://feedback-hub-indegene.vercel.app`).

## Supabase Setup

1. Create a new Supabase project
2. Go to SQL Editor and run the full schema from `schema.txt`
3. Go to Storage and create a private bucket named `backups` with a 50MB file size limit
4. Go to Authentication > URL Configuration and add your app URL to the Redirect URLs list (both localhost for dev and your Vercel URL for production)

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment to Vercel

1. Push this repo to GitHub
2. Import the repo in Vercel
3. Set all environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
4. Deploy — cron jobs are auto-configured via `vercel.json`

## Features

- Magic-link login (restricted to @indegene.com)
- Submit feedback as Question, Suggestion, or Request
- Rich text editor (bold, italic, lists, links)
- Live updates via Supabase Realtime
- Upvote/un-upvote comments (one per user, optimistic UI)
- Edit own comments (atomic archive + update via RPC)
- Soft-delete own comments (never loses data)
- Sort by newest / most upvoted
- Filter by comment type
- Export to formatted .xlsx
- Daily automated backup to Supabase Storage
- Daily keepalive ping to prevent free-tier pausing

## Security

- @indegene.com domain enforced at: client UI, auth callback (server-side), and RLS policies
- HTML sanitized server-side with DOMPurify on every INSERT/UPDATE
- Allowed tags: p, br, strong, em, ul, ol, li, a (href only)
- All anchor tags forced to rel="noopener noreferrer" target="_blank"
- RLS on all tables — users can only modify their own data
- No hard DELETE on comments — soft-delete only
- Service role key only used by cron routes, never exposed to client
- Cron routes protected by CRON_SECRET bearer token

## Testing Checklist

Run these manually before sharing with the team:

- [ ] Sign in with an @indegene.com email — magic link received, callback redirects to main page
- [ ] Sign in with a non-@indegene.com email — rejected before magic link is sent
- [ ] If someone crafts an auth callback with a non-indegene email, they're signed out and shown an error
- [ ] Submit a comment — it appears in the list immediately
- [ ] Upvote toggles correctly — count updates optimistically
- [ ] Edit own comment — edit_count increments, old version is in comment_edits table
- [ ] Edit someone else's comment via direct API call — rejected by RLS
- [ ] Delete own comment — hides from list, row still exists in DB with deleted_at set
- [ ] Export downloads a properly formatted .xlsx
- [ ] Paste `<script>alert(1)</script>` in a comment — script tag is stripped, alert never fires
- [ ] Invoke `/api/cron/backup` with correct CRON_SECRET — backup appears in Storage
- [ ] Invoke `/api/cron/keepalive` with correct CRON_SECRET — returns success

### Manual cron test commands

```bash
# Backup
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/backup

# Keepalive
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/keepalive
```

## Project Structure

```
app/
  layout.tsx              Root layout (Inter font, Toaster)
  page.tsx                Main page (auth-gated, CommentList)
  globals.css             Tailwind + Tiptap/comment styles
  login/page.tsx          Magic-link sign-in form
  auth/callback/route.ts  Auth callback with domain validation
  api/
    comments/route.ts     GET (list) + POST (create)
    comments/[id]/route.ts PATCH (edit via RPC) + DELETE (soft-delete)
    upvotes/route.ts      POST (toggle)
    export/route.ts       GET (.xlsx download)
    cron/backup/route.ts  Daily backup to Storage
    cron/keepalive/route.ts Daily DB ping
components/
  CommentList.tsx         Main list with realtime + polling
  CommentCard.tsx         Individual comment card
  CommentForm.tsx         Submit form with Tiptap
  RichTextEditor.tsx      Tiptap wrapper
  FilterBar.tsx           Sort + type filter chips
  EditModal.tsx           Edit comment modal
  ExportButton.tsx        Excel export trigger
  UpvoteButton.tsx        Upvote toggle button
  SignOutButton.tsx       Sign-out button
lib/
  supabase/client.ts      Browser Supabase client
  supabase/server.ts      Server Supabase client (cookie-based)
  supabase/admin.ts       Service-role client (cron only)
  sanitize.ts             DOMPurify config
  excel.ts                Excel workbook builders
  validators.ts           Email + comment type validators
middleware.ts             Session refresh middleware
vercel.json               Cron schedule config
```
