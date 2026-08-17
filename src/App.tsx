import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BarChart3,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  FilePlus2,
  Files,
  FolderOpen,
  HardDriveDownload,
  LayoutDashboard,
  Loader2,
  Save,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';
import type { AppState, DocumentItem, DocumentStatus, DraftSection, Institution } from './types';

type Page = 'dashboard' | 'institution' | 'generator' | 'expediente' | 'reports' | 'settings';

const STATUS_LABELS: Record<DocumentStatus, string> = {
  not_started: 'No iniciado',
  drafting: 'En elaboración',
  review: 'Para revisión',
  observed: 'Observado',
  corrected: 'Corregido',
  internally_validated: 'Validado internamente',
  presented: 'Presentado',
  external_review: 'En revisión externa',
  favorable: 'Favorable',
  unfavorable: 'Desfavorable',
  not_applicable: 'No aplica',
};

const NAV = [
  { id: 'dashboard' as Page, label: 'Inicio', icon: LayoutDashboard },
  { id: 'institution' as Page, label: 'Datos del Instituto', icon: Building2 },
  { id: 'generator' as Page, label: 'Crear documentos', icon: FilePlus2 },
  { id: 'expediente' as Page, label: 'Expediente y progreso', icon: Files },
  { id: 'reports' as Page, label: 'Reportes y respaldos', icon: BarChart3 },
  { id: 'settings' as Page, label: 'Configuración', icon: Settings },
];

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      const next = await window.emprende.getState();
      setState(next);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar la aplicación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return <div className="center-screen"><Loader2 className="spin" size={34} /><span>Preparando Emprende…</span></div>;
  }

  if (!state) {
    return <div className="center-screen error-box">{error || 'No se pudo iniciar Emprende.'}</div>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">E</div>
          <div>
            <strong>Emprende</strong>
            <span>Creación institucional</span>
          </div>
        </div>

        <nav className="nav-list">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} className={page === id ? 'nav-item active' : 'nav-item'} onClick={() => setPage(id)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="mini-progress">
            <div className="mini-progress-head"><span>Expediente</span><strong>{state.dashboard.progress}%</strong></div>
            <div className="progress-track"><div className="progress-bar" style={{ width: `${state.dashboard.progress}%` }} /></div>
          </div>
          <button className="workspace-button" onClick={() => window.emprende.openWorkspace()}>
            <FolderOpen size={16} /> Abrir carpeta local
          </button>
        </div>
      </aside>

      <main className="main-area">
        {error && <div className="alert error-box">{error}</div>}
        {page === 'dashboard' && <DashboardPage state={state} onNavigate={setPage} />}
        {page === 'institution' && <InstitutionPage institution={state.institution} onSaved={refresh} />}
        {page === 'generator' && <GeneratorPage documents={state.documents} institution={state.institution} onChanged={refresh} />}
        {page === 'expediente' && <ExpedientePage documents={state.documents} onChanged={refresh} />}
        {page === 'reports' && <ReportsPage state={state} onChanged={refresh} />}
        {page === 'settings' && <SettingsPage state={state} />}
      </main>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: React.ReactNode }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </header>
  );
}

function DashboardPage({ state, onNavigate }: { state: AppState; onNavigate: (page: Page) => void }) {
  const drafting = (state.dashboard.counts.drafting || 0) + (state.dashboard.counts.review || 0) + (state.dashboard.counts.observed || 0);
  const finished = (state.dashboard.counts.internally_validated || 0) + (state.dashboard.counts.favorable || 0);

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Expediente local"
        title="Panel de creación del Instituto Emprende"
        description="Crea documentos, revisa versiones y controla el avance del expediente desde un mismo lugar."
      />

      <section className="hero-progress card">
        <div>
          <span className="muted">Avance general del expediente</span>
          <div className="hero-number">{state.dashboard.progress}%</div>
          <div className="progress-track large"><div className="progress-bar" style={{ width: `${state.dashboard.progress}%` }} /></div>
        </div>
        <div className="hero-meta">
          <span><strong>{state.dashboard.total}</strong> documentos en catálogo</span>
          <span><strong>{finished}</strong> validados o favorables</span>
          <span><strong>{drafting}</strong> en trabajo o revisión</span>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Documentos" value={state.dashboard.total} note="Catálogo inicial" icon={<Files size={20} />} />
        <StatCard label="Obligatorios" value={state.dashboard.required} note="Según configuración" icon={<BookOpenCheck size={20} />} />
        <StatCard label="Finalizados" value={finished} note="Validados/favorables" icon={<CheckCircle2 size={20} />} />
        <StatCard label="No iniciados" value={state.dashboard.counts.not_started || 0} note="Pendientes de trabajar" icon={<CircleDashed size={20} />} />
      </section>

      <section className="two-column">
        <div className="card quick-card">
          <div className="section-head"><div><h2>Acciones rápidas</h2><p>Continúa por el flujo principal de trabajo.</p></div></div>
          <button className="quick-action" onClick={() => onNavigate('generator')}>
            <div className="quick-icon"><Sparkles size={20} /></div>
            <div><strong>Crear o continuar un documento</strong><span>Trabaja por secciones y genera una versión Word.</span></div>
            <ChevronRight size={18} />
          </button>
          <button className="quick-action" onClick={() => onNavigate('expediente')}>
            <div className="quick-icon"><Archive size={20} /></div>
            <div><strong>Revisar expediente</strong><span>Sube evidencias, cambia estados y controla faltantes.</span></div>
            <ChevronRight size={18} />
          </button>
          <button className="quick-action" onClick={() => onNavigate('institution')}>
            <div className="quick-icon"><Building2 size={20} /></div>
            <div><strong>Completar datos institucionales</strong><span>La información se reutiliza en los documentos.</span></div>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="card">
          <div className="section-head"><div><h2>Actividad reciente</h2><p>Últimos cambios registrados en la base local.</p></div></div>
          <div className="activity-list">
            {state.dashboard.recent.length === 0 && <div className="empty-state">Todavía no hay actividad registrada.</div>}
            {state.dashboard.recent.map((item) => (
              <div className="activity-row" key={item.id}>
                <div className="activity-dot" />
                <div><strong>{activityLabel(item.action)}</strong><span>{item.document_code ? `${item.document_code} · ` : ''}{item.detail}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, note, icon }: { label: string; value: number; note: string; icon: React.ReactNode }) {
  return <div className="card stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>;
}

function InstitutionPage({ institution, onSaved }: { institution: Institution; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<Institution>({ ...institution, careers: [...institution.careers] });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const change = (key: keyof Institution, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const changeCareer = (index: number, value: string) => setForm((prev) => {
    const careers = [...prev.careers];
    careers[index] = value;
    return { ...prev, careers };
  });

  const save = async () => {
    setSaving(true);
    await window.emprende.saveInstitution(form);
    await onSaved();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Base institucional" title="Datos del Instituto" description="Registra una sola vez la información que se reutilizará en todo el expediente." actions={<button className="primary-button" onClick={save} disabled={saving}>{saving ? <Loader2 className="spin" size={17}/> : <Save size={17}/>} {saved ? 'Guardado' : 'Guardar cambios'}</button>} />

      <section className="form-card card">
        <div className="form-grid">
          <Field label="Nombre de la institución"><input value={form.name} onChange={(e) => change('name', e.target.value)} /></Field>
          <Field label="Tipo de institución"><input value={form.type} onChange={(e) => change('type', e.target.value)} /></Field>
          <Field label="Provincia"><input value={form.province} onChange={(e) => change('province', e.target.value)} placeholder="Ej. Pichincha" /></Field>
          <Field label="Cantón"><input value={form.canton} onChange={(e) => change('canton', e.target.value)} placeholder="Ej. Quito" /></Field>
          <Field label="Dirección"><input value={form.address} onChange={(e) => change('address', e.target.value)} /></Field>
          <Field label="Responsable del proyecto"><input value={form.responsible} onChange={(e) => change('responsible', e.target.value)} /></Field>
          <Field label="Tipo de financiamiento"><input value={form.financing} onChange={(e) => change('financing', e.target.value)} /></Field>
          <Field label="Espacio geográfico de influencia"><input value={form.influence_area} onChange={(e) => change('influence_area', e.target.value)} /></Field>
        </div>

        <div className="divider" />
        <h3>Oferta académica inicial</h3>
        <div className="form-grid three">
          {[0,1,2].map((index) => <Field key={index} label={`Carrera ${index + 1}`}><input value={form.careers[index] || ''} onChange={(e) => changeCareer(index, e.target.value)} /></Field>)}
        </div>

        <div className="divider" />
        <div className="form-grid">
          <Field label="Misión"><textarea rows={6} value={form.mission} onChange={(e) => change('mission', e.target.value)} /></Field>
          <Field label="Visión"><textarea rows={6} value={form.vision} onChange={(e) => change('vision', e.target.value)} /></Field>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function GeneratorPage({ documents, institution, onChanged }: { documents: DocumentItem[]; institution: Institution; onChanged: () => Promise<void> }) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('Todos');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [sections, setSections] = useState<DraftSection[]>([]);
  const [draftName, setDraftName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const groups = useMemo(() => ['Todos', ...Array.from(new Set(documents.map((d) => d.group_name)))], [documents]);
  const filtered = useMemo(() => documents.filter((doc) => {
    const hit = `${doc.code} ${doc.name}`.toLowerCase().includes(query.toLowerCase());
    return hit && (group === 'Todos' || doc.group_name === group);
  }), [documents, query, group]);

  const select = async (code: string) => {
    setBusy(true);
    const draft = await window.emprende.getDraft(code);
    setSelectedCode(code);
    setDraftName(draft.document.name);
    setSections(draft.sections);
    setBusy(false);
    setMessage('');
  };

  const saveSection = async (section: DraftSection, content: string) => {
    setSections((prev) => prev.map((item) => item.section_key === section.section_key ? { ...item, content } : item));
    await window.emprende.saveSection({ code: selectedCode!, sectionKey: section.section_key, content });
    await onChanged();
  };

  const generate = async () => {
    if (!selectedCode) return;
    setBusy(true);
    try {
      const result = await window.emprende.generateWord(selectedCode);
      setMessage(`Word generado: versión ${result.versionNo}`);
      await onChanged();
      await window.emprende.openFile(result.filePath);
    } finally {
      setBusy(false);
    }
  };

  if (selectedCode) {
    return (
      <div className="page-wrap">
        <PageHeader
          eyebrow={`${selectedCode} · Generador documental`}
          title={draftName}
          description={`Documento de trabajo para ${institution.name}. Edita por secciones y genera una versión Word cuando esté listo para revisión.`}
          actions={<div className="button-row"><button className="secondary-button" onClick={() => setSelectedCode(null)}>Volver al catálogo</button><button className="primary-button" onClick={generate} disabled={busy}>{busy ? <Loader2 className="spin" size={17}/> : <FilePlus2 size={17}/>} Generar Word</button></div>}
        />
        <div className="ai-note"><Sparkles size={18}/><div><strong>Flujo híbrido preparado</strong><span>La estructura está controlada por la app. En esta primera versión puedes redactar y revisar manualmente; el proveedor de IA se conectará después sin cambiar el formato del expediente.</span></div></div>
        {message && <div className="alert success-box">{message}</div>}
        <section className="editor-stack">
          {sections.map((section, index) => (
            <article className="card editor-card" key={section.section_key}>
              <div className="editor-title"><span>{String(index + 1).padStart(2, '0')}</span><h3>{section.title}</h3><small>{section.content.trim() ? 'Con contenido' : 'Pendiente'}</small></div>
              <textarea
                rows={Math.max(7, Math.min(16, section.content.split('\n').length + 5))}
                value={section.content}
                placeholder={`Desarrolla aquí: ${section.title}`}
                onChange={(e) => setSections((prev) => prev.map((item) => item.section_key === section.section_key ? { ...item, content: e.target.value } : item))}
                onBlur={(e) => saveSection(section, e.target.value)}
              />
            </article>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Generador documental" title="Crear documentos" description="Catálogo inicial de 39 documentos. Selecciona uno para trabajar su contenido por secciones." />
      <div className="toolbar card">
        <div className="search-box"><Search size={17}/><input placeholder="Buscar documento…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <select value={group} onChange={(e) => setGroup(e.target.value)}>{groups.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <section className="document-grid">
        {filtered.map((doc) => (
          <button className="document-card card" key={doc.code} onClick={() => select(doc.code)}>
            <div className="document-card-top"><span className="code-badge">{doc.code}</span><StatusPill status={doc.status} /></div>
            <h3>{doc.name}</h3>
            <p>{doc.group_name}</p>
            <div className="document-card-footer"><span>{doc.version_count} versiones</span><span>{doc.attachment_count} anexos</span><ChevronRight size={17}/></div>
          </button>
        ))}
      </section>
    </div>
  );
}

function ExpedientePage({ documents, onChanged }: { documents: DocumentItem[]; onChanged: () => Promise<void> }) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('Todos');
  const [working, setWorking] = useState('');
  const groups = useMemo(() => ['Todos', ...Array.from(new Set(documents.map((d) => d.group_name)))], [documents]);
  const filtered = documents.filter((doc) => (`${doc.code} ${doc.name}`.toLowerCase().includes(query.toLowerCase())) && (group === 'Todos' || doc.group_name === group));

  const changeStatus = async (doc: DocumentItem, status: DocumentStatus) => {
    setWorking(doc.code);
    await window.emprende.updateDocumentStatus({ code: doc.code, status, notes: doc.notes });
    await onChanged();
    setWorking('');
  };

  const attach = async (code: string) => {
    setWorking(code);
    await window.emprende.attachFiles(code);
    await onChanged();
    setWorking('');
  };

  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Gestión documental" title="Expediente y progreso" description="Esta sección es independiente del generador: aquí se controla el archivo real, sus evidencias y el estado de cada documento." />
      <div className="toolbar card">
        <div className="search-box"><Search size={17}/><input placeholder="Buscar en el expediente…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <select value={group} onChange={(e) => setGroup(e.target.value)}>{groups.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <div className="table-card card">
        <div className="document-table head"><span>Documento</span><span>Estado</span><span>Avance</span><span>Archivos</span><span>Acciones</span></div>
        {filtered.map((doc) => (
          <div className="document-table" key={doc.code}>
            <div className="doc-main"><span className="code-badge">{doc.code}</span><div><strong>{doc.name}</strong><small>{doc.group_name}</small></div></div>
            <div>
              <select className="status-select" value={doc.status} onChange={(e) => changeStatus(doc, e.target.value as DocumentStatus)} disabled={working === doc.code}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </div>
            <div className="row-progress"><span>{doc.progress}%</span><div className="progress-track"><div className="progress-bar" style={{ width: `${doc.progress}%` }} /></div></div>
            <div className="file-counts"><span>{doc.version_count} versiones</span><span>{doc.attachment_count} anexos</span></div>
            <div className="row-actions">
              <button className="icon-text-button" onClick={() => attach(doc.code)} disabled={working === doc.code}>{working === doc.code ? <Loader2 className="spin" size={15}/> : <FilePlus2 size={15}/>} Agregar</button>
              {doc.latest_file && <button className="icon-button" title="Abrir última versión" onClick={() => window.emprende.openFile(doc.latest_file!)}><FolderOpen size={16}/></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsPage({ state, onChanged }: { state: AppState; onChanged: () => Promise<void> }) {
  const [backupPath, setBackupPath] = useState('');
  const [busy, setBusy] = useState(false);
  const grouped = useMemo(() => {
    const map = new Map<string, DocumentItem[]>();
    state.documents.forEach((doc) => map.set(doc.group_name, [...(map.get(doc.group_name) || []), doc]));
    return [...map.entries()];
  }, [state.documents]);

  const backup = async () => {
    setBusy(true);
    const path = await window.emprende.createBackup();
    setBackupPath(path);
    await onChanged();
    setBusy(false);
  };

  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Control local" title="Reportes y respaldos" description="Revisa el avance por bloque y crea copias locales del expediente y de la base de datos." actions={<button className="primary-button" onClick={backup} disabled={busy}>{busy ? <Loader2 className="spin" size={17}/> : <HardDriveDownload size={17}/>} Crear respaldo local</button>} />
      {backupPath && <div className="alert success-box">Respaldo creado en: {backupPath}</div>}
      <section className="group-report-grid">
        {grouped.map(([name, docs]) => {
          const applicable = docs.filter((d) => d.status !== 'not_applicable');
          const progress = applicable.length ? Math.round(applicable.reduce((sum, d) => sum + d.progress, 0) / applicable.length) : 100;
          return <div className="card group-report" key={name}><div><strong>{name}</strong><span>{docs.length} documentos</span></div><div className="group-number">{progress}%</div><div className="progress-track"><div className="progress-bar" style={{ width: `${progress}%` }} /></div></div>;
        })}
      </section>
    </div>
  );
}

function SettingsPage({ state }: { state: AppState }) {
  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Configuración" title="Ajustes de la aplicación" description="La primera versión trabaja completamente con almacenamiento local." />
      <section className="settings-grid">
        <div className="card setting-card"><HardDriveDownload size={22}/><div><strong>Espacio de trabajo local</strong><span>{state.workspaceRoot}</span></div><button className="secondary-button" onClick={() => window.emprende.openWorkspace()}>Abrir carpeta</button></div>
        <div className="card setting-card"><Sparkles size={22}/><div><strong>Proveedor de IA</strong><span>Preparado para una fase posterior. No hay claves ni proveedor configurados en esta versión.</span></div><span className="status-neutral">Pendiente</span></div>
        <div className="card setting-card"><Archive size={22}/><div><strong>Sincronización en nube</strong><span>La arquitectura local queda separada para poder incorporar Supabase o Firebase más adelante.</span></div><span className="status-neutral">Pendiente</span></div>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: DocumentStatus }) {
  return <span className={`status-pill status-${status}`}>{STATUS_LABELS[status]}</span>;
}

function activityLabel(action: string) {
  const labels: Record<string, string> = {
    institution_saved: 'Datos institucionales guardados',
    status_changed: 'Estado actualizado',
    section_saved: 'Sección guardada',
    version_added: 'Nueva versión generada',
    attachment_added: 'Archivo agregado',
  };
  return labels[action] || 'Actividad registrada';
}

export default App;
