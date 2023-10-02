const path = require('path');
const fs = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');
const { ipcMain, app, BrowserWindow, desktopCapturer, Menu, dialog } = require('electron');

const isDev = app.isPackaged;
const isMac = process.platform === 'darwin';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}


function createWindow(){
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: isDev ? 1200 : 800,
    height: 800,
    resizable: isDev,
    icon: `${__dirname}/assets/icons/icon_256x256.png`,
    backgroundColor: 'white',
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, './preload.js'),
    },
    devTools: isDev,
  });

  mainWindow.removeMenu();

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));

  // Open the DevTools.
  if (isDev) mainWindow.webContents.openDevTools();
};

app.on('ready', () => {
  createWindow();

  // const mainMenu = Menu.buildFromTemplate(menu);
  // Menu.setApplicationMenu(mainMenu);

  // Remove variable from memory
  // mainWindow.on('closed', () => (mainWindow = null));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


ipcMain.handle('get-sources', async (event) => {
  // Get all available input sources (screens, windows, cameras, etc.)
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen'  ]
  });

  // We only need name and ID properties of each source
  return inputSources.map(source => ({
    name: source.name,
    id: source.id
  }));
});


// Open folder where video is saved
ipcMain.handle('open-folder', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});


ipcMain.handle('save-video', async (event, { filePath, buffer }) => {
  const tempFilePath = `${filePath}.webm`;
  const mp4FilePath = `${filePath}.mp4`;

  try {
    // Write the WebM buffer to a temporary file
    await fs.writeFile(tempFilePath, buffer);
    console.log('Temp video saved successfully!');

    // Convert WebM to MP4 using fluent-ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(tempFilePath)
        .output(mp4FilePath)
        .on('end', () => {
          console.log('Video converted successfully!');

          // Clean up the temporary WebM file
          fs.unlink(tempFilePath)
            .then(() => {
              console.log('Temporary WebM file deleted');
              resolve(mp4FilePath);
            })
            .catch((error) => {
              console.error('Error deleting temporary WebM file:', error);
              reject(error);
            });
        })
        .on('error', (err) => {
          console.error('Error converting WebM to MP4:', err);
          reject(err);
        })
        .run();
    });

    return mp4FilePath;
  } catch (error) {
    console.error('Error saving or converting video:', error);
    throw error;
  }
});
