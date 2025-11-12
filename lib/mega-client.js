import { Storage } from 'megajs';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';

export class MegaClient {
  constructor(email = null, password = null) {
    this.email = email;
    this.password = password;
    this.storage = null;
  }

  async connect() {
    if (this.storage) return this.storage;

    // If no credentials provided, use anonymous mode (read-only for public links)
    if (!this.email || !this.password) {
      this.storage = new Storage();
      return this.storage;
    }

    this.storage = await new Storage({
      email: this.email,
      password: this.password
    }).ready;

    return this.storage;
  }

  async disconnect() {
    if (this.storage) {
      this.storage.close();
      this.storage = null;
    }
  }

  async listFiles(folderPath = '/') {
    await this.connect();

    const root = this.storage.root;
    let currentFolder = root;

    if (folderPath !== '/') {
      const parts = folderPath.split('/').filter(p => p);
      for (const part of parts) {
        const found = currentFolder.children?.find(c => c.name === part && c.directory);
        if (!found) throw new Error(`Folder not found: ${folderPath}`);
        currentFolder = found;
      }
    }

    const files = [];
    const processFolder = (folder, prefix = '') => {
      if (!folder.children) return;

      for (const child of folder.children) {
        const fullPath = prefix + '/' + child.name;
        if (child.directory) {
          files.push({
            name: child.name,
            path: fullPath,
            type: 'folder',
            size: 0
          });
          processFolder(child, fullPath);
        } else {
          files.push({
            name: child.name,
            path: fullPath,
            type: 'file',
            size: child.size,
            timestamp: child.timestamp
          });
        }
      }
    };

    processFolder(currentFolder, folderPath === '/' ? '' : folderPath);
    return files;
  }

  async uploadFile(localPath, remotePath = null) {
    await this.connect();

    const fileName = path.basename(localPath);
    const uploadName = remotePath || fileName;

    const fileStream = createReadStream(localPath);
    const uploadStream = this.storage.upload({
      name: uploadName,
      allowUploadBuffering: true
    });

    await pipeline(fileStream, uploadStream);

    return {
      name: uploadName,
      success: true
    };
  }

  async downloadFile(remotePath, localPath) {
    await this.connect();

    // Find file in storage
    const file = this.findFileByPath(this.storage.root, remotePath);
    if (!file) throw new Error(`File not found: ${remotePath}`);

    const downloadStream = file.download();
    const fileStream = createWriteStream(localPath);

    await pipeline(downloadStream, fileStream);

    return {
      path: localPath,
      success: true
    };
  }

  async deleteFile(remotePath) {
    await this.connect();

    const file = this.findFileByPath(this.storage.root, remotePath);
    if (!file) throw new Error(`File not found: ${remotePath}`);

    await file.delete(true);

    return {
      path: remotePath,
      success: true
    };
  }

  async createFolder(folderPath) {
    await this.connect();

    const parts = folderPath.split('/').filter(p => p);
    let currentFolder = this.storage.root;

    for (const part of parts) {
      let found = currentFolder.children?.find(c => c.name === part && c.directory);

      if (!found) {
        found = await currentFolder.mkdir(part);
      }

      currentFolder = found;
    }

    return {
      path: folderPath,
      success: true
    };
  }

  findFileByPath(folder, targetPath) {
    const parts = targetPath.split('/').filter(p => p);
    let current = folder;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!current.children) return null;

      const found = current.children.find(c => c.name === part);
      if (!found) return null;

      if (isLast) return found;
      if (!found.directory) return null;

      current = found;
    }

    return null;
  }

  async getFileInfo(remotePath) {
    await this.connect();

    const file = this.findFileByPath(this.storage.root, remotePath);
    if (!file) throw new Error(`File not found: ${remotePath}`);

    return {
      name: file.name,
      size: file.size,
      timestamp: file.timestamp,
      directory: file.directory || false,
      downloadId: file.downloadId
    };
  }
}
