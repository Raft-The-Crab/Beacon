# Deploying Beacon

Beacon is designed to be deployed as a unified Node.js monolith across Azure App Services (for core APIs) and Railway (for WebSockets). 

## 1. Prerequisites
- A Node.js environment (v20+ recommended).
- The 5 databases set up and their connection strings ready:
  - `DATABASE_URL` (PostgreSQL / Supabase)
  - `MONGO_URI` (MongoDB Atlas)
  - `REDIS_URL` (ClawCloud Managed Redis)
  - `CLOUDINARY_*` keys

## 2. Deploying to Azure App Services (Main API)
Azure App Services is perfect for hosting the main Express REST API (utilizing our $99.05 credits on the B1S tier: 1 vCPU, 1GB RAM).

1. Ensure you have the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed and are logged in.
2. Navigate to `apps/server` and ensure your `package.json` uses the `start:api` script. Azure runs `npm start` by default, so you should temporarily alias `"start"` to `"npm run start:api"` in production.
3. Create an Azure App Service plan (Linux, Node 20, **B1S Tier**).
4. Configure the Environment Variables in the Azure Portal to match `.env.production`.
5. Deploy using the Azure CLI or VS Code Azure extension.
   ```bash
   az webapp up --sku B1 --name beacon-api --runtime "NODE:20LTS"
   ```

## 3. Deploying to Railway (WebSocket Gateway)
Railway sits in front of the real-time websocket connections to leverage their edge network. 

1. Install the [Railway CLI](https://docs.railway.app/guides/cli).
2. Login with `railway login`.
3. Navigate to `apps/server`.
4. Run `railway init` and link your project.
5. In the Railway Dashboard, add all the environment variables from `.env.production`.
6. Go to Settings > Service > Start Command and set it to: `npm run start:ws`
7. Run `railway up` to deploy.

## 4. Deploying to Render (Background Workers)
Render handles our high-memory AI and Media tasks reliably.

1. Create a new "Web Service" on [Render](https://render.com).
2. Connect your GitHub repository.
3. Set the Root Directory to `apps/server` (or leave as root and use a build script).
4. For the **Start Command**, use: `npm run start:render`
5. Add all the environment variables from `.env.production`.
6. Use the **Free Tier** (or Starter) to get a permanent `https://*.onrender.com` URL.

## Continuous Integration (GitHub Actions)
You can configure GitHub Actions to automatically deploy to Azure and Railway on pushes to the `main` branch. 
- For Azure, use the `azure/webapps-deploy` action.
- For Railway, ensure the `RAILWAY_TOKEN` secret is set and use a script that runs `railway up --ci`.
