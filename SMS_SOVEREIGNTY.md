# Zero-Data SMS Bridge Strategy

For markets where data is expensive or unavailable, Beacon supports a "Zero-Data" SMS bridge.

## 1. The Bridge Hub
The `mobile` app can be configured to use an SMS gateway instead of WebSocket.
- **Protocol**: JSON-over-SMS (Compressed).
- **Endpoint**: A dedicated Claw Cloud VM (Free tier) running `SMSBridge.ts`.

## 2. Server Configuration
Set `SOVEREIGNTY_LEVEL=3` in your `.env` to enable extreme payload compression.

## 3. Deployment
Deploy the `SMSBridge` as a separate docker container on Claw Cloud to keep it isolated and ultra-performant.
