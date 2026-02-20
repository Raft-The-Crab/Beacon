# 🎨 BEACON ICON CONVERSION GUIDE

## 📍 Icon Location
`/assets/icon.svg` - Your unique Beacon tower icon

## 🔄 Convert to Platform Formats

### Option 1: Online Converters (Easiest)

#### For Android
1. Go to: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. Upload `/assets/icon.svg`
3. Download all sizes
4. Place in `apps/mobile/android/app/src/main/res/`

#### For Windows (.ico)
1. Go to: https://www.icoconverter.com/
2. Upload `/assets/icon.svg`
3. Select sizes: 16, 32, 48, 64, 128, 256
4. Download .ico file
5. Place in `apps/desktop/src-tauri/icons/icon.ico`

#### For macOS (.icns)
1. Go to: https://cloudconvert.com/svg-to-icns
2. Upload `/assets/icon.svg`
3. Download .icns file
4. Place in `apps/desktop/src-tauri/icons/icon.icns`

### Option 2: Using ImageMagick (Advanced)

```bash
# Install ImageMagick
# Windows: choco install imagemagick
# Mac: brew install imagemagick

# Convert to PNG sizes
magick assets/icon.svg -resize 512x512 assets/icon-512.png
magick assets/icon.svg -resize 256x256 assets/icon-256.png
magick assets/icon.svg -resize 128x128 assets/icon-128.png
magick assets/icon.svg -resize 64x64 assets/icon-64.png
magick assets/icon.svg -resize 32x32 assets/icon-32.png
magick assets/icon.svg -resize 16x16 assets/icon-16.png

# Convert to ICO
magick assets/icon-*.png apps/desktop/src-tauri/icons/icon.ico

# Convert to ICNS (macOS only)
png2icns apps/desktop/src-tauri/icons/icon.icns assets/icon-*.png
```

## 📱 Android Icon Sizes

Place in `apps/mobile/android/app/src/main/res/`:

```
mipmap-mdpi/ic_launcher.png (48x48)
mipmap-hdpi/ic_launcher.png (72x72)
mipmap-xhdpi/ic_launcher.png (96x96)
mipmap-xxhdpi/ic_launcher.png (144x144)
mipmap-xxxhdpi/ic_launcher.png (192x192)
```

## 💻 Desktop Icon Sizes

Place in `apps/desktop/src-tauri/icons/`:

```
32x32.png
128x128.png
128x128@2x.png (256x256)
icon.icns (macOS)
icon.ico (Windows)
```

## ✅ Quick Checklist

- [ ] Convert SVG to PNG (multiple sizes)
- [ ] Create .ico for Windows
- [ ] Create .icns for macOS
- [ ] Generate Android launcher icons
- [ ] Update Tauri config paths
- [ ] Update Capacitor config
- [ ] Test builds

## 🎯 Current Icon Design

Your Beacon icon features:
- Gradient background (#7289da → #949cf7)
- White Beacon tower
- Three signal wave levels
- Golden light at top
- Rounded corners (120px radius)
- 512x512 base size

## 🔗 Useful Links

- Android Asset Studio: https://romannurik.github.io/AndroidAssetStudio/
- ICO Converter: https://www.icoconverter.com/
- ICNS Converter: https://cloudconvert.com/svg-to-icns
- ImageMagick: https://imagemagick.org/

---

**Note**: The SVG icon is already created and ready. Just convert it to the formats you need!
