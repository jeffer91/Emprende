const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { createDatabase } = require('./db.cjs');
const { generateWord, cleanFileName } = require('./documents.cjs');

let mainWindow;
let store;
let workspaceRoot;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#f8fafc',
    title: 'Emprende',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

function registerIpc() {
  ipcMain.handle('app:state', () => ({
    institution: store.getInstitution(),
    documents: store.listDocuments(),
    dashboard: store.getDashboard(),
    workspaceRoot,
  }));

  ipcMain.handle('institution:save', (_event, data) => store.saveInstitution(data));
  ipcMain.handle('documents:list', () => store.listDocuments());
  ipcMain.handle('documents:status', (_event, { code, status, notes }) => store.updateDocumentStatus(code, status, notes));
  ipcMain.handle('draft:get', (_event, code) => store.getDraft(code));
  ipcMain.handle('draft:save-section', (_event, { code, sectionKey, content }) => store.saveSection(code, sectionKey, content));

  ipcMain.handle('document:generate-word', async (_event, code) => {
    const draft = store.getDraft(code);
    const institution = store.getInstitution();
    const versionNo = store.getVersions(code).length + 1;
    const filePath = await generateWord({
      workspaceRoot,
      document: draft.document,
      institution,
      sections: draft.sections,
      versionNo,
    });
    const version = store.addVersion(code, filePath, 'generated');
    return { ...version, filePath };
  });

  ipcMain.handle('document:attach', async (_event, code) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Agregar documento o evidencia',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Documentos', extensions: ['docx', 'doc', 'pdf', 'xlsx', 'xls', 'csv', 'png', 'jpg', 'jpeg'] },
        { name: 'Todos los archivos', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePaths.length) return [];

    const targetDir = path.join(workspaceRoot, 'expediente', cleanFileName(code));
    fs.mkdirSync(targetDir, { recursive: true });
    const added = [];

    for (const sourcePath of result.filePaths) {
      const original = path.basename(sourcePath);
      const timestamp = Date.now();
      const targetPath = path.join(targetDir, `${timestamp}_${original}`);
      fs.copyFileSync(sourcePath, targetPath);
      added.push(store.addAttachment(code, original, targetPath, 'evidence'));
    }

    return added;
  });

  ipcMain.handle('document:attachments', (_event, code) => store.getAttachments(code));
  ipcMain.handle('document:versions', (_event, code) => store.getVersions(code));

  ipcMain.handle('file:open', async (_event, filePath) => {
    if (!filePath || !fs.existsSync(filePath)) throw new Error('El archivo no existe en el equipo.');
    const error = await shell.openPath(filePath);
    if (error) throw new Error(error);
    return true;
  });

  ipcMain.handle('folder:open-workspace', async () => {
    await shell.openPath(workspaceRoot);
    return workspaceRoot;
  });

  ipcMain.handle('backup:create', async () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(workspaceRoot, 'backups', `backup_${stamp}`);
    fs.mkdirSync(backupDir, { recursive: true });

    const dbTarget = path.join(backupDir, 'emprende.db');
    fs.copyFileSync(store.dbPath, dbTarget);

    const copyIfExists = (name) => {
      const source = path.join(workspaceRoot, name);
      if (fs.existsSync(source)) fs.cpSync(source, path.join(backupDir, name), { recursive: true });
    };
    copyIfExists('expediente');
    copyIfExists('borradores');

    return backupDir;
  });
}

app.whenReady().then(() => {
  workspaceRoot = path.join(app.getPath('documents'), 'Emprende');
  fs.mkdirSync(workspaceRoot, { recursive: true });
  store = createDatabase(workspaceRoot);
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (store) store.close();
});
