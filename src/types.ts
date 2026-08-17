export type DocumentStatus =
  | 'not_started'
  | 'drafting'
  | 'review'
  | 'observed'
  | 'corrected'
  | 'internally_validated'
  | 'presented'
  | 'external_review'
  | 'favorable'
  | 'unfavorable'
  | 'not_applicable';

export interface Institution {
  id?: number;
  name: string;
  type: string;
  province: string;
  canton: string;
  address: string;
  responsible: string;
  financing: string;
  influence_area: string;
  mission: string;
  vision: string;
  careers: string[];
}

export interface DocumentItem {
  code: string;
  name: string;
  group_name: string;
  required: number;
  generatable: number;
  status: DocumentStatus;
  progress: number;
  notes: string;
  version_count: number;
  attachment_count: number;
  latest_file?: string | null;
}

export interface DraftSection {
  id: number;
  section_key: string;
  title: string;
  content: string;
  sort_order: number;
}

export interface Dashboard {
  progress: number;
  total: number;
  required: number;
  completed: number;
  counts: Record<string, number>;
  recent: Array<{ id: number; action: string; document_code?: string; detail: string; created_at: string }>;
}

export interface AppState {
  institution: Institution;
  documents: DocumentItem[];
  dashboard: Dashboard;
  workspaceRoot: string;
}
