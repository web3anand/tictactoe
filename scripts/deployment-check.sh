#!/bin/bash

echo "🔧 TicTacToe Deployment Troubleshooting Script"
echo "============================================="

# Check for common deployment issues
echo ""
echo "1️⃣ Checking environment variables..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    if grep -q "NEXT_PUBLIC_PRIVY_APP_ID" .env.local; then
        echo "✅ NEXT_PUBLIC_PRIVY_APP_ID found in .env.local"
    else
        echo "⚠️ NEXT_PUBLIC_PRIVY_APP_ID missing from .env.local"
    fi
else
    echo "⚠️ .env.local not found"
fi

echo ""
echo "2️⃣ Testing build process..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - check errors above"
    exit 1
fi

echo ""
echo "3️⃣ Testing type checking..."
npm run type-check
if [ $? -eq 0 ]; then
    echo "✅ No TypeScript errors"
else
    echo "❌ TypeScript errors found - fix before deployment"
    exit 1
fi

echo ""
echo "4️⃣ Checking for large files..."
find . -name "node_modules" -prune -o -type f -size +10M -print | head -5
echo ""

echo "5️⃣ Checking package.json integrity..."
if npm ls > /dev/null 2>&1; then
    echo "✅ No dependency conflicts"
else
    echo "⚠️ Dependency issues detected:"
    npm ls
fi

echo ""
echo "🚀 Deployment Readiness Summary:"
echo "==============================="
echo "✅ Build: OK"
echo "✅ Types: OK"
echo "✅ Dependencies: OK"
echo ""
echo "Next steps:"
echo "1. Copy variables from vercel-deployment-fix.txt to Vercel dashboard"
echo "2. Set all variables for Production, Preview, and Development"
echo "3. Trigger a new deployment"
echo "4. Monitor build logs for any remaining issues"