# Vestiq — Backup & Disaster Recovery Runbook

This document details the automated backup procedures, retention schedules, and step-by-step restoration protocols for **Vestiq**.

---

## 1. Backup Strategy & Retention Schedules

### A. Database (PostgreSQL / SQLite)
* **Automated Daily Backups**: Neon and Supabase perform automated continuous WAL (Write-Ahead Logging) and daily snapshot retention for 7 to 30 days.
* **Manual Local Backup Routine (CLI)**:
  Run the automated dump script before major schema migrations:
  ```bash
  # For PostgreSQL:
  pg_dump -U username -h hostname -d vestiq_db -F c -b -v -f ./backups/vestiq_backup_$(date +%Y%m%d).dump

  # For SQLite:
  cp prisma/dev.db ./backups/dev_backup_$(date +%Y%m%d).db
  ```

### B. Clothing Image Assets (Object Storage)
* **Storage Replication**: If using Cloudflare R2 or AWS S3, enable bucket versioning and Cross-Region Replication (CRR).
* **Sync Script**:
  ```bash
  aws s3 sync s3://vestiq-production-vault s3://vestiq-backup-vault-secondary --delete
  ```

---

## 2. Disaster Recovery Protocol (Step-by-Step)

If database corruption or accidental deletion occurs:

1. **Step 1: Put Application in Maintenance Mode**:
   Set `MAINTENANCE_MODE=true` in Vercel environment variables to pause traffic while restoring.
2. **Step 2: Point-in-Time Database Restore**:
   * On Neon: Go to **Project Settings** $\rightarrow$ **Branches** $\rightarrow$ **Restore to Point in Time** (select timestamp immediately prior to corruption).
   * Or restore manual dump:
     ```bash
     pg_restore -U username -h hostname -d vestiq_db -v -c ./backups/vestiq_backup_target.dump
     ```
3. **Step 3: Verify Integrity with Prisma**:
   ```bash
   npx prisma db pull
   npx tsx tests/phase1-verify.ts
   ```
4. **Step 4: Deactivate Maintenance Mode**:
   Redeploy and verify `/api/health` status returns `200 OK`.
