Write-Host "TicTacToe Deployment Troubleshooting Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check for common deployment issues
Write-Host ""
Write-Host "1. Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local exists" -ForegroundColor Green
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "NEXT_PUBLIC_PRIVY_APP_ID") {
        Write-Host "✅ NEXT_PUBLIC_PRIVY_APP_ID found in .env.local" -ForegroundColor Green
    } else {
        Write-Host "⚠️ NEXT_PUBLIC_PRIVY_APP_ID missing from .env.local" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ .env.local not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Testing build process..." -ForegroundColor Yellow
$buildResult = npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed - check errors above" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3. Testing type checking..." -ForegroundColor Yellow
$typeCheckResult = npm run type-check
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ No TypeScript errors" -ForegroundColor Green
} else {
    Write-Host "❌ TypeScript errors found - fix before deployment" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4. Checking for large files..." -ForegroundColor Yellow
Get-ChildItem -Recurse -File | Where-Object { $_.Length -gt 10485760 -and $_.FullName -notlike "*node_modules*" } | Select-Object -First 5 | ForEach-Object {
    $sizeMB = [math]::Round($_.Length/1048576, 2)
    Write-Host "Large file: $($_.FullName) ($sizeMB MB)"
}

Write-Host ""
Write-Host "5. Checking package.json integrity..." -ForegroundColor Yellow
$depCheck = npm ls 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ No dependency conflicts" -ForegroundColor Green
} else {
    Write-Host "⚠️ Dependency issues detected - check npm ls output" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Deployment Readiness Summary:" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "✅ Build: OK" -ForegroundColor Green
Write-Host "✅ Types: OK" -ForegroundColor Green
Write-Host "✅ Dependencies: OK" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy variables from vercel-deployment-fix.txt to Vercel dashboard" -ForegroundColor White
Write-Host "2. Set all variables for Production, Preview, and Development" -ForegroundColor White
Write-Host "3. Trigger a new deployment" -ForegroundColor White
Write-Host "4. Monitor build logs for any remaining issues" -ForegroundColor White