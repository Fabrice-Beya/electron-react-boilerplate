/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import dotenv from 'dotenv';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

// Load and validate environment variables
const loadEnvironmentVariables = () => {
  const envPath = path.join(__dirname, '../../.env');
  
  if (!fs.existsSync(envPath)) {
    console.warn('.env file not found at:', envPath);
    return false;
  }

  // Force reload environment variables
  dotenv.config({ path: envPath, override: true });

  // Verify required environment variables
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }

  return true;
};

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on('update-env-vars', async (event, envVars) => {
  try {
    // Update process.env
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = value as string;
    });

    // Create .env file content
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');

    // Write to .env file
    fs.writeFileSync(path.join(__dirname, '../../.env'), envContent);

    // Update the window.env object in the renderer process
    if (mainWindow) {
      mainWindow.webContents.send('env-vars-updated', envVars);
    }
  } catch (error) {
    console.error('Error updating environment variables:', error);
  }
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  try {
    // Load environment variables first
    const envLoaded = loadEnvironmentVariables();
    if (!envLoaded) {
      console.warn('Environment variables not properly loaded. Some features may not work.');
    }

    if (isDebug) {
      await installExtensions();
    }

    const RESOURCES_PATH = app.isPackaged
      ? path.join(process.resourcesPath, 'assets')
      : path.join(__dirname, '../../assets');

    const getAssetPath = (...paths: string[]): string => {
      return path.join(RESOURCES_PATH, ...paths);
    };

    // Create window
    mainWindow = new BrowserWindow({
      show: false,
      width: 1024,
      height: 728,
      icon: getAssetPath('icon_inverted.png'),
      webPreferences: {
        preload: app.isPackaged
          ? path.join(__dirname, 'preload.js')
          : path.join(__dirname, '../../.erb/dll/preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Load the app
    await mainWindow.loadURL(resolveHtmlPath('index.html'));

    // Show window when ready
    mainWindow.show();
    mainWindow.focus();

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
      shell.openExternal(edata.url);
      return { action: 'deny' };
    });

    // Remove this if your app does not use auto updates
    new AppUpdater();
  } catch (error) {
    console.error('Error creating window:', error);
    throw error;
  }
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
