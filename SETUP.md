# Video2MP3 Electron App - Setup Guide

## Quick Start (Development)

### 1. Install Node.js
Download and install from: https://nodejs.org (LTS version recommended)

### 2. Install Dependencies
Open terminal in this folder and run:
```bash
npm install
```

### 3. Download Required Binaries
Place these files in the `bin/` folder:

**yt-dlp.exe**
- Download from: https://github.com/yt-dlp/yt-dlp/releases
- Get `yt-dlp.exe` and put it in `bin/`

**ffmpeg.exe**
- Download from: https://ffmpeg.org/download.html (or https://www.gyan.dev/ffmpeg/builds/)
- Get `ffmpeg.exe` from the bin folder and put it in `bin/`

Your folder structure should look like:
```
electron-app/
├── bin/
│   ├── yt-dlp.exe
│   └── ffmpeg.exe
├── assets/
│   └── icon.svg
├── main.js
├── preload.js
├── renderer.js
├── index.html
├── styles.css
└── package.json
```

### 4. Run the App
```bash
npm start
```

## Building for Distribution

### Build Portable EXE
```bash
npm run build
```
This creates `dist/Video2MP3-Portable.exe` - a single file users can run without installation.

### Build Installer
```bash
npm run build:installer
```
This creates an NSIS installer in `dist/`

## Features

- **Download Tab**: Paste any video URL and convert to MP3
- **History Tab**: View all past downloads, play files, open folder
- **Settings Tab**: Change output folder, audio quality, tray behavior
- **System Tray**: Minimizes to tray, keeps running in background
- **1000+ Sites**: Supports YouTube, Vimeo, TikTok, Twitter, Instagram, and more

## Notes

- First run may take a moment while Electron initializes
- Downloads are saved to `C:\Users\[YourName]\Downloads\Video2MP3` by default
- The app runs in the system tray when closed (can be disabled in settings)
