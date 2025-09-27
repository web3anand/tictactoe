#!/bin/bash

echo "🚀 Deploying TicTacToe Pro to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the project
echo "📦 Building project..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "1. Update your domain in minikit.config.ts and app/.well-known/farcaster.json"
echo "2. Go to Base Build Account association tool"
echo "3. Associate your app with your Base account"
echo "4. Update the accountAssociation credentials in minikit.config.ts"
echo "5. Test your app at base.dev/preview"
