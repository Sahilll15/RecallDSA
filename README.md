# DSA Trainer

A free, open-source web application for tracking your Data Structures & Algorithms progress with spaced repetition and automated email reminders.

## Features

- **GitHub Integration**: Connect your DSA repository (e.g., synced by LeetSync)
- **Automatic Problem Parsing**: Intelligently detects platform, difficulty, and language
- **Spaced Repetition**: Smart scheduling system for optimal retention
- **Email Reminders**: Automated daily reminders for due problems
- **Code Viewer**: Beautiful syntax highlighting for all languages
- **Search & Filters**: Quickly find problems by platform, difficulty, or language
- **Webhook Support**: Auto-sync on new commits
- **100% Free**: Built on free-tier services

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase/Neon free tier)
- **ORM**: Prisma
- **Auth**: NextAuth v5 with GitHub OAuth
- **Styling**: TailwindCSS + Shadcn UI
- **Email**: Nodemailer (SMTP)
- **Hosting**: Vercel Free Tier

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud)
- GitHub OAuth App
- SMTP server access (Gmail, Outlook, etc.)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd dsa-trainer
npm install
```

### 2. Set Up Database

**Option A: Supabase (Recommended)**

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the connection string from Settings → Database

**Option B: Neon**

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

**Option C: Local PostgreSQL**

```bash
brew install postgresql
brew services start postgresql
createdb dsa_trainer
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in the values:

#### Database
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dsa_trainer
```

#### NextAuth

Generate a secret:
```bash
openssl rand -base64 32
```

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated_secret>
```

#### GitHub OAuth

1. Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
2. Application name: `DSA Trainer`
3. Homepage URL: `http://localhost:3000`
4. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and generate a Client Secret

```env
GITHUB_CLIENT_ID=<your_client_id>
GITHUB_CLIENT_SECRET=<your_client_secret>
```

#### SMTP (Email)

**Option A: Gmail**

1. Enable 2FA on your Google account
2. Generate an App Password: Google Account → Security → 2-Step Verification → App passwords
3. Use these settings:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=<app_password>
SMTP_FROM="DSA Trainer <your.email@gmail.com>"
```

**Option B: Outlook**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your.email@outlook.com
SMTP_PASS=<your_password>
SMTP_FROM="DSA Trainer <your.email@outlook.com>"
```

**Option C: Mailtrap (Testing)**

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<mailtrap_username>
SMTP_PASS=<mailtrap_password>
SMTP_FROM="DSA Trainer <test@example.com>"
```

#### App URL
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Cron Secret

Generate a random string:
```bash
openssl rand -hex 32
```

```env
CRON_SECRET=<generated_secret>
```

### 4. Set Up Prisma

```bash
npm run prisma:generate
npm run prisma:push
```

For production, use migrations:
```bash
npm run prisma:migrate
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env`
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel URL
5. Deploy

### GitHub Actions Cron Setup

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add secrets:
   - `APP_URL`: Your deployed app URL (e.g., `https://your-app.vercel.app`)
   - `CRON_SECRET`: Same value as in your `.env`

The workflow will run daily at 1 AM UTC to send email reminders.

To test manually:
- Go to Actions tab → Daily Revision Reminders → Run workflow

## Usage Guide

### 1. Connect Your Repository

1. Sign in with GitHub
2. Go to Settings
3. Select your DSA repository from the dropdown
4. Click "Connect"
5. The app will scan and import all code files

### 2. Set Up Webhook (Optional but Recommended)

1. Go to your GitHub repository
2. Settings → Webhooks → Add webhook
3. Copy values from the app's Settings page:
   - Payload URL
   - Content type: `application/json`
   - Secret
4. Select "Just the push event"
5. Click "Add webhook"

Now your problems will auto-sync on every push!

### 3. Browse Problems

- View all problems on the Problems page
- Use filters to find specific problems
- Click "View" to see the code

### 4. Add to Revision

1. Open any problem
2. Click "Add to Revision"
3. The problem will be scheduled for revision in 7 days

### 5. Revise Problems

1. Go to the Revision page
2. See problems grouped by:
   - Due Today
   - Due This Week
   - Overdue
3. Click "Review" to view the problem
4. Click "Mark as Revised" when done
   - This doubles the interval (7 → 14 → 28 days, etc.)

### 6. Email Reminders

- Automatically sent daily at 1 AM UTC
- Only sent if you have problems due
- Contains direct links to problems

## Repository Structure

The app works with any reasonable DSA repository structure. It auto-detects:

**Platform** (from path):
- `leetcode/` → LeetCode
- `gfg/` or `geeksforgeeks/` → GeeksforGeeks
- `codeforces/` → Codeforces
- `codechef/` → CodeChef

**Difficulty** (from path):
- `/easy/` → Easy
- `/medium/` → Medium
- `/hard/` → Hard

**Language** (from extension):
- `.cpp`, `.cc`, `.cxx` → C++
- `.py` → Python
- `.java` → Java
- `.js` → JavaScript
- `.ts` → TypeScript
- And more...

Example structure:
```
DSA/
├── leetcode/
│   ├── easy/
│   │   ├── two-sum.cpp
│   │   └── valid-parentheses.py
│   ├── medium/
│   │   └── longest-substring.java
│   └── hard/
│       └── median-sorted-arrays.cpp
├── gfg/
│   └── arrays/
│       └── kadanes-algorithm.cpp
└── codeforces/
    └── problem-1234A.cpp
```

## Troubleshooting

### Database Connection Error

- Check your `DATABASE_URL` is correct
- Ensure the database exists
- For cloud databases, check IP allowlist

### OAuth Error

- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Check callback URL matches: `<your-url>/api/auth/callback/github`
- Ensure `NEXTAUTH_URL` is correct

### Email Not Sending

- Verify SMTP credentials
- For Gmail, use App Password, not regular password
- Check firewall/network restrictions on port 587

### Webhook Not Working

- Verify the secret matches
- Check webhook delivery logs on GitHub
- Ensure your app is publicly accessible

### Prisma Errors

```bash
npx prisma generate
npx prisma db push
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:push` - Push schema to database (no migrations)
- `npm run prisma:studio` - Open Prisma Studio

## API Endpoints

- `POST /api/repos` - List user repositories
- `POST /api/repos/connect` - Connect a repository
- `POST /api/repos/sync` - Sync repository problems
- `POST /api/github/webhook` - GitHub webhook handler
- `GET /api/problems` - List problems with filters
- `GET /api/problems/[id]` - Get problem details
- `GET /api/revisions` - List revisions
- `POST /api/revisions` - Add problem to revision
- `POST /api/revisions/[id]/complete` - Mark as revised
- `DELETE /api/revisions/[id]` - Remove from revision
- `POST /api/cron/daily` - Send daily reminders

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Built with ❤️ for the DSA community

