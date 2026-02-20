# Railway Production Uptime Guide (Beacon)

Railway's free/starter plans may spin down after 15 minutes of inactivity if not configured correctly. Here is the "God-Tier" setup to ensure Beacon stays 24/7 online.

## 1. Automated Health-Check Loop
To prevent idle-shutdown, we have implemented a self-ping mechanism in the `GatewayService`.

> [!TIP]
> Use a service like [Cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com) to ping your server's `/health` endpoint every 10 minutes. This is the most reliable external "Keep-Alive."

## 2. Railway Environment Variables
Ensure the following are set in your Railway Dashboard:
- `PERSISTENT_VOLUME`: `/data` (if using local storage, though we recommend Claw Cloud for DB).
- `HEALTHCHECK_PATH`: `/api/health`
- `NODE_ENV`: `production`

## 3. Disabling Auto-Sleep (Pro Tip)
If you have a Railway "Trial" account, it will *always* expire when you run out of credits ($5). Once upgraded to the "Hobby" plan ($5/mo), the server will **never** shut down unless there is a crash.

### How to Monitor
1. Go to **Railway Dashboard** -> **Metrics**.
2. Check **Memory Usage**. If it flatlines at 0, the server is sleeping.
3. Check **Deployment Logs** for `[Gateway] Server is alive` heartbeat logs.
