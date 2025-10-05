# Logo Processing Guide for SmartFeed

## Available Logos
- `logo_square_with_background.png` - Square format with white background
- `logo_circle_with_background.png` - Round format with white background

## Required Icon Sizes

### Chrome Extension Icons
- icon-16.png (16x16)
- icon-32.png (32x32)
- icon-48.png (48x48)
- icon-128.png (128x128)

### PWA Icons
- icon-16.png (16x16)
- icon-32.png (32x32)
- icon-72.png (72x72)
- icon-96.png (96x96)
- icon-128.png (128x128)
- icon-144.png (144x144)
- icon-152.png (152x152)
- icon-192.png (192x192)
- icon-384.png (384x384)
- icon-512.png (512x512)

## Processing Steps

### Option 1: Using ImageMagick (Command Line)
```bash
# Remove white background and resize for Chrome Extension
convert logos/logo_square_with_background.png -transparent white -resize 16x16 chrome-extension/icons/icon-16.png
convert logos/logo_square_with_background.png -transparent white -resize 32x32 chrome-extension/icons/icon-32.png
convert logos/logo_square_with_background.png -transparent white -resize 48x48 chrome-extension/icons/icon-48.png
convert logos/logo_square_with_background.png -transparent white -resize 128x128 chrome-extension/icons/icon-128.png

# For PWA icons (multiple sizes)
convert logos/logo_square_with_background.png -transparent white -resize 16x16 pwa/icons/icon-16.png
convert logos/logo_square_with_background.png -transparent white -resize 32x32 pwa/icons/icon-32.png
convert logos/logo_square_with_background.png -transparent white -resize 72x72 pwa/icons/icon-72.png
convert logos/logo_square_with_background.png -transparent white -resize 96x96 pwa/icons/icon-96.png
convert logos/logo_square_with_background.png -transparent white -resize 128x128 pwa/icons/icon-128.png
convert logos/logo_square_with_background.png -transparent white -resize 144x144 pwa/icons/icon-144.png
convert logos/logo_square_with_background.png -transparent white -resize 152x152 pwa/icons/icon-152.png
convert logos/logo_square_with_background.png -transparent white -resize 192x192 pwa/icons/icon-192.png
convert logos/logo_square_with_background.png -transparent white -resize 384x384 pwa/icons/icon-384.png
convert logos/logo_square_with_background.png -transparent white -resize 512x512 pwa/icons/icon-512.png
```

### Option 2: Online Tools
1. **Remove.bg** - For background removal
2. **Favicon.io** - For generating multiple icon sizes
3. **RealFaviconGenerator.net** - For comprehensive PWA icons

### Option 3: Image Editors
1. **GIMP** (Free)
   - Open logo
   - Select -> By Color -> Click white background
   - Delete background
   - Export as PNG with transparency
   - Resize as needed

2. **Photoshop**
   - Use Magic Wand to select white background
   - Delete and save as PNG
   - Use Image -> Image Size to resize

## Automated Processing Script

I'll create a Node.js script to automate this process if you have the required dependencies.