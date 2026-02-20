# Claw Cloud $5 Sovereignty Strategy (Updated)

You're right—since you already have databases and Railway for the main app, we will use Claw Cloud to host our high-IQ auxiliary services.

## 1. The "Split-Server" Topology
We will distribute Beacon across three performance tiers:

| Location | Tier | Spec | Purpose |
| :--- | :--- | :--- | :--- |
| **Railway** | **Main** | Stable Node.js | API, Gateway, Web Frontend. |
| **Claw Cloud** | **Free Cluster** | 0.3 vCPU / 256MB | Bot Hub, Health-Checks, or Cron Jobs. |
| **Claw Cloud** | **$5 Credit VM** | **1.0+ vCPU / 1.5GB** | **AI Moderation Engine** (Image/Video analysis). |

## 2. Why use the $5 Credit for the AI VM?
AI moderation and Video processing are CPU-heavy. 
- **The Problem**: 0.3 vCPU will crash when processing a video. 
- **The Solution**: Use the $5 credit to spin up a **Computational VM** on Claw Cloud. 
- **Billing Mastery**: Since it's billed per day, you get a powerful AI processor for about $0.16/day. If you don't need it for a week, you turn it off and save the credit.

## 3. "Zero-Data" Gateway Setup
The Claw Cloud Free instance (0.3 vCPU) is perfect for a **Low-Bandwidth SMS Bridge**. It doesn't need much RAM, just persistent connection to the SMS gateway.

## 4. Database Persistence
If you already have a database, we'll link all servers to it via `MONGO_URI` and `DATABASE_URL` environment variables. This creates a "Unified Brain" across Railway and Claw Cloud.
