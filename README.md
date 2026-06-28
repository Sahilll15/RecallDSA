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

- 🔁 **Spaced-repetition engine** — schedules each problem for review at the optimal interval
- 🔗 **GitHub sync** — auto-imports the problems you solve from a connected repository (via Octokit)
- 📧 **Automated email reminders** — daily/weekly review nudges (Nodemailer)
- 🔐 **GitHub OAuth** sign-in (NextAuth)
- 📊 **Progress dashboard** — track what's due, what's mastered, and your streak
- 🌗 **Responsive UI** with light/dark themes and smooth motion

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
```

## 🤝 Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## 📝 License

Released under the [MIT License](./LICENSE).

<div align="center"><sub>Built by <a href="https://sahilchalke.com">Sahil Chalke</a></sub></div>
