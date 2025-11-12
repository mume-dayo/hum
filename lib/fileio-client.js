import fetch from 'node-fetch';
import FormData from 'form-data';
import { createReadStream } from 'fs';

export class FileIOClient {
  constructor() {
    this.baseUrl = 'https://file.io';
    this.uploadedFiles = new Map(); // Store file metadata
  }

  /**
   * Upload a file to file.io
   * @param {string} filePath - Local file path
   * @param {number} expires - Expiration time (e.g., '1d', '1w', '1m', '1y')
   * @returns {Promise<Object>} Upload result with download link
   */
  async uploadFile(filePath, expires = '1y') {
    const form = new FormData();
    form.append('file', createReadStream(filePath));
    form.append('expires', expires); // 1 year

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: form,
        headers: form.getHeaders()
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      // Store metadata
      const fileInfo = {
        key: data.key,
        link: data.link,
        expires: data.expires,
        size: data.size,
        name: data.name,
        uploadedAt: Date.now()
      };

      this.uploadedFiles.set(data.key, fileInfo);

      return fileInfo;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Get file info (from local storage)
   * @param {string} key - File key
   * @returns {Object} File information
   */
  getFileInfo(key) {
    return this.uploadedFiles.get(key);
  }

  /**
   * List all uploaded files (from local storage)
   * @returns {Array} List of files
   */
  listFiles() {
    return Array.from(this.uploadedFiles.values());
  }

  /**
   * Get download URL
   * @param {string} key - File key
   * @returns {string} Download URL
   */
  getDownloadUrl(key) {
    const fileInfo = this.uploadedFiles.get(key);
    return fileInfo ? fileInfo.link : null;
  }

  /**
   * Delete file reference (file.io files auto-delete after first download or expiration)
   * @param {string} key - File key
   */
  deleteFile(key) {
    this.uploadedFiles.delete(key);
  }
}
