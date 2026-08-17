const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { DOCUMENT_CATALOG, getTemplate } = require('./catalog.cjs');

const STATUS_PROGRESS = {
  not_started: 0,
  drafting: 30,
  review: 55,
  observed: 55,
  corrected: 70,
  internally_validated: 85,
  presented: 95,
  external_review: 95,
  favorable: 100,
  unfavorable: 100,
  not_applicable: 100,
};

function createDatabase(workspaceRoot) {
  const dataDir = path.join(workspaceRoot, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(path.join(workspaceRoot, 'expediente'), { recursive: true });
  fs.mkdirSync(path.join(workspaceRoot, 'borradores'), { recursive: true });
  fs.mkdirSync(path.join(workspaceRoot, 'backups'), { recursive: true });

  const dbPath = path.join(dataDir, 'emprende.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS institution (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL DEFAULT 'Instituto Emprende',
      type TEXT NOT NULL DEFAULT 'Instituto Superior Particular',
      province TEXT DEFAULT '',
      canton TEXT DEFAULT '',
      address TEXT DEFAULT '',
      responsible TEXT DEFAULT '',
      financing TEXT DEFAULT 'Particular',
      influence_area TEXT DEFAULT '',
      mission TEXT DEFAULT '',
      vision TEXT DEFAULT '',
      careers_json TEXT DEFAULT '["","",""]',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      group_name TEXT NOT NULL,
      required INTEGER NOT NULL DEFAULT 1,
      generatable INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'not_started',
      progress INTEGER NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS document_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_code TEXT NOT NULL,
      section_key TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      sort_order INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(document_code, section_key),
      FOREIGN KEY(document_code) REFERENCES documents(code) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_code TEXT NOT NULL,
      version_no INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'generated',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(document_code) REFERENCES documents(code) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_code TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'evidence',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(document_code) REFERENCES documents(code) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      document_code TEXT,
      detail TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.prepare(`INSERT OR IGNORE INTO institution (id) VALUES (1)`).run();

  const insertDocument = db.prepare(`
    INSERT OR IGNORE INTO documents (code, name, group_name, required, generatable)
    VALUES (@code, @name, @group, @required, @generatable)
  `);
  const seed = db.transaction(() => DOCUMENT_CATALOG.forEach((doc) => insertDocument.run(doc)));
  seed();

  function parseInstitution(row) {
    return { ...row, careers: JSON.parse(row.careers_json || '["","",""]') };
  }

  function getInstitution() {
    return parseInstitution(db.prepare('SELECT * FROM institution WHERE id = 1').get());
  }

  function saveInstitution(data) {
    const careers = Array.isArray(data.careers) ? data.careers.slice(0, 3) : ['', '', ''];
    while (careers.length < 3) careers.push('');
    db.prepare(`
      UPDATE institution SET
        name = @name,
        type = @type,
        province = @province,
        canton = @canton,
        address = @address,
        responsible = @responsible,
        financing = @financing,
        influence_area = @influence_area,
        mission = @mission,
        vision = @vision,
        careers_json = @careers_json,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run({
      name: data.name || 'Instituto Emprende',
      type: data.type || 'Instituto Superior Particular',
      province: data.province || '',
      canton: data.canton || '',
      address: data.address || '',
      responsible: data.responsible || '',
      financing: data.financing || 'Particular',
      influence_area: data.influence_area || '',
      mission: data.mission || '',
      vision: data.vision || '',
      careers_json: JSON.stringify(careers),
    });
    log('institution_saved', null, 'Datos institucionales actualizados');
    return getInstitution();
  }

  function listDocuments() {
    return db.prepare(`
      SELECT d.*,
        (SELECT COUNT(*) FROM document_versions v WHERE v.document_code = d.code) AS version_count,
        (SELECT COUNT(*) FROM attachments a WHERE a.document_code = d.code) AS attachment_count,
        (SELECT file_path FROM document_versions v WHERE v.document_code = d.code ORDER BY version_no DESC LIMIT 1) AS latest_file
      FROM documents d
      ORDER BY group_name, code
    `).all();
  }

  function updateDocumentStatus(code, status, notes = '') {
    if (!(status in STATUS_PROGRESS)) throw new Error('Estado no válido');
    db.prepare(`
      UPDATE documents SET status = ?, progress = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE code = ?
    `).run(status, STATUS_PROGRESS[status], notes || '', code);
    log('status_changed', code, status);
    return db.prepare('SELECT * FROM documents WHERE code = ?').get(code);
  }

  function ensureSections(code) {
    const exists = db.prepare('SELECT COUNT(*) AS n FROM document_sections WHERE document_code = ?').get(code).n;
    if (exists) return;
    const titles = getTemplate(code);
    const insert = db.prepare(`
      INSERT INTO document_sections (document_code, section_key, title, content, sort_order)
      VALUES (?, ?, ?, '', ?)
    `);
    const tx = db.transaction(() => {
      titles.forEach((title, index) => insert.run(code, `section_${String(index + 1).padStart(2, '0')}`, title, index + 1));
    });
    tx();
  }

  function getDraft(code) {
    ensureSections(code);
    const document = db.prepare('SELECT * FROM documents WHERE code = ?').get(code);
    if (!document) throw new Error('Documento no encontrado');
    const sections = db.prepare(`SELECT id, section_key, title, content, sort_order FROM document_sections WHERE document_code = ? ORDER BY sort_order`).all(code);
    return { document, sections };
  }

  function saveSection(code, sectionKey, content) {
    ensureSections(code);
    db.prepare(`
      UPDATE document_sections SET content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE document_code = ? AND section_key = ?
    `).run(content || '', code, sectionKey);
    const current = db.prepare('SELECT status FROM documents WHERE code = ?').get(code);
    if (current && current.status === 'not_started') {
      db.prepare(`UPDATE documents SET status = 'drafting', progress = 30, updated_at = CURRENT_TIMESTAMP WHERE code = ?`).run(code);
    }
    log('section_saved', code, sectionKey);
    return getDraft(code);
  }

  function nextVersion(code) {
    const row = db.prepare('SELECT COALESCE(MAX(version_no), 0) + 1 AS next FROM document_versions WHERE document_code = ?').get(code);
    return row.next;
  }

  function addVersion(code, filePath, source = 'generated') {
    const versionNo = nextVersion(code);
    db.prepare(`INSERT INTO document_versions (document_code, version_no, file_path, source) VALUES (?, ?, ?, ?)`).run(code, versionNo, filePath, source);
    log('version_added', code, `v${versionNo}: ${filePath}`);
    return { versionNo, filePath };
  }

  function addAttachment(code, fileName, filePath, kind = 'evidence') {
    const result = db.prepare(`INSERT INTO attachments (document_code, file_name, file_path, kind) VALUES (?, ?, ?, ?)`).run(code, fileName, filePath, kind);
    log('attachment_added', code, fileName);
    return { id: Number(result.lastInsertRowid), document_code: code, file_name: fileName, file_path: filePath, kind };
  }

  function getAttachments(code) {
    return db.prepare('SELECT * FROM attachments WHERE document_code = ? ORDER BY created_at DESC').all(code);
  }

  function getVersions(code) {
    return db.prepare('SELECT * FROM document_versions WHERE document_code = ? ORDER BY version_no DESC').all(code);
  }

  function log(action, documentCode, detail) {
    db.prepare('INSERT INTO activity (action, document_code, detail) VALUES (?, ?, ?)').run(action, documentCode, detail || '');
  }

  function getDashboard() {
    const documents = listDocuments();
    const applicable = documents.filter((d) => d.status !== 'not_applicable');
    const required = applicable.filter((d) => d.required === 1);
    const avg = required.length ? Math.round(required.reduce((sum, d) => sum + d.progress, 0) / required.length) : 0;
    const counts = documents.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {});
    return {
      progress: avg,
      total: documents.length,
      required: required.length,
      completed: documents.filter((d) => d.status === 'favorable' || d.status === 'internally_validated').length,
      counts,
      recent: db.prepare('SELECT * FROM activity ORDER BY created_at DESC LIMIT 8').all(),
    };
  }

  function close() {
    db.close();
  }

  return {
    dbPath,
    workspaceRoot,
    getInstitution,
    saveInstitution,
    listDocuments,
    updateDocumentStatus,
    getDraft,
    saveSection,
    addVersion,
    addAttachment,
    getAttachments,
    getVersions,
    getDashboard,
    close,
  };
}

module.exports = { createDatabase, STATUS_PROGRESS };
