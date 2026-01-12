const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const Store = require('electron-store');

// Initialize store for history
const store = new Store({
  defaults: {
    downloads: [],
    settings: {
      outputDir: path.join(app.getPath('downloads'), 'Video2MP3'),
      downloadFormat: 'mp3',
      audioQuality: '192',
      videoQuality: 'best',
      showSplash: true,
      minimizeToTray: true
    }
  }
});

let mainWindow;
let splashWindow;
let tray;
let activeDownloads = new Map();

// Get the icon path
function getIconPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'icon.png');
  }
  return path.join(__dirname, 'icon.png');
}

// Get paths for bundled binaries
function getBinPath(name) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'bin', name);
  }
  return path.join(__dirname, 'bin', name);
}

const ytdlpPath = getBinPath(process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
const ffmpegPath = getBinPath(process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

// Ensure output directory exists
function ensureOutputDir() {
  const outputDir = store.get('settings.outputDir');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

// Create splash screen
function createSplashWindow(showVideo = true) {
  const iconPath = getIconPath();
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
  } catch (e) {
    icon = undefined;
  }

  // Video splash is 8 seconds, so make window bigger for video
  const splashWidth = showVideo ? 640 : 400;
  const splashHeight = showVideo ? 360 : 300;

  splashWindow = new BrowserWindow({
    width: splashWidth,
    height: splashHeight,
    frame: false,
    transparent: !showVideo,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    icon: icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (showVideo) {
    splashWindow.loadFile('splash.html');
  } else {
    splashWindow.loadFile('splash-simple.html');
  }
  splashWindow.center();
}

function createWindow() {
  const iconPath = getIconPath();
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
  } catch (e) {
    icon = undefined;
  }

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0f',
    show: false, // Don't show until ready
    icon: icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  // Show main window when ready, close splash
  mainWindow.once('ready-to-show', () => {
    const showVideo = store.get('settings.showSplash') !== false;
    const splashDuration = showVideo ? 8000 : 1500; // 8 seconds for video, 1.5 for simple

    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
    }, splashDuration);
  });

  mainWindow.on('close', (event) => {
    if (store.get('settings.minimizeToTray') && !app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = getIconPath();
  let trayIcon;

  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      // Create a simple colored icon as fallback
      trayIcon = nativeImage.createFromBuffer(Buffer.alloc(256));
    } else {
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
    }
  } catch (e) {
    trayIcon = nativeImage.createFromBuffer(Buffer.alloc(256));
  }

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow.show() },
    { label: 'Open Downloads', click: () => shell.openPath(ensureOutputDir()) },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);

  tray.setToolTip('Video2MP3');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow.show());
}

app.whenReady().then(() => {
  const showVideo = store.get('settings.showSplash') !== false;
  createSplashWindow(showVideo);
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('window-minimize', () => mainWindow.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});
ipcMain.handle('window-close', () => mainWindow.close());

ipcMain.handle('get-downloads', () => store.get('downloads'));
ipcMain.handle('get-settings', () => store.get('settings'));
ipcMain.handle('save-settings', (event, settings) => {
  store.set('settings', settings);
  ensureOutputDir();
});

ipcMain.handle('open-downloads-folder', () => {
  shell.openPath(ensureOutputDir());
});

ipcMain.handle('open-file', (event, filePath) => {
  shell.openPath(filePath);
});

ipcMain.handle('show-in-folder', (event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('delete-download', (event, id) => {
  const downloads = store.get('downloads');
  const download = downloads.find(d => d.id === id);

  if (download && download.filePath && fs.existsSync(download.filePath)) {
    try {
      fs.unlinkSync(download.filePath);
    } catch (e) {
      console.error('Failed to delete file:', e);
    }
  }

  store.set('downloads', downloads.filter(d => d.id !== id));
  return store.get('downloads');
});

ipcMain.handle('clear-history', () => {
  store.set('downloads', []);
  return [];
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-video-info', async (event, url) => {
  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--no-playlist',
      url
    ];

    execFile(ytdlpPath, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(error.message || 'Failed to get video info');
        return;
      }
      try {
        const info = JSON.parse(stdout);
        resolve({
          id: info.id,
          title: info.title,
          thumbnail: info.thumbnail,
          duration: info.duration,
          channel: info.uploader || info.channel,
          url: url
        });
      } catch (e) {
        reject('Failed to parse video info');
      }
    });
  });
});

// Detect source platform from URL
function detectPlatform(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'YouTube';
  if (urlLower.includes('tiktok.com')) return 'TikTok';
  if (urlLower.includes('vimeo.com')) return 'Vimeo';
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'Twitter';
  if (urlLower.includes('instagram.com')) return 'Instagram';
  if (urlLower.includes('facebook.com') || urlLower.includes('fb.watch')) return 'Facebook';
  if (urlLower.includes('twitch.tv')) return 'Twitch';
  if (urlLower.includes('dailymotion.com')) return 'Dailymotion';
  if (urlLower.includes('soundcloud.com')) return 'SoundCloud';
  if (urlLower.includes('spotify.com')) return 'Spotify';
  if (urlLower.includes('reddit.com')) return 'Reddit';
  if (urlLower.includes('bilibili.com')) return 'Bilibili';
  return 'Other';
}

ipcMain.handle('start-download', async (event, { url, title, thumbnail }) => {
  const downloadId = Date.now().toString();
  const outputDir = ensureOutputDir();
  const safeTitle = (title || 'audio').replace(/[<>:"/\\|?*]/g, '').substring(0, 100);
  const downloadFormat = store.get('settings.downloadFormat') || 'mp3';
  const fileExt = downloadFormat === 'mp3' ? 'mp3' : 'mp4';
  const outputPath = path.join(outputDir, `${safeTitle}.${fileExt}`);
  const platform = detectPlatform(url);

  const download = {
    id: downloadId,
    url,
    title: title || 'Unknown',
    thumbnail,
    platform,
    format: downloadFormat,
    status: 'downloading',
    progress: 0,
    filePath: null,
    createdAt: new Date().toISOString(),
    error: null
  };

  activeDownloads.set(downloadId, download);

  // Add to history
  const downloads = store.get('downloads');
  downloads.unshift(download);
  store.set('downloads', downloads);

  // Build yt-dlp arguments based on format
  const args = ['--ffmpeg-location', path.dirname(ffmpegPath)];

  if (downloadFormat === 'mp3') {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', store.get('settings.audioQuality') || '192');
  } else {
    // Video format
    const videoQuality = store.get('settings.videoQuality') || 'best';
    if (videoQuality === 'best') {
      args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
    } else {
      args.push('-f', `bestvideo[height<=${videoQuality}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${videoQuality}][ext=mp4]/best`);
    }
    args.push('--merge-output-format', 'mp4');
  }

  args.push(
    '-o', outputPath.replace(`.${fileExt}`, '.%(ext)s'),
    '--no-playlist',
    '--newline',
    '--progress',
    url
  );

  const ytProcess = spawn(ytdlpPath, args);
  let isConverting = false;

  ytProcess.stdout.on('data', (data) => {
    const output = data.toString();

    // Check if converting (ffmpeg stage)
    if (output.includes('[ExtractAudio]') || output.includes('Deleting original')) {
      if (!isConverting) {
        isConverting = true;
        download.status = 'converting';
        download.progress = 100;

        // Update store
        const downloads = store.get('downloads');
        const idx = downloads.findIndex(d => d.id === downloadId);
        if (idx !== -1) {
          downloads[idx].status = 'converting';
          downloads[idx].progress = 100;
          store.set('downloads', downloads);
        }

        // Send to renderer
        mainWindow.webContents.send('download-progress', {
          id: downloadId,
          progress: 100,
          status: 'converting'
        });
      }
      return;
    }

    // Parse download progress
    const progressMatch = output.match(/(\d+\.?\d*)%/);
    if (progressMatch && !isConverting) {
      const progress = parseFloat(progressMatch[1]);
      download.progress = progress;
      download.status = 'downloading';

      // Update store
      const downloads = store.get('downloads');
      const idx = downloads.findIndex(d => d.id === downloadId);
      if (idx !== -1) {
        downloads[idx].progress = progress;
        downloads[idx].status = 'downloading';
        store.set('downloads', downloads);
      }

      // Send to renderer
      mainWindow.webContents.send('download-progress', {
        id: downloadId,
        progress,
        status: 'downloading'
      });
    }

    // Check for destination file
    const destMatch = output.match(/Destination: (.+)/);
    if (destMatch) {
      download.filePath = destMatch[1].trim();
    }
  });

  ytProcess.stderr.on('data', (data) => {
    console.error('yt-dlp stderr:', data.toString());
  });

  ytProcess.on('close', (code) => {
    const downloads = store.get('downloads');
    const idx = downloads.findIndex(d => d.id === downloadId);

    if (code === 0) {
      // Find the output file
      if (fs.existsSync(outputPath)) {
        download.filePath = outputPath;
      } else {
        // Search for the file (mp3 or mp4)
        const files = fs.readdirSync(outputDir)
          .filter(f => f.endsWith(`.${fileExt}`))
          .map(f => ({ name: f, path: path.join(outputDir, f), time: fs.statSync(path.join(outputDir, f)).mtimeMs }))
          .sort((a, b) => b.time - a.time);

        if (files.length > 0) {
          download.filePath = files[0].path;
        }
      }

      download.status = 'complete';
      download.progress = 100;

      if (idx !== -1) {
        downloads[idx] = { ...downloads[idx], ...download };
        store.set('downloads', downloads);
      }

      mainWindow.webContents.send('download-complete', { id: downloadId, filePath: download.filePath, format: download.format });
    } else {
      download.status = 'error';
      download.error = 'Download failed';

      if (idx !== -1) {
        downloads[idx] = { ...downloads[idx], ...download };
        store.set('downloads', downloads);
      }

      mainWindow.webContents.send('download-error', { id: downloadId, error: 'Download failed' });
    }

    activeDownloads.delete(downloadId);
  });

  return downloadId;
});

ipcMain.handle('cancel-download', (event, id) => {
  // For now, we just mark it as cancelled in history
  const downloads = store.get('downloads');
  const idx = downloads.findIndex(d => d.id === id);
  if (idx !== -1) {
    downloads[idx].status = 'cancelled';
    store.set('downloads', downloads);
  }
  return downloads;
});
