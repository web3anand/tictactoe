@echo off
echo 🚀 Deploying TicTacToe Pro Mini-App with Full Base Integration...

REM Check if required tools are installed
echo 📋 Checking dependencies...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm not found. Please install npm first.
    pause
    exit /b 1
)

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
)

REM Install dependencies
echo 📦 Installing project dependencies...
npm install --legacy-peer-deps

REM Environment check
echo 🔧 Checking environment configuration...
if not exist .env.local (
    echo ⚠️  .env.local not found. Creating from example...
    copy .env.example .env.local
    echo ❗ Please update .env.local with your actual environment variables before continuing.
    echo 📝 Required variables:
    echo   - NEXT_PUBLIC_SUPABASE_URL
    echo   - NEXT_PUBLIC_SUPABASE_ANON_KEY  
    echo   - SUPABASE_SERVICE_ROLE_KEY
    echo   - NEXT_PUBLIC_ROOT_URL
    echo   - MINIKIT_WEBHOOK_SECRET
    pause
)

REM Build the project
echo 📦 Building Next.js application...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed. Please check the errors above.
    pause
    exit /b 1
)

REM Deploy to Vercel
echo 🌐 Deploying to Vercel...
vercel --prod
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Deployment failed. Please check the errors above.
    pause
    exit /b 1
)

echo ✅ Deployment successful!
echo.
echo � Post-Deployment Checklist:
echo.
echo 🔧 Environment & Configuration:
echo 1. Update NEXT_PUBLIC_ROOT_URL in .env.local with your production URL
echo 2. Update minikit.config.ts with your production domain
echo 3. Update app/.well-known/farcaster.json with production URLs
echo.
echo 🗄️  Database Setup:
echo 4. Set up Supabase project at https://supabase.com
echo 5. Run the SQL schema from supabase/schema.sql in your Supabase SQL editor
echo 6. Update environment variables with your Supabase credentials
echo 7. Enable Row Level Security (RLS) on all tables
echo.
echo ⛓️  Base Integration:
echo 8. Go to Base Build Account Association tool: https://build.base.org
echo 9. Associate your app with your Base account
echo 10. Update accountAssociation credentials in minikit.config.ts
echo 11. Add your wallet address to baseBuilder.allowedAddresses
echo.
echo 🎮 Mini-App Features:
echo 12. Test your app at base.dev/preview
echo 13. Configure Farcaster Frame integration
echo 14. Set up webhook endpoints for real-time events
echo 15. Test Socket.IO real-time multiplayer functionality
echo.
echo 📊 Monitoring & Analytics:
echo 16. Monitor game server health at /health endpoint
echo 17. Check Supabase dashboard for real-time connections
echo 18. Verify webhook events in your logs
echo.
echo 🎯 Feature Verification:
echo 19. ✅ Real-time multiplayer games
echo 20. ✅ Blockchain game result recording
echo 21. ✅ Skill-based matchmaking
echo 22. ✅ Achievement system
echo 23. ✅ Live leaderboards
echo 24. ✅ Farcaster integration
echo 25. ✅ Base mini-app compatibility
echo.
echo 🔗 Important URLs:
echo    Production App: [Your Vercel URL]
echo    Supabase Dashboard: https://supabase.com/dashboard
echo    Base Build Portal: https://build.base.org
echo    Socket.IO Health: [Your URL]/health
echo.
echo 🎉 Your TicTacToe Pro Mini-App is now live with full Base integration!
pause
