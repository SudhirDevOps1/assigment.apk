'use strict';

/**
 * Desktop shell for the assignment suite.
 *
 * The UI itself lives in ../web — exactly the same files Capacitor copies into
 * the Android APK. Electron only adds a native window, a menu, printing and
 * window-state memory. Everything works with the network switched off.
 */

const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const APP_ID = 'in.bca.sem5.assignment';
const APP_NAME = 'BCA Sem V';

const isMac = process.platform === 'darwin';

// Packaged: web/ is copied next to the app by electron-builder (extraResources).
// Development: it is the repository's own web/ folder.
const WEB_ROOT = app.isPackaged
  ? path.join(process.resourcesPath, 'web')
  : path.join(__dirname, '..', 'web');
const START_PAGE = path.join(WEB_ROOT, 'index.html');

// Packaged: electron-builder copies resources/icon.png next to the app.
const ICON_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'icon.png')
  : path.join(__dirname, '..', 'resources', 'icon.png');

let mainWindow = null;
let saveTimer = null;

/* ------------------------------------------------------------------ state */

function stateFile() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function readState() {
  try {
    const raw = JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const bounds = mainWindow.getNormalBounds();
  try {
    fs.mkdirSync(path.dirname(stateFile()), { recursive: true });
    fs.writeFileSync(stateFile(), JSON.stringify({ ...bounds, maximized: mainWindow.isMaximized() }));
  } catch {
    /* remembering the window size must never crash the app */
  }
}

function scheduleStateSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(writeState, 500);
}

/* -------------------------------------------------------------- security */

function isInsideWeb(target) {
  const rel = path.relative(WEB_ROOT, target);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function filePathOf(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'file:') return null;
    // file:///D:/repo/web/index.html -> D:/repo/web/index.html
    return decodeURIComponent(parsed.pathname).replace(/^\/([A-Za-z]:)/, '$1');
  } catch {
    return null;
  }
}

function lockDown(contents) {
  contents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
    const target = filePathOf(url);
    if (target === null) {
      // never let a page navigate the shell to a website
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
      return;
    }
    if (!isInsideWeb(target)) event.preventDefault();
  });

  contents.on('will-attach-webview', (event) => event.preventDefault());
}

/* ---------------------------------------------------------------- window */

function createWindow() {
  const state = readState();

  mainWindow = new BrowserWindow({
    width: Number(state.width) || 1240,
    height: Number(state.height) || 880,
    x: Number.isFinite(state.x) ? state.x : undefined,
    y: Number.isFinite(state.y) ? state.y : undefined,
    minWidth: 360,
    minHeight: 480,
    backgroundColor: '#08080a',
    title: APP_NAME,
    icon: ICON_PATH,
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });

  lockDown(mainWindow.webContents);

  mainWindow.once('ready-to-show', () => {
    if (state.maximized) mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on('resize', scheduleStateSave);
  mainWindow.on('move', scheduleStateSave);
  mainWindow.on('close', writeState);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadFile(START_PAGE);
}

/* ------------------------------------------------------------------ menu */

function sendFocusMode() {
  if (!mainWindow) return;
  // The web app already owns the Focus behaviour - reuse it instead of
  // duplicating the logic in the desktop shell.
  mainWindow.webContents
    .executeJavaScript("document.getElementById('focusBtn')?.click()", true)
    .catch(() => {});
}

function zoomBy(delta) {
  if (!mainWindow) return;
  const next = Math.max(-4, Math.min(6, mainWindow.webContents.getZoomLevel() + delta));
  mainWindow.webContents.setZoomLevel(next);
}

function buildMenu() {
  const template = [
    ...(isMac
      ? [{
          label: APP_NAME,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        }]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Print / Save A4…',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.print({ printBackground: true })
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Focus mode', accelerator: 'CmdOrCtrl+Shift+F', click: sendFocusMode },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', click: () => zoomBy(0.5) },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => zoomBy(-0.5) },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', click: () => mainWindow?.webContents.setZoomLevel(0) },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'reload' }
      ]
    },
    {
      label: 'Go',
      submenu: [
        { label: 'All Subjects', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.loadFile(START_PAGE) },
        {
          label: 'Back',
          accelerator: 'Alt+Left',
          click: () => {
            const history = mainWindow?.webContents.navigationHistory;
            if (history?.canGoBack()) history.goBack();
          }
        },
        {
          label: 'Forward',
          accelerator: 'Alt+Right',
          click: () => {
            const history = mainWindow?.webContents.navigationHistory;
            if (history?.canGoForward()) history.goForward();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: APP_NAME,
            message: 'BCA Semester V · Assignment Suite',
            detail: [
              'Offline assignment reader for desktop.',
              `Electron ${process.versions.electron}`,
              'Five subjects, thirteen questions and 39 A4 pages — no network needed.',
              'Print with Ctrl+P, toggle the interface with Ctrl+Shift+F.'
            ].join('\n')
          })
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ------------------------------------------------------------------ boot */

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.setAppUserModelId(APP_ID);

  app.whenReady().then(() => {
    buildMenu();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('web-contents-created', (_event, contents) => lockDown(contents));

  app.on('window-all-closed', () => {
    if (!isMac) app.quit();
  });
}
