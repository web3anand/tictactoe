#!/bin/bash
# Script to set up Vercel environment variables for TicTacToe Pro

echo "Setting up Vercel environment variables..."

# Supabase Configuration
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# App Configuration  
vercel env add NEXT_PUBLIC_ROOT_URL production
vercel env add NEXT_PUBLIC_CHAIN_ID production
vercel env add NEXT_PUBLIC_RPC_URL production

# Socket.IO Configuration
vercel env add NEXT_PUBLIC_SOCKET_URL production

echo "Environment variables setup complete!"
echo ""
echo "Please run the following commands to set the actual values:"
echo ""
echo "vercel env add NEXT_PUBLIC_SUPABASE_URL production"
echo "Value: https://njpgolqorjiilzaswtql.supabase.co"
echo ""
echo "vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production"  
echo "Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcGdvbHFvcmppaWx6YXN3dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTk1ODMsImV4cCI6MjA3NTEzNTU4M30.WQBpNQhVKct5w1kEnSNLxnrKXlE_0LdYGPfvagkg_jM"
echo ""
echo "vercel env add SUPABASE_SERVICE_ROLE_KEY production"
echo "Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcGdvbHFvcmppaWx6YXN3dHFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1OTU4MywiZXhwIjoyMDc1MTM1NTgzfQ.gke_RChT3Y0QgpBTDaKlR5usPhRGeqIzB2NudXW3O-U"