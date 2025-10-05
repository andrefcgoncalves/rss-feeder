#!/bin/bash

# Deployment script for Gemini RSS Generator
# This script handles the complete deployment process including clients

set -e

echo "🚀 Starting deployment of Gemini RSS Generator..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run: firebase login"
    exit 1
fi

# Build the project
echo "🔨 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

# Run linting
echo "🔍 Running linter..."
npm run lint

if [ $? -ne 0 ]; then
    echo "⚠️  Linting issues found. Continuing with deployment..."
fi

# Check if secrets are set
echo "🔐 Checking Firebase secrets..."

# Check GEMINI_API_KEY
if ! firebase functions:secrets:access GEMINI_API_KEY &> /dev/null; then
    echo "❌ GEMINI_API_KEY secret not found. Please set it:"
    echo "firebase functions:secrets:set GEMINI_API_KEY"
    exit 1
fi

# Check API_TOKEN
if ! firebase functions:secrets:access API_TOKEN &> /dev/null; then
    echo "❌ API_TOKEN secret not found. Please set it:"
    echo "firebase functions:secrets:set API_TOKEN"
    exit 1
fi

echo "✅ All secrets are configured"

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo ""
    echo "🖥️  Desktop Chrome Extension:"
    echo "1. Open Chrome → chrome://extensions/"
    echo "2. Enable Developer mode"
    echo "3. Load unpacked → select 'chrome-extension' folder"
    echo "4. Configure with your API endpoint and token"
    echo ""
    echo "📱 Mobile PWA:"
    echo "1. Visit your Firebase Hosting URL on mobile"
    echo "2. Install PWA (Add to Home Screen)"
    echo "3. Share content from any app → select 'RSS Share'"
    echo ""
    echo "🌐 RSS Feed:"
    echo "   https://storage.googleapis.com/YOUR-PROJECT.appspot.com/feed.xml"
    echo ""
    echo "📖 For detailed usage instructions, see README.md"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi