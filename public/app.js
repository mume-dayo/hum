// No authentication required
document.addEventListener('DOMContentLoaded', () => {
  showMainContent();
  loadFiles();
});

function showMainContent() {
  document.getElementById('authSection').style.display = 'none';
  document.getElementById('mainContent').classList.add('active');
}

async function loadFiles() {
  document.getElementById('fileList').innerHTML = '<div class="loading">読み込み中...</div>';
  hideError();

  try {
    const res = await fetch('/api/files');
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    renderFileList(data.files);
  } catch (err) {
    console.error('Error loading files:', err);
    showError('ファイルの読み込みに失敗しました: ' + err.message);
    document.getElementById('fileList').innerHTML = '';
  }
}

function renderFileList(files) {
  const fileList = document.getElementById('fileList');

  if (files.length === 0) {
    fileList.innerHTML = `
      <div class="empty-state">
        <span>📭</span>
        <p>ファイルがありません</p>
        <p style="font-size: 0.9rem; margin-top: 10px; color: #999;">ファイルをアップロードしてみましょう！</p>
      </div>
    `;
    return;
  }

  // Sort: videos first, then others
  files.sort((a, b) => {
    if (a.type === 'video' && b.type !== 'video') return -1;
    if (a.type !== 'video' && b.type === 'video') return 1;
    return b.uploadedAt - a.uploadedAt; // Newest first
  });

  fileList.innerHTML = files.map(file => {
    const isVideo = file.type === 'video';
    const icons = {
      video: '🎬',
      image: '🖼️',
      audio: '🎵',
      document: '📄',
      other: '📦'
    };
    const icon = icons[file.type] || icons.other;
    const size = formatBytes(file.size);
    const date = new Date(file.uploadedAt).toLocaleString('ja-JP');

    return `
      <div class="file-item">
        <div class="file-icon">${icon}</div>
        <div class="file-info">
          <div class="file-name">${escapeHtml(file.name)}</div>
          <div class="file-size">${size} • ${date}</div>
        </div>
        <div class="file-actions">
          ${isVideo ? `<button onclick="showVideoLink('${file.id}', '${escapeHtml(file.name)}', '${file.url}')">🔗 動画リンク</button>` : ''}
          <button onclick="window.open('${file.url}', '_blank')">📥 ダウンロード</button>
          <button class="btn-delete" onclick="deleteFile('${file.id}')">🗑️ 削除</button>
        </div>
      </div>
    `;
  }).join('');
}

function showUploadModal() {
  document.getElementById('uploadModal').classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

async function uploadFile() {
  const fileInput = document.getElementById('fileInput');

  if (!fileInput.files || fileInput.files.length === 0) {
    alert('ファイルを選択してください');
    return;
  }

  const file = fileInput.files[0];

  // Check file size (200MB limit for catbox.moe)
  const maxSize = 200 * 1024 * 1024; // 200MB
  if (file.size > maxSize) {
    alert(`ファイルサイズが大きすぎます。200MB以下のファイルを選択してください。\n選択されたファイル: ${formatBytes(file.size)}`);
    return;
  }

  // Get API key from localStorage or prompt user
  let apiKey = localStorage.getItem('apiKey');
  if (!apiKey) {
    apiKey = prompt('API Keyを入力してください:');
    if (!apiKey) {
      return;
    }
    localStorage.setItem('apiKey', apiKey);
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    closeModal('uploadModal');
    showLoading('アップロード中...');

    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey
      },
      body: formData
    });

    const data = await res.json();

    if (!data.success) {
      // If unauthorized, clear stored API key and retry
      if (res.status === 401) {
        localStorage.removeItem('apiKey');
        alert('❌ API Keyが無効です。もう一度入力してください。');
        await loadFiles();
        return;
      }
      throw new Error(data.error);
    }

    alert('✅ アップロードが完了しました！');
    fileInput.value = '';
    await loadFiles();
  } catch (err) {
    console.error('Upload error:', err);
    showError('アップロードに失敗しました: ' + err.message);
    await loadFiles();
  }
}

async function deleteFile(fileId) {
  if (!confirm('本当に削除しますか？\n（注意: 外部ストレージからは削除されません）')) {
    return;
  }

  try {
    showLoading('削除中...');

    const res = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    await loadFiles();
  } catch (err) {
    console.error('Delete error:', err);
    showError('削除に失敗しました: ' + err.message);
    await loadFiles();
  }
}

function showVideoLink(fileId, filename, directUrl) {
  const videoUrl = `${window.location.origin}/v/${fileId}`;

  const html = `
    <div style="padding: 20px;">
      <h3 style="margin-bottom: 15px;">🎬 ${escapeHtml(filename)}</h3>

      <p style="margin-bottom: 10px; color: #666;">Discordに貼り付けて埋め込み表示</p>
      <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin-bottom: 15px; word-break: break-all; font-family: monospace; font-size: 0.9rem;">
        ${videoUrl}
      </div>
      <button class="btn" onclick="copyToClipboard('${videoUrl}')" style="margin-right: 10px;">📋 URLをコピー</button>
      <button class="btn" onclick="window.open('${videoUrl}', '_blank')">🔗 プレビュー</button>

      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">

      <p style="margin-bottom: 10px; color: #666; font-size: 0.9rem;">直接動画URL</p>
      <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 0.85rem;">
        ${directUrl}
      </div>
      <button class="btn" onclick="copyToClipboard('${directUrl}')" style="margin-top: 10px;">📋 直接URLをコピー</button>
    </div>
  `;

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      ${html}
      <div class="modal-actions" style="margin-top: 20px;">
        <button class="btn" onclick="this.closest('.modal').remove()">閉じる</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('✅ URLをクリップボードにコピーしました！');
  }).catch(err => {
    console.error('Failed to copy:', err);
    prompt('URLをコピーしてください:', text);
  });
}

function showLoading(message) {
  document.getElementById('fileList').innerHTML = `<div class="loading">${message}</div>`;
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

function hideError() {
  document.getElementById('error').style.display = 'none';
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function clearApiKey() {
  if (confirm('保存されているAPI Keyをクリアしますか？')) {
    localStorage.removeItem('apiKey');
    alert('✅ API Keyをクリアしました。次回アップロード時に再入力が必要です。');
  }
}
