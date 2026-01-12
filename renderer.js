// Video2MP3 Renderer Process
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const views = document.querySelectorAll('.view');
  const navBtns = document.querySelectorAll('.nav-btn[data-view]');
  const filterBtns = document.querySelectorAll('.filter-btn');

  const urlInput = document.getElementById('urlInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadBtnText = document.getElementById('downloadBtnText');
  const videoPreview = document.getElementById('videoPreview');
  const previewThumbnail = document.getElementById('previewThumbnail');
  const previewTitle = document.getElementById('previewTitle');
  const previewChannel = document.getElementById('previewChannel');
  const previewDuration = document.getElementById('previewDuration');
  const activeDownloadsList = document.getElementById('activeDownloadsList');
  const historyList = document.getElementById('historyList');
  const historyBadge = document.getElementById('historyBadge');
  const emptyHistory = document.getElementById('emptyHistory');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const openFolderBtn = document.getElementById('openFolderBtn');

  // Format toggle elements
  const formatToggleBtns = document.querySelectorAll('.format-btn');

  // Settings elements
  const outputDirInput = document.getElementById('outputDirInput');
  const browseFolderBtn = document.getElementById('browseFolderBtn');
  const downloadFormatSelect = document.getElementById('downloadFormatSelect');
  const audioQualitySelect = document.getElementById('audioQualitySelect');
  const videoQualitySelect = document.getElementById('videoQualitySelect');
  const audioQualityGroup = document.getElementById('audioQualityGroup');
  const videoQualityGroup = document.getElementById('videoQualityGroup');
  const minimizeToTrayCheck = document.getElementById('minimizeToTrayCheck');
  const showSplashCheck = document.getElementById('showSplashCheck');

  // State
  let currentVideoInfo = null;
  let activeDownloads = new Map();
  let currentFilter = 'all';
  let currentFormat = 'mp3';

  // Window controls
  document.getElementById('minimizeBtn').onclick = () => window.api.minimize();
  document.getElementById('maximizeBtn').onclick = () => window.api.maximize();
  document.getElementById('closeBtn').onclick = () => window.api.close();

  // Navigation
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewName = btn.dataset.view;
      switchView(viewName);
    });
  });

  function switchView(viewName) {
    navBtns.forEach(b => b.classList.remove('active'));
    views.forEach(v => v.classList.remove('active'));

    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
    document.getElementById(`${viewName}View`).classList.add('active');

    if (viewName === 'history') {
      loadHistory();
    } else if (viewName === 'settings') {
      loadSettings();
    }
  }

  // Filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadHistory();
    });
  });

  // Format toggle buttons (MP3/MP4)
  formatToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      formatToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFormat = btn.dataset.format;
      updateDownloadButton();
      // Also sync with settings dropdown
      if (downloadFormatSelect) {
        downloadFormatSelect.value = currentFormat;
        updateFormatVisibility();
      }
      saveSettings();
    });
  });

  function updateDownloadButton() {
    const formatLabel = currentFormat.toUpperCase();
    downloadBtnText.textContent = `Download ${formatLabel}`;
  }

  // Paste button
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      urlInput.value = text;
      urlInput.dispatchEvent(new Event('input'));
    } catch (e) {
      showToast('error', 'Clipboard Error', 'Could not read from clipboard');
    }
  });

  // URL input handling with debounce
  let debounceTimer;
  urlInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleUrlInput, 500);
  });

  async function handleUrlInput() {
    const url = urlInput.value.trim();

    if (!url) {
      videoPreview.classList.add('hidden');
      currentVideoInfo = null;
      return;
    }

    if (!isValidUrl(url)) {
      return;
    }

    try {
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = '<div class="spinner"></div><span>Loading...</span>';

      const info = await window.api.getVideoInfo(url);
      currentVideoInfo = info;

      previewThumbnail.src = info.thumbnail || '';
      previewTitle.textContent = info.title || 'Unknown Title';
      previewChannel.textContent = info.channel || 'Unknown';
      previewDuration.textContent = formatDuration(info.duration);

      videoPreview.classList.remove('hidden');
    } catch (e) {
      videoPreview.classList.add('hidden');
      currentVideoInfo = null;
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span id="downloadBtnText">Download ${currentFormat.toUpperCase()}</span>
      `;
    }
  }

  // Download button
  downloadBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();

    if (!url) {
      showToast('error', 'No URL', 'Please enter a video URL');
      return;
    }

    if (!isValidUrl(url)) {
      showToast('error', 'Invalid URL', 'Please enter a valid URL');
      return;
    }

    try {
      downloadBtn.disabled = true;

      // Get video info if we don't have it
      if (!currentVideoInfo) {
        downloadBtn.innerHTML = '<div class="spinner"></div><span>Getting info...</span>';
        currentVideoInfo = await window.api.getVideoInfo(url);
      }

      downloadBtn.innerHTML = '<div class="spinner"></div><span>Starting...</span>';

      const downloadId = await window.api.startDownload({
        url: currentVideoInfo.url || url,
        title: currentVideoInfo.title,
        thumbnail: currentVideoInfo.thumbnail
      });

      activeDownloads.set(downloadId, {
        id: downloadId,
        title: currentVideoInfo.title,
        thumbnail: currentVideoInfo.thumbnail,
        progress: 0,
        status: 'downloading'
      });

      renderActiveDownloads();

      // Clear input
      urlInput.value = '';
      videoPreview.classList.add('hidden');
      currentVideoInfo = null;

      showToast('success', 'Download Started', currentVideoInfo?.title || 'Video download started');
    } catch (e) {
      showToast('error', 'Download Failed', e.message || 'Could not start download');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span id="downloadBtnText">Download ${currentFormat.toUpperCase()}</span>
      `;
    }
  });

  // Event listeners from main process
  window.api.onDownloadProgress(({ id, progress, status }) => {
    const download = activeDownloads.get(id);
    if (download) {
      download.progress = progress;
      download.status = status || 'downloading';
      renderActiveDownloads();
    }
  });

  window.api.onDownloadComplete(({ id, filePath, format }) => {
    activeDownloads.delete(id);
    renderActiveDownloads();
    loadHistory();
    const formatLabel = (format || 'mp3').toUpperCase();
    showToast('success', 'Download Complete', `${formatLabel} saved successfully`);
  });

  window.api.onDownloadError(({ id, error }) => {
    activeDownloads.delete(id);
    renderActiveDownloads();
    loadHistory();
    showToast('error', 'Download Failed', error);
  });

  // Render active downloads
  function renderActiveDownloads() {
    if (activeDownloads.size === 0) {
      activeDownloadsList.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">No active downloads</p>';
      return;
    }

    activeDownloadsList.innerHTML = '';
    activeDownloads.forEach(download => {
      const item = createDownloadItem(download, true);
      activeDownloadsList.appendChild(item);
    });
  }

  // Load history
  async function loadHistory() {
    const downloads = await window.api.getDownloads();

    // Update badge
    const completedCount = downloads.filter(d => d.status === 'complete').length;
    historyBadge.textContent = completedCount;

    // Filter
    let filtered = downloads;
    if (currentFilter === 'complete') {
      filtered = downloads.filter(d => d.status === 'complete');
    } else if (currentFilter === 'error') {
      filtered = downloads.filter(d => d.status === 'error');
    }

    if (filtered.length === 0) {
      historyList.innerHTML = '';
      emptyHistory.style.display = 'flex';
      return;
    }

    emptyHistory.style.display = 'none';
    historyList.innerHTML = '';

    filtered.forEach(download => {
      const item = createDownloadItem(download, false);
      historyList.appendChild(item);
    });
  }

  // Create download item element
  function createDownloadItem(download, isActive) {
    const div = document.createElement('div');
    div.className = 'download-item';
    div.dataset.id = download.id;

    const statusClass = download.status === 'complete' ? 'complete' :
                       download.status === 'error' ? 'error' :
                       download.status === 'converting' ? 'converting' : '';

    let statusText;
    const formatLabel = (download.format || currentFormat || 'mp3').toUpperCase();
    if (isActive) {
      if (download.status === 'converting') {
        statusText = `Converting to ${formatLabel}...`;
      } else {
        statusText = `Downloading ${Math.round(download.progress)}%`;
      }
    } else {
      statusText = download.status === 'complete' ? 'Completed' :
                   download.status === 'error' ? 'Failed' :
                   download.status === 'converting' ? 'Converting...' :
                   download.status.charAt(0).toUpperCase() + download.status.slice(1);
    }

    const platformClass = (download.platform || 'other').toLowerCase().replace(/\s/g, '');

    // For converting status, show animated progress bar
    const isConverting = download.status === 'converting';
    const progressBarClass = isConverting ? 'progress-bar converting' : 'progress-bar';

    div.innerHTML = `
      <div class="thumbnail">
        ${download.thumbnail ? `<img src="${download.thumbnail}" alt="">` : ''}
        ${download.platform ? `<span class="platform-tag ${platformClass}">${download.platform}</span>` : ''}
      </div>
      <div class="info">
        <div class="title">${escapeHtml(download.title || 'Unknown')}</div>
        ${isActive ? `
          <div class="${progressBarClass}">
            <div class="progress-fill ${isConverting ? 'converting-animation' : ''}" style="width: ${download.progress}%"></div>
          </div>
        ` : ''}
        <div class="status ${statusClass}">${statusText}</div>
      </div>
      <div class="actions">
        ${download.status === 'complete' && download.filePath ? `
          <button class="item-btn play-btn" title="Play">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </button>
          <button class="item-btn folder-btn" title="Show in folder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        ` : ''}
        <button class="item-btn delete" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `;

    // Event handlers
    const playBtn = div.querySelector('.play-btn');
    if (playBtn) {
      playBtn.onclick = () => window.api.openFile(download.filePath);
    }

    const folderBtn = div.querySelector('.folder-btn');
    if (folderBtn) {
      folderBtn.onclick = () => window.api.showInFolder(download.filePath);
    }

    const deleteBtn = div.querySelector('.delete');
    deleteBtn.onclick = async () => {
      if (isActive) {
        await window.api.cancelDownload(download.id);
        activeDownloads.delete(download.id);
        renderActiveDownloads();
      } else {
        await window.api.deleteDownload(download.id);
        loadHistory();
      }
    };

    return div;
  }

  // Clear history
  clearHistoryBtn.addEventListener('click', async () => {
    if (confirm('Clear all download history? This will also delete the downloaded files.')) {
      await window.api.clearHistory();
      loadHistory();
      showToast('success', 'History Cleared', 'All downloads have been removed');
    }
  });

  // Open folder
  openFolderBtn.addEventListener('click', () => {
    window.api.openDownloadsFolder();
  });

  // Settings
  async function loadSettings() {
    const settings = await window.api.getSettings();
    outputDirInput.value = settings.outputDir || '';
    downloadFormatSelect.value = settings.downloadFormat || 'mp3';
    audioQualitySelect.value = settings.audioQuality || '192';
    videoQualitySelect.value = settings.videoQuality || 'best';
    minimizeToTrayCheck.checked = settings.minimizeToTray !== false;
    if (showSplashCheck) {
      showSplashCheck.checked = settings.showSplash !== false;
    }

    // Sync current format with saved settings
    currentFormat = settings.downloadFormat || 'mp3';

    // Update format toggle buttons to match saved setting
    formatToggleBtns.forEach(btn => {
      if (btn.dataset.format === currentFormat) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    updateDownloadButton();
    updateFormatVisibility();
  }

  function updateFormatVisibility() {
    if (downloadFormatSelect.value === 'mp3') {
      audioQualityGroup.classList.remove('hidden');
      videoQualityGroup.classList.add('hidden');
    } else {
      audioQualityGroup.classList.add('hidden');
      videoQualityGroup.classList.remove('hidden');
    }
  }

  browseFolderBtn.addEventListener('click', async () => {
    const folder = await window.api.selectFolder();
    if (folder) {
      outputDirInput.value = folder;
      saveSettings();
    }
  });

  downloadFormatSelect.addEventListener('change', () => {
    currentFormat = downloadFormatSelect.value;
    // Sync format toggle buttons
    formatToggleBtns.forEach(btn => {
      if (btn.dataset.format === currentFormat) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    updateDownloadButton();
    updateFormatVisibility();
    saveSettings();
  });
  audioQualitySelect.addEventListener('change', saveSettings);
  videoQualitySelect.addEventListener('change', saveSettings);
  minimizeToTrayCheck.addEventListener('change', saveSettings);
  if (showSplashCheck) {
    showSplashCheck.addEventListener('change', saveSettings);
  }

  async function saveSettings() {
    const settings = {
      outputDir: outputDirInput.value,
      downloadFormat: currentFormat,
      audioQuality: audioQualitySelect.value,
      videoQuality: videoQualitySelect.value,
      minimizeToTray: minimizeToTrayCheck.checked,
      showSplash: showSplashCheck ? showSplashCheck.checked : true
    };
    await window.api.saveSettings(settings);
  }

  // Toast notifications
  function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconSvg = type === 'success'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
      <button class="toast-close">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    toast.querySelector('.toast-close').onclick = () => toast.remove();

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Utilities
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  function formatDuration(seconds) {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize
  renderActiveDownloads();
  loadHistory();
  loadSettings();
});
