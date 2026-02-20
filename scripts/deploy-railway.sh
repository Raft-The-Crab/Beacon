#!/bin/bash

echo "🚀 Beacon v1.0 - Railway Deployment Script"
echo "=========================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login check
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

# Create .env file for Railway
echo "📝 Creating environment configuration..."
cat > .env.railway << EOF
NODE_ENV=production
PORT=8080

# Add your database URLs here
DATABASE_URL=your_postgres_url
MONGODB_URI=your_mongodb_url
REDIS_URL=your_redis_url

JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CORS_ORIGIN=https://your-domain.com
EOF

echo "✅ Environment template created at .env.railway"
echo "⚠️  Please edit .env.railway with your actual credentials"
echo ""
read -p "Press enter when ready to continue..."

# Initialize Railway project
echo "🚂 Initializing Railway project..."
railway init

# Set environment variables
echo "🔧 Setting environment variables..."
while IFS='=' read -r key value; do
    if [[ ! $key =~ ^#.*$ ]] && [[ -n $key ]]; then
        railway variables set "$key=$value"
    fi
done < .env.railway

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app will be available at: https://your-app.railway.app"
echo "📊 View logs: railway logs"
echo "🔍 Check status: railway status"
