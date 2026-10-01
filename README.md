# VESTIQ — AI Digital Wardrobe & Intelligent Outfit Stylist

[![Next.js 15](https://img.shields.io/badge/Next.js-15_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Gemini_API-Multimodal_Vision-4285F4?logo=google)](https://aistudio.google.com/)
[![Tests](https://img.shields.io/badge/Tests-116%2F116_Passing-emerald)](tests/)

**Vestiq** transforms physical closets into a smart digital wardrobe. Powered by multimodal AI vision and fashion theory heuristics, it isolates backgrounds from clothing photos, auto-detects 8+ garment dimensions, analyzes wardrobe gaps, and curates flat-lay outfits tuned to your weather, occasion, and personal style.

---

## ✨ Key Features

* **Neural Semantic Segmentation Cutouts**: Studio-grade transparent garment cutouts powered by `@imgly/background-removal-node` with zero edge fringing or shadow smudges.
* **Menswear & Womenswear Aesthetic Engine**: Interactive styling selector calibrating silhouette drape, proportions, and tailoring (GQ architectural tailoring vs. Vogue chic fluidity).
* **Smart Garment Disambiguation**: Dedicated categorization distinguishing collarless tees from formal button-down/oxford shirts.
* **Multi-Garment Bulk Digitize**: Drag & drop or mobile camera capture for JPG, PNG, WEBP, and iPhone HEIC files.
* **Privacy-Shielded Image Pipeline**: Automatic EXIF/GPS stripping, transparent cutout segmentation, and facial likeness protection.
* **Multimodal AI Tagging**: Extracts Category, Subcategory, Primary/Secondary Colors, Pattern, Fabric Material, Silhouette Fit, Season, Formality, and Styling Tips via OpenRouter or Google Gemini.
* **Digital Wardrobe Grid**: Real-time filtering by category, T-Shirts, Shirts & Tops, season, formality, favorites, and "Unworn for 30+ Days" alerts.
* **Hybrid Outfit Engine**: Combines color harmony rules (tonal neutrals, complementary, statement accents), pattern clash prevention, and formality matrices with Gemini reasoning. Strict two-piece vs layered logic prevents phantom "layered" titles when no outerwear is present.
* **Live Weather Integration**: Free Open-Meteo integration calibrated to local temperature and precipitation.
* **Interactive Studio Canvas**: Flat-lay collage with match confidence ratings, item locking, piece swapping, and one-click regeneration.
* **Weekly Outfit Planner**: 7-day schedule strip with drag-and-drop planning and wear tracking.
* **Wardrobe Gap Analysis**: Uncovers ratio bottlenecks (e.g. 7 tops vs. 1 bottom) and identifies high-leverage staple additions.
* **Travel Capsule Mode**: Optimizes an 8-piece interchangeable packing list for 3 to 7-day trips.
* **Shareable Editorial Cards**: Export flat-lay cards as high-resolution PNGs with customizable watermark controls.
* **Frictionless Guest Mode & Privacy Vault**: Zero-barrier exploration with seamless account upgrade and one-click GDPR data purge.

---

## 🚀 One-Command Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/vestiq.git
cd vestiq
npm install
```

### 2. Configure Environment Variables
Copy the template environment file:
```bash
cp .env.example .env
```
Add your `OPENROUTER_API_KEY` (supports Gemini 2.5 Flash, Claude 3.5, GPT-4o) or `GEMINI_API_KEY` from Google AI Studio. *(If left blank, the built-in intelligent fallback classifier runs automatically!)*

### 3. Initialize Database
```bash
npx prisma db push
```

### 4. Start Local Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Automated Testing Suite

Vestiq includes a full 32-test end-to-end integration suite and phase verification test suites:

```bash
# Run End-to-End Comprehensive Audit Suite (32/32 tests: Auth, Wardrobe, AI, Outfits, Planner, Insights, UI)
npm run test:e2e

# Run complete test suite (Unit, Security, and 30-Garment Stress Test)
npx tsx tests/phase7-runner.ts

# Run individual test suites:
npx tsx tests/phase1-verify.ts       # Database & Auth lifecycle
npx tsx tests/phase2-verify.ts       # Image cutouts & AI tagging
npx tsx tests/phase3-verify.ts       # Wardrobe queries & filters
npx tsx tests/phase4-verify.ts       # Outfit engine & weather logic
npx tsx tests/phase5-verify.ts       # Taste learner & calendar planner
npx tsx tests/phase6-verify.ts       # Accessibility (WCAG AA) & Mobile UI
```

---

## 📋 Pre-Launch Checklist

- [x] **Database & ORM**: Prisma models synced with cascade deletion on user data.
- [x] **Authentication & Privacy**: Guest sessions, credential authentication, and GDPR data purge.
- [x] **Image Preprocessing**: EXIF stripping, WebP compression, and transparent alpha cutouts.
- [x] **Fashion Rules Engine**: Color harmony, pattern mixing, and formality distance matrix.
- [x] **Weather Sync**: Open-Meteo live forecast and temperature thresholds.
- [x] **Outfit Canvas**: Flat-lay collage, lock, swap, regenerate, and save actions.
- [x] **Calendar Planner**: 7-day schedule with wear logging.
- [x] **Gap Analysis**: Ratio deficit detection and 5-day travel capsule optimizer.
- [x] **Accessibility**: WCAG AA focus rings, 40px+ touch targets, and high-contrast dark theme.
- [x] **Production Build**: Zero TypeScript or compilation errors (`npm run build`).

---

## 🛡️ License & Privacy
Proprietary design and architecture. All user wardrobe assets are privately isolated and never commercialized.
