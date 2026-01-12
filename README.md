# Video2MP3

<p align="center">
  <img src="icon.png" alt="Video2MP3 Logo" width="128" height="128">
</p>

<p align="center">
  <strong>A sleek, standalone desktop application to download videos and convert them to MP3 or MP4</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows-blue?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/Electron-28.3.3-47848F?style=flat-square&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/Version-1.0.0-orange?style=flat-square" alt="Version">
</p>

---

## Preview

<p align="center">
  <img src="preview.gif" alt="Video2MP3 Application Preview" width="800">
</p>

---


## Download

<p align="center">
  <a href="https://github.com/ZxPwdz/Video2MP3/releases/latest/download/Video2MP3-Portable.zip">
    <img src="https://img.shields.io/badge/%E2%AC%87%EF%B8%8F_DOWNLOAD-Video2MP3_v1.0.0-00f0ff?style=for-the-badge&labelColor=0a0a0f" alt="Download">
  </a>
</p>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=18&duration=2000&pause=1000&color=00F0FF&center=true&vCenter=true&width=435&lines=%F0%9F%9A%80+Click+above+to+download!;%E2%9C%A8+No+installation+required!;%F0%9F%8E%B5+Convert+videos+to+MP3%2FMP4!" alt="Typing SVG">
</p>

<p align="center">
  <a href="https://github.com/ZxPwdz/Video2MP3/releases">All Releases</a>
  &nbsp;•&nbsp;
  <b>Windows 10/11</b>
  &nbsp;•&nbsp;
  <b>188 MB</b>
</p>

---
## Features

- **Multi-Platform Support** - Download from YouTube, TikTok, Vimeo, Twitter/X, Instagram, Facebook, Twitch, SoundCloud, and 1000+ more sites
- **Format Selection** - Choose between MP3 (audio) or MP4 (video) with a simple toggle
- **Quality Options** - Select audio bitrate (128/192/256/320 kbps) or video quality (480p/720p/1080p/Best)
- **Download History** - Track all your downloads with platform tags and status indicators
- **Modern Cyberpunk UI** - Sleek dark theme with cyan and magenta accents
- **Portable Application** - No installation required, just run the executable
- **No Dependencies** - Bundled with yt-dlp and ffmpeg, no external software needed
- **System Tray Support** - Minimize to tray for background operation
- **Video Splash Screen** - Custom intro video on startup (can be disabled in settings)
- **Real-time Progress** - Visual progress bars for downloading and converting

---





---

## Usage

1. **Launch** the application (Video2MP3-Portable.exe)
2. **Paste** a video URL from any supported platform
3. **Select** your preferred format (MP3 or MP4)
4. **Click** Download and watch the progress
5. **Find** your files in the Downloads/Video2MP3 folder (or customize in Settings)

---

## Supported Platforms

| Platform | Status |
|----------|--------|
| YouTube | Supported |
| TikTok | Supported |
| Vimeo | Supported |
| Twitter/X | Supported |
| Instagram | Supported |
| Facebook | Supported |
| Twitch | Supported |
| SoundCloud | Supported |
| Dailymotion | Supported |
| Reddit | Supported |
| Bilibili | Supported |
| And 1000+ more... | Supported |

---

## Settings

- **Output Directory** - Choose where to save downloaded files
- **Download Format** - Default format (MP3/MP4)
- **Audio Quality** - 128, 192, 256, or 320 kbps
- **Video Quality** - 480p, 720p, 1080p, or Best available
- **Minimize to Tray** - Keep running in system tray when closed
- **Show Intro Video** - Toggle the splash screen video on startup

---

## Building from Source

### Prerequisites

- Node.js 18+
- npm or yarn

### Steps

```bash
# Clone the repository
git clone https://github.com/ZxPwdz/Video2MP3.git
cd Video2MP3

# Install dependencies
npm install

# Run in development mode
npm start

# Build portable executable
npm run build
```

### Bundled Binaries

The `bin/` folder should contain:
- `yt-dlp.exe` - Video downloader
- `ffmpeg.exe` - Audio/video converter

Download these from their official sources:
- [yt-dlp](https://github.com/yt-dlp/yt-dlp/releases)
- [ffmpeg](https://ffmpeg.org/download.html)

---

## Tech Stack

- **Electron** - Cross-platform desktop framework
- **yt-dlp** - Video downloading engine
- **ffmpeg** - Audio/video conversion
- **electron-store** - Persistent settings storage
- **electron-builder** - Application packaging

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Credits

**Developed by [ZxPwd](https://github.com/ZxPwdz)**

---

## Disclaimer

This tool is intended for downloading videos that you have the right to download. Please respect copyright laws and the terms of service of the platforms you use. The developers are not responsible for any misuse of this software.
