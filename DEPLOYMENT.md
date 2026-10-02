# Closetmix — Production Deployment Guide

This guide details how to deploy **Closetmix (AI Digital Wardrobe & Intelligent Stylist)** to a zero-cost or ultra-low-cost production hosting environment.

---

## 1. Architecture Overview

| Component | Local Development | Recommended Low-Cost Production Stack | Free-Tier Limits |
| :--- | :--- | :--- | :--- |
| **Frontend & API** | Next.js 15 (Node.js) | **Vercel** | Free Hobby tier (unlimited deployments, automatic global edge CDN) |
| **Database** | SQLite (`file:./dev.db`) | **Neon Serverless PostgreSQL** or **Supabase** | Free 0.5GB compute & storage, automated backups |
| **Image Storage** | Local filesystem (`public/uploads`) | **Cloudflare R2** or **Supabase Storage** | 10GB free storage, **0 egress bandwidth fees** |
| **AI Vision Engine** | Gemini 1.5/2.5 Flash | **Google AI Studio Gemini API** | Free tier (15 RPM, zero credit card required to start) |
| **Weather Forecast** | Open-Meteo API | **Open-Meteo Global API** | 100% Free for standard usage (no API key required) |

---

## 2. Step-by-Step Deployment Guide (Vercel + Neon)

### Step 1: Provision Free PostgreSQL Database (Neon or Supabase)
1. Navigate to [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com) and create a free project named `closetmix`.
2. Copy your PostgreSQL connection string, which will look like:
   ```env
   DATABASE_URL="postgresql://username:password@ep-cool-cloud-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
3. Update `prisma/schema.prisma` datasource provider if deploying to PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Push your schema to Neon:
   ```bash
   npx prisma db push
   ```

---

### Step 2: Deploy to Vercel
1. Push your repository to GitHub or GitLab:
   ```bash
   git init
   git add .
   git commit -m "feat: complete Closetmix wardrobe and styling AI application"
   git branch -M main
   git remote add origin https://github.com/prashith-shetty/closetmix.git
   git push -u origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **"Import Repository"**.
3. Select your repository and choose **Framework Preset: Next.js**.

---

### Step 3: Configure Production Environment Variables
In the Vercel project settings under **Environment Variables**, add:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` | Managed PostgreSQL connection string |
| `JWT_SECRET` | `generate-random-64-character-hex-string-for-security` | Cryptographic secret for signing session cookies |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | OpenRouter API Key (supports Gemini 2.5 Flash, Claude 3.5, GPT-4o) |
| `OPENROUTER_MODEL` | `google/gemini-2.5-flash` | Model ID to use with OpenRouter |
| `GEMINI_API_KEY` | `AIzaSyD...` | Optional: direct Google Gemini API key if not using OpenRouter |
| `NODE_ENV` | `production` | Enables production caching, HTTPS cookies, and optimized assets |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Base public URL of your deployed application |

4. Click **Deploy**. Vercel will build your application and assign a live production URL (e.g. `https://closetmix.vercel.app`).

---

## 3. Configuring a Custom Domain

1. Open your Vercel Project Dashboard $\rightarrow$ **Settings** $\rightarrow$ **Domains**.
2. Enter your custom domain (e.g., `closetmix.app` or `wardrobe.yourdomain.com`).
3. Configure DNS records with your registrar (Cloudflare, Namecheap, GoDaddy):
   * **For Root Apex Domain (`closetmix.app`)**:
     * Type: `A`
     * Name: `@`
     * Value: `76.76.21.21`
   * **For Subdomain / WWW (`www.closetmix.app`)**:
     * Type: `CNAME`
     * Name: `www`
     * Value: `cname.vercel-dns.com`
4. Vercel automatically provisions a free, auto-renewing SSL certificate (Let's Encrypt). Within 5–10 minutes, your custom domain will be fully active with HTTPS.

---

## 4. Post-Deployment Smoke Test Checklist

- [ ] Visit `https://your-domain.com/api/health` to confirm database connectivity and latency.
- [ ] Visit `/wardrobe` and click **"Load Sample Capsule"** to verify database reads/writes.
- [ ] Upload a test garment on `/wardrobe/upload` to confirm image preprocessing and background removal.
- [ ] Visit `/outfits` and test generating an outfit combination against real-time weather.
- [ ] Schedule an outfit on `/planner` and verify **"Mark as Worn"** updates wear counters.
