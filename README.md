<div align="center">

# 🧠 RecallDSA — DSA Trainer

**Stop forgetting the problems you've already solved.**
RecallDSA connects to your GitHub, auto-imports your solved Data Structures & Algorithms problems, and uses **spaced repetition** + **automated email reminders** to resurface them at the right time — so you stay interview-ready without spreadsheets or manual tracking.

[![Live Demo](https://img.shields.io/badge/Live_Demo-recall--dsa.vercel.app-111?style=for-the-badge&logo=vercel&logoColor=white)](https://recall-dsa.vercel.app)
&nbsp;
[![License: MIT](https://img.shields.io/badge/License-MIT-3178c6?style=for-the-badge)](./LICENSE)

</div>

---

## ✨ Features

- 🧠 **Recall sessions** — staged active recall: name the pattern, reconstruct the approach, then reveal your stored reasoning and solution. Nothing is shown until you have tried.
- 🔁 **True spaced repetition** — rate every recall Again / Hard / Good / Easy (SM-2 style: 1 → 3 → 7 day ladder, then ease-factor growth, reset on a lapse, 180-day cap)
- 🎯 **Pattern recognition tracking** — recognizing "binary search on answer" is a different skill from coding it; both are measured separately
- 📝 **Recall notes** — per problem: key idea, validation function, edge cases, complexity, and a progressive hint ladder revealed one nudge at a time
- ⚠️ **Mistake log** — record what tripped you up with the underlying concept; recurring concepts surface on the dashboard
- 📊 **Interview-readiness dashboard** — recall rate, pattern-recognition rate, hint-free rate, average recall time, pattern mastery, weak patterns
- 🔗 **GitHub sync** — auto-imports solved problems from a connected repository; new pushes enter the review queue automatically (webhook + manual sync), deleted files are cleaned up
- 📧 **Automated email reminders** — daily review nudges (Nodemailer + Vercel cron)
- 🔐 **GitHub OAuth** sign-in (NextAuth v5)
- 🌗 **Responsive UI** with light/dark themes

## 🛠️ Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2d3748?logo=prisma&logoColor=white)
![NextAuth](https://img.shields.io/badge/NextAuth.js-000?logo=auth0&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06b6d4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white)

**Next.js (App Router) · TypeScript · Prisma ORM · NextAuth (GitHub OAuth) · Octokit · Nodemailer · TailwindCSS · Framer Motion**

## 📸 Screenshots

> _Add a screenshot or short GIF of the dashboard here — visuals dramatically increase engagement._
<!-- ![RecallDSA dashboard](docs/dashboard.png) -->

## 🚀 Getting Started

**Prerequisites:** Node.js 18+, a database (any Prisma-supported), and a GitHub OAuth app.

```bash
# 1. Clone
git clone https://github.com/Sahilll15/RecallDSA.git
cd RecallDSA

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env
#   → set DATABASE_URL, GITHUB_ID / GITHUB_SECRET, and your SMTP credentials

# 4. Set up the database
npm run prisma:generate
npx prisma migrate dev

# 5. Run
npm run dev          # http://localhost:3000

# 6. Tests
npm test
```

> **Deploying:** the Vercel build only runs `prisma generate` — apply schema changes to the
> production database with `npx prisma migrate deploy` before (or as part of) each deploy.

## 🤝 Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## 📝 License

Released under the [MIT License](./LICENSE).

<div align="center"><sub>Built by <a href="https://sahilchalke.com">Sahil Chalke</a></sub></div>
