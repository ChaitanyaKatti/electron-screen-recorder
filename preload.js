// Import desktopCapturer from Electron
const { ipcRenderer, contextBridge } = require('electron');
const { Buffer } = require('buffer');

const API = {
    getVideoSources: async () => {
        return await ipcRenderer.invoke('get-sources');
    },
    openFolder: async () => {
        return await ipcRenderer.invoke('open-folder');
    },
    saveVideo: async (data) => {
        return await ipcRenderer.invoke('save-video', data);
    },
    convertBlob: async (blob) => {
        return Buffer.from(await blob.arrayBuffer());
    }
};

contextBridge.exposeInMainWorld('api', API);