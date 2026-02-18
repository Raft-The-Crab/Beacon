# Deployment notes

This project includes convenience files to deploy the backend server to Railway and ClawCloud Run.

Files added:

- `apps/server/Dockerfile` — container image build for the server
- `apps/server/Procfile` — Railway process file
- `scripts/deploy-clawcloudrun.sh` — build + deploy script for ClawCloud Run

Railway
- Use `scripts/deploy-server.ps1` to deploy to Railway (PowerShell script). Railway CLI is optional;
  the script will push to `main` if CLI is not present and Railway auto-deploys from GitHub.

ClawCloud Run
- Ensure the ClawCloud Run CLI (or compatible `gcloud`) is installed and authenticated.
- Run:

```bash
bash scripts/deploy-clawcloudrun.sh
```

Adjust `SERVICE_NAME` and `REGION` in the script as needed.

### CI / ClawCloud Run (example)

This repo includes a template workflow that invokes `scripts/deploy-clawcloudrun.sh` after building the workspace. Place it at `.github/workflows/deploy-clawcloudrun.yml`. The workflow runs on pushes to `main` and will execute the provided script — set repository secrets like `CLAW_SERVICE_NAME` and `CLAW_REGION` as needed.

### Railway

You can deploy to Railway using `scripts/deploy-server.ps1` or the Railway CLI. For CI, a sample workflow `.github/workflows/deploy-railway.yml` is included. It installs the Railway CLI and will run `railway up` when a `RAILWAY_TOKEN` secret is provided.

Notes:
- If you use Railway's GitHub integration, pushing to `main` may automatically trigger a Railway deploy — the PowerShell script supports that fallback.
- For CI-driven Railway deploys, set `RAILWAY_TOKEN` in repository secrets and the workflow will call `railway up --environment production`.

#### Recommended repository secrets / env vars

ClawCloud Run workflow expects (examples):
- `CLAW_SERVICE_NAME` — service name (e.g., `beacon-server`)
- `CLAW_REGION` — region (e.g., `us-central1`)

Cloud Run / GCP workflow expects (examples):
- `GCP_PROJECT_ID` — Google Cloud project ID
- `GCP_SA_KEY` — base64-encoded service account JSON key with Cloud Run permissions
- `IMAGE_NAME` — container image tag (e.g., `gcr.io/my-project/beacon-server:latest`)
- `CLOUD_RUN_SERVICE` — Cloud Run service name

Railway workflow expects:
- `RAILWAY_TOKEN` — Railway API token with deploy permissions

Make sure any keys are stored in GitHub repository secrets and not checked into source control.
