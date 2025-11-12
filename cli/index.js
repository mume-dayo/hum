#!/usr/bin/env node

import { Command } from 'commander';
import { config } from 'dotenv';
import { MegaClient } from '../lib/mega-client.js';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import path from 'path';

config();

const program = new Command();

// Initialize MEGA client
const getClient = () => {
  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email || !password) {
    console.error(chalk.red('Error: MEGA_EMAIL and MEGA_PASSWORD must be set in .env file'));
    process.exit(1);
  }

  return new MegaClient(email, password);
};

program
  .name('mega-cli')
  .description('CLI tool for managing files on MEGA')
  .version('1.0.0');

// List files
program
  .command('list [path]')
  .alias('ls')
  .description('List files in MEGA storage')
  .action(async (folderPath = '/') => {
    const spinner = ora('Connecting to MEGA...').start();
    const client = getClient();

    try {
      const files = await client.listFiles(folderPath);
      spinner.succeed('Connected');

      console.log(chalk.bold(`\nFiles in ${folderPath}:\n`));

      if (files.length === 0) {
        console.log(chalk.gray('  (empty)'));
      } else {
        files.forEach(file => {
          const icon = file.type === 'folder' ? '📁' : '📄';
          const size = file.size > 0 ? formatBytes(file.size) : '';
          const color = file.type === 'folder' ? chalk.blue : chalk.white;

          console.log(`  ${icon} ${color(file.name)} ${chalk.gray(size)}`);
        });
      }

      await client.disconnect();
    } catch (error) {
      spinner.fail('Error listing files');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Upload file
program
  .command('upload <localPath> [remotePath]')
  .alias('up')
  .description('Upload a file to MEGA')
  .action(async (localPath, remotePath) => {
    if (!existsSync(localPath)) {
      console.error(chalk.red(`Error: File not found: ${localPath}`));
      process.exit(1);
    }

    const spinner = ora('Uploading file...').start();
    const client = getClient();

    try {
      const result = await client.uploadFile(localPath, remotePath);
      spinner.succeed(`Uploaded: ${result.name}`);
      await client.disconnect();
    } catch (error) {
      spinner.fail('Upload failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Download file
program
  .command('download <remotePath> [localPath]')
  .alias('dl')
  .description('Download a file from MEGA')
  .action(async (remotePath, localPath) => {
    const fileName = path.basename(remotePath);
    const outputPath = localPath || `./${fileName}`;

    const spinner = ora('Downloading file...').start();
    const client = getClient();

    try {
      const result = await client.downloadFile(remotePath, outputPath);
      spinner.succeed(`Downloaded to: ${result.path}`);
      await client.disconnect();
    } catch (error) {
      spinner.fail('Download failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Delete file
program
  .command('delete <remotePath>')
  .alias('rm')
  .description('Delete a file from MEGA')
  .action(async (remotePath) => {
    const spinner = ora('Deleting file...').start();
    const client = getClient();

    try {
      await client.deleteFile(remotePath);
      spinner.succeed(`Deleted: ${remotePath}`);
      await client.disconnect();
    } catch (error) {
      spinner.fail('Delete failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Create folder
program
  .command('mkdir <folderPath>')
  .description('Create a folder in MEGA')
  .action(async (folderPath) => {
    const spinner = ora('Creating folder...').start();
    const client = getClient();

    try {
      await client.createFolder(folderPath);
      spinner.succeed(`Created: ${folderPath}`);
      await client.disconnect();
    } catch (error) {
      spinner.fail('Failed to create folder');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Get file info
program
  .command('info <remotePath>')
  .description('Get information about a file')
  .action(async (remotePath) => {
    const spinner = ora('Fetching file info...').start();
    const client = getClient();

    try {
      const info = await client.getFileInfo(remotePath);
      spinner.succeed('File info:');

      console.log(chalk.bold('\nFile Information:\n'));
      console.log(`  Name: ${chalk.cyan(info.name)}`);
      console.log(`  Size: ${chalk.yellow(formatBytes(info.size))}`);
      console.log(`  Type: ${info.directory ? chalk.blue('Folder') : chalk.white('File')}`);
      if (info.timestamp) {
        console.log(`  Modified: ${chalk.gray(new Date(info.timestamp * 1000).toLocaleString())}`);
      }

      await client.disconnect();
    } catch (error) {
      spinner.fail('Failed to get file info');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

program.parse();
