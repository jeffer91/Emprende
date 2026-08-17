import type { AppState, Institution, DocumentStatus } from './types';

declare global {
  interface Window {
    emprende: {
      getState: () => Promise<AppState>;
      saveInstitution: (data: Institution) => Promise<Institution>;
      listDocuments: () => Promise<AppState['documents']>;
      updateDocumentStatus: (payload: { code: string; status: DocumentStatus; notes?: string }) => Promise<unknown>;
      getDraft: (code: string) => Promise<{ document: AppState['documents'][number]; sections: Array<{ id: number; section_key: string; title: string; content: string; sort_order: number }> }>;
      saveSection: (payload: { code: string; sectionKey: string; content: string }) => Promise<unknown>;
      generateWord: (code: string) => Promise<{ versionNo: number; filePath: string }>;
      attachFiles: (code: string) => Promise<Array<unknown>>;
      getAttachments: (code: string) => Promise<Array<{ id: number; file_name: string; file_path: string; kind: string; created_at: string }>>;
      getVersions: (code: string) => Promise<Array<{ id: number; version_no: number; file_path: string; source: string; created_at: string }>>;
      openFile: (filePath: string) => Promise<boolean>;
      openWorkspace: () => Promise<string>;
      createBackup: () => Promise<string>;
    };
  }
}

export {};
