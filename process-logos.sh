#!/bin/bash

# Logo processing script for SmartFeed
# This script processes the uploaded logos and creates all required icon sizes

echo "🎨 Processing SmartFeed logos..."

# Check if ImageMagick is available
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Please install it or process logos manually."
    echo "   Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "   macOS: brew install imagemagick"
    echo "   Or use the manual processing guide in LOGO_PROCESSING.md"
    exit 1
fi

# Create directories if they don't exist
mkdir -p chrome-extension/icons
mkdir -p pwa/icons

echo "📱 Processing Chrome Extension icons..."

# Chrome Extension icons (square logo, remove white background)
convert logos/logo_square_with_background.png -resize 16x16 chrome-extension/icons/icon-16.png
convert logos/logo_square_with_background.png -resize 32x32 chrome-extension/icons/icon-32.png
convert logos/logo_square_with_background.png -resize 48x48 chrome-extension/icons/icon-48.png
convert logos/logo_square_with_background.png -resize 128x128 chrome-extension/icons/icon-128.png

echo "🌐 Processing PWA icons..."

# PWA icons (square logo, remove white background)
convert logos/logo_square_with_background.png -resize 16x16 pwa/icons/icon-16.png
convert logos/logo_square_with_background.png -resize 32x32 pwa/icons/icon-32.png
convert logos/logo_square_with_background.png -resize 72x72 pwa/icons/icon-72.png
convert logos/logo_square_with_background.png -resize 96x96 pwa/icons/icon-96.png
convert logos/logo_square_with_background.png -resize 128x128 pwa/icons/icon-128.png
convert logos/logo_square_with_background.png -resize 144x144 pwa/icons/icon-144.png
convert logos/logo_square_with_background.png -resize 152x152 pwa/icons/icon-152.png
convert logos/logo_square_with_background.png -resize 192x192 pwa/icons/icon-192.png
convert logos/logo_square_with_background.png -resize 384x384 pwa/icons/icon-384.png
convert logos/logo_square_with_background.png -resize 512x512 pwa/icons/icon-512.png

echo "✅ Logo processing complete!"
echo ""
echo "📋 Generated icons:"
echo "   Chrome Extension: chrome-extension/icons/ (4 sizes)"
echo "   PWA: pwa/icons/ (10 sizes)"
echo ""
echo "🔍 To verify the icons:"
echo "   ls -la chrome-extension/icons/"
echo "   ls -la pwa/icons/"