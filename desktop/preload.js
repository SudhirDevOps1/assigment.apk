'use strict';

/**
 * The desktop shell exposes almost nothing on purpose: the pages are plain
 * static HTML and need no privileged API. A tiny read-only marker lets the
 * stylesheet adapt when it is running inside the Electron window.
 */

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('assignmentDesktop', Object.freeze({
  isDesktop: true,
  platform: process.platform,
  electron: process.versions.electron,
  chrome: process.versions.chrome
}));
