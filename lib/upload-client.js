import fetch from 'node-fetch';
import FormData from 'form-data';
import { createReadStream, statSync } from 'fs';
import path from 'path';

/**
 * Upload client for catbox.moe (200MB limit, no auth required)
 * Perfect for Discord video embeds - direct links
 */
export class UploadClient {
  constructor() {
    this.baseUrl = 'https://catbox.moe/user/api.php';
    this.uploadedFiles = new Map(); // In-memory storage for file metadata
  }

  /**
   * Upload a file to catbox.moe
   * @param {string} filePath - Local file path
   * @param {string} fileName - Optional custom filename
   * @returns {Promise<Object>} Upload result with direct URL
   */
  async uploadFile(filePath, fileName = null) {
    const stats = statSync(filePath);
    const fileSize = stats.size;

    // Check file size (200MB limit)
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (fileSize > maxSize) {
      throw new Error(`File size exceeds 200MB limit (${this.formatBytes(fileSize)})`);
    }

    const form = new FormData();
    const actualFileName = fileName || path.basename(filePath);

    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', createReadStream(filePath), {
      filename: actualFileName
    });

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: form,
        headers: form.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
      }

      // catbox.moe returns direct URL as plain text
      const directUrl = await response.text();

      if (!directUrl || !directUrl.startsWith('https://')) {
        throw new Error('Invalid response from catbox.moe');
      }

      // Extract file ID from URL (e.g., https://files.catbox.moe/abc123.mp4 -> abc123)
      const urlParts = directUrl.split('/');
      const fileNameWithExt = urlParts[urlParts.length - 1];
      const fileId = fileNameWithExt.split('.')[0];

      // Store metadata
      const fileInfo = {
        id: fileId,
        name: actualFileName,
        url: directUrl.trim(),
        size: fileSize,
        uploadedAt: Date.now(),
        type: this.getFileType(actualFileName)
      };

      this.uploadedFiles.set(fileId, fileInfo);

      return fileInfo;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Get file info from storage
   * @param {string} fileId - File ID
   * @returns {Object|null} File information
   */
  getFileInfo(fileId) {
    return this.uploadedFiles.get(fileId) || null;
  }

  /**
   * List all uploaded files
   * @returns {Array} List of file objects
   */
  listFiles() {
    return Array.from(this.uploadedFiles.values());
  }

  /**
   * Delete file from local storage (note: files on catbox.moe are permanent)
   * @param {string} fileId - File ID
   */
  deleteFile(fileId) {
    this.uploadedFiles.delete(fileId);
  }

  /**
   * Get file type from filename
   * @param {string} filename - Filename
   * @returns {string} File type (video, image, audio, document, other)
   */
  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'];
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
    const docExts = ['.pdf', '.doc', '.docx', '.txt', '.md'];

    if (videoExts.includes(ext)) return 'video';
    if (imageExts.includes(ext)) return 'image';
    if (audioExts.includes(ext)) return 'audio';
    if (docExts.includes(ext)) return 'document';
    return 'other';
  }

  /**
   * Format bytes to human readable
   * @param {number} bytes - Bytes
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted string
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
