'use strict'

import {
  app,
  protocol,
  BrowserWindow,
  ipcMain,
  nativeTheme,
  Menu
} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { autoUpdater } from 'electron-updater'
import { template } from './services/menu-template'
import { v4 as uuidv4 } from 'uuid'
import { isDevelopment, isMacOS, isWindows } from '@/services/helpers'

const fs = require('fs')
let win

//import * as Sentry from '@sentry/electron';
//Sentry.init({ dsn: 'https://f12af54d6a3b4f00a7ec80e69cba835e@o559982.ingest.sentry.io/5695233' });

// Turn off software rasterizer for less resource usage
app.commandLine.appendSwitch('disable-software-rasterizer', 'true')

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 450,
    minWidth: 450,
    maxWidth: 450,
    height: 1000,
    minHeight: 500,
    title: 'linked',
    backgroundColor: '#07080a',
    webPreferences: {
      devTools: process.env.NODE_ENV === 'development',
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  // Load the url of the dev server if in development mode
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')

    /**
     * Will fire the autoupdater to check for new updates and notify the
     * user. This only needs to happen when *NOT* in development mode.
     */
    autoUpdater.checkForUpdatesAndNotify()
  }

  win.on('closed', () => {
    win = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (!isMacOS) {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (isWindows) {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

ipcMain.handle('dark-mode:toggle', (event, mode) => {
  if (mode === 'light') {
    nativeTheme.themeSource = 'light'
  } else {
    nativeTheme.themeSource = 'dark'
  }
  return nativeTheme.shouldUseDarkColors
})

ipcMain.handle('FETCH_FILE', async (event, args) => {
  const [year, fileName] = args
  const dataPath = getFilePath(year, fileName)
  const filePath = `${dataPath}/${fileName}.json`
  let file

  // create the file if it does not exist yet
  if (!fs.existsSync(filePath)) {
    file = fs.promises.mkdir(dataPath, { recursive: true }).then(() => {
      return fs.promises.writeFile(filePath, getDefaultData()).then(() => {
        return fs.promises.readFile(filePath, 'utf-8').then(data => {
          return JSON.parse(data)
        })
      })
    })
  } else {
    file = fs.promises.readFile(filePath, 'utf-8').then(data => {
      return JSON.parse(data)
    })
  }

  // return the file
  return file
})

ipcMain.handle('SAVE_FILE', (event, args) => {
  const [year, fileName, content, rating] = args
  const dataPath = getFilePath(year, fileName)
  const filePath = `${dataPath}/${fileName}.json`

  fs.promises.writeFile(
    filePath,
    JSON.stringify({
      uuid: uuidv4(),
      date: fileName,
      content: content,
      rating: rating
    })
  )
})

/**
 * Construct the base path where files are stored and loaded from
 */
const basePath = app.getPath('documents')
const getFilePath = year => {
  return `${basePath}/linked/${year}`
}

const getDefaultData = () => {
  return JSON.stringify({
    content: '',
    rating: 0
  })
}
