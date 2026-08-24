# 🚀 Repo Analyzer

Repo Analyzer is a full-stack application that performs deep analysis of public GitHub repositories. It assesses repository health, identifies structural patterns, visualizes commit history, highlights top contributors, and leverages **Agentic AI (Groq)** to generate architecture summaries and contribution guides.

## ✨ Features

- **Repository Health Check**: Aggregates stars, forks, issues, and computes a dynamic health score.
- **AI-Powered Insights**: Uses Groq's high-performance AI models to summarize the project's architecture and provide actionable contribution suggestions.
- **Contributor Analytics**: Identifies top contributors and calculates their share of the workload.
- **Activity Heatmap**: Visualizes commit activity over time to highlight peak development periods.
- **Language & Dependency Breakdown**: Analyzes the codebase to display primary languages and core dependencies.
- **Asynchronous Processing**: Built with **BullMQ & Redis** to handle large repositories smoothly in the background via a queue.
- **Real-time Updates**: Streams progress updates to the frontend using WebSockets.

---

## 🏗️ Architecture Stack

- **Backend**: [NestJS](https://nestjs.com/) (Node.js framework)
- **Frontend**: [Next.js 14](https://nextjs.org/) (React, Server & Client Components)
- **Database**: PostgreSQL (managed via [Prisma ORM](https://www.prisma.io/))
- **Queue & Cache**: [Redis](https://redis.io/) + [BullMQ](https://docs.bullmq.io/)
- **AI Integration**: [Groq Cloud API](https://groq.com/) for blazing fast LLM inference.
- **Authentication**: GitHub OAuth via Passport.js

---

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v18+)
2. **Redis**: Running locally on port `6379` (can be run via Docker: `docker run -p 6379:6379 -d redis`)
3. **PostgreSQL**: Running locally or via a cloud provider (e.g. Neon, Supabase).
4. **GitHub OAuth App**: Create one in your GitHub Developer Settings.
   - **Callback URL**: `http://localhost:3000/auth/github/callback`
5. **Groq API Key**: Create an account on GroqCloud and get an API key.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/repoAnalyser.git
   cd repoAnalyser
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory based on `.env.example` (or populate it as follows):
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/repoanalyser

   # Groq AI
   GROQ_API_KEY=your_groq_api_key_here

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Backend Port
   PORT=3000

   # Auth — JWT
   JWT_SECRET=your_super_secret_jwt_key

   # GitHub OAuth
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

4. **Database Setup:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

### Running the App

You can run both the NestJS backend and the Next.js frontend concurrently from the root directory using:

```bash
npm run dev
```

- **Frontend**: `http://localhost:3001`
- **Backend API**: `http://localhost:3000`

---

## 🔧 Core Workflows

### 1. The Analysis Queue
When a user submits a repository, the backend queues a job in BullMQ. A background worker picks it up and processes it through multiple steps (fetching metadata, structure, commits, contributors, etc.). Progress is emitted in real-time via WebSockets so the frontend can display a progress bar.

### 2. AI Insights Generation
Once raw signals (directory structure, language breakdown, dependencies, `CONTRIBUTING.md` presence, open issues) are collected, they are passed as context to a Groq LLM (e.g., `groq/compound`). The AI generates:
- An **Architecture Summary** detailing the design patterns.
- **Contribution Suggestions** outlining the easiest ways to start contributing based on actual repository data.

---

## 🛡️ License

This project is licensed under the MIT License.
