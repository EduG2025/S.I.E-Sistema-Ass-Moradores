import React from 'react';

/**
 * S.I.E NUCLEUS - GLOBAL TYPE DEFINITIONS
 * Version: 2.6.0 - Full SRE Operational Sync (DocumentHub & RAG Enhanced)
 */

// --- ENUMS NUCLEARES ---

export enum UserRole {
  ADMIN = 'ADMIN',
  PRESIDENT = 'PRESIDENT',
  VICE_PRESIDENT = 'VICE_PRESIDENT',
  SECRETARY = 'SECRETARY',
  TREASURER = 'TREASURER',
  SERVICE = 'SERVICE',
  RESIDENT = 'RESIDENT',
  VISITOR = 'VISITOR',
  COUNCIL = 'COUNCIL'
}

export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'BLOCKED' | 'ARCHIVED';
export type ResidentType = 'TITULAR' | 'DEPENDENTE' | 'INQUILINO' | 'RESPONSAVEL' | 'OCUPANTE';
export type PreferredChannel = 'WHATSAPP' | 'EMAIL' | 'APP' | 'SMS';
export type FinancialStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'PARTIAL';
export type ProjectStatus = 'PLANNING' | 'EM_EXECUÇÃO' | 'CONCLUÍDO' | 'CANCELADO';

export type IncidentPriority = 'INFORMATIVO (NÍVEL 1)' | 'ATENÇÃO (NÍVEL 2)' | 'ALTA (NÍVEL 3 - ALERTA LOCAL)' | 'CRÍTICA (NÍVEL 4 - PÂNICO EM RAIO)';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type DocumentType = 'OFICIO' | 'ATA' | 'EDITAL' | 'CONTRATO' | 'RELATÓRIO';

// Categorias de Prompt para o Ghostwriter (IA)
export type PromptCategory = 'JURIDICO' | 'ADM' | 'FINANCEIRO' | 'GERAL' | 'TURISMO' | 'OBRAS' | 'SAÚDE' | 'EDUCAÇÃO';

// Status de Documento (Workflow)
export type DocStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SIGNED' | 'SENT' | 'ARCHIVED';

// --- INTERFACES DE CONFIGURAÇÃO ---

export interface ResidentUISetting {
  id: string;
  label: string;
  enabled: boolean;
  icon: string;
  detail: string;
}

export interface WhatsAppConfig {
  api_key: string;
  sender: string;
  footer: string;
  gateway_url?: string;
  webhook_url?: string;
  billing_reminder_2d?: boolean;
  billing_reminder_1d?: boolean;
  late_reminder?: boolean;
  welcome_msg?: boolean;
}

export interface SystemSettings {
  cnpj?: string;
  phone?: string;
  logoUrl?: string;
  president_name?: string;
  president_signature?: string;
  email?: string;
  website?: string;
  context_rules?: string;
  [key: string]: any;
}

export interface SystemInfo {
  id?: number;
  name: string;
  shortName?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  website?: string;
  primaryColor?: string;
  logoUrl?: string;
  registrationMode?: 'OPEN' | 'APPROVAL' | 'INVITE_ONLY';
  resident_ui_settings?: ResidentUISetting[];
  whatsapp_config?: WhatsAppConfig;
  coordinates?: { lat: number; lng: number };
  president_name?: string;
  president_cpf?: string;
  management_start?: string;
  management_end?: string;
  president_signature?: string;
  settings?: SystemSettings;
  context_rules?: string;
  module_metadata?: Record<string, any>;
  // SRE FIX: Added missing 'address' property to match usage in constants.tsx
  address?: string;

  // CAMPOS ATÔMICOS DE ENDEREÇO DA SEDE
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

// --- IDENTIDADE & SOCIAL ---

export interface TerritorialUnit {
  id: string | number;
  label: string;
  street_name?: string;
  is_available?: boolean;
  occupant_id?: number;
  coordinates?: { lat: number; lng: number };
}

export interface SurveyResponse {
  id: string | number;
  survey_id: string | number;
  user_id: string | number;
  cpf: string;
  user_name: string;
  answers: any;
  created_at?: string;
}

export interface TacticalAnalysis {
  user_id: string | number;
  risk_score: number;
  vulnerability_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predictions: string[];
  recommended_actions: string[];
  last_ai_update: string;
}

export interface SocialData {
  risk: number;
  tags: string[];
  income_range?: string;
  household_size?: number;
  vulnerabilities?: string[];
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'repeater' | string;
  options?: string[];
  required?: number | boolean;
  mapping_tag?: string;
}

export interface Survey {
  id: string | number;
  title: string;
  description: string;
  type: string;
  status: string;
  questions: SurveyQuestion[];
  created_at?: string;
}

export interface AgendaEvent {
  id: string | number;
  title: string;
  description: string;
  date: string;
  type: 'MEETING' | 'MAINTENANCE' | 'DEADLINE' | 'EVENT' | string;
  status: 'UPCOMING' | 'COMPLETED' | string;
  location?: string;
  created_at?: string;
}

export interface CommunityProject {
  id: string | number;
  title: string;
  description: string;
  budget: number | string;
  spent: number | string;
  progress: number;
  startDate: string;
  category: string;
  status: ProjectStatus | string;
  created_at?: string;
}

export interface Asset {
  id: string | number;
  name: string;
  category: string;
  value: number | string;
  status: string;
  date_acquired: string;
  responsible_id?: string | number;
  created_at?: string;
}

export interface User {
  id: string | number;
  name: string;
  cpf_cnpj: string;
  username: string;
  email?: string;
  password_hash?: string;
  role: UserRole | string;
  status: UserStatus;
  active: boolean | number;
  unit?: string;
  age?: number;
  birth_date?: string;
  rg?: string;
  issuing_authority?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT-TO-SAY';
  nationality?: string;
  phone?: string;
  whatsapp?: string;
  preferred_channel?: PreferredChannel;
  avatar_url?: string;
  document_front_url?: string;
  document_back_url?: string;
  ocr_payload?: any;
  coordinates?: { lat: number; lng: number };
  profession?: string;
  voting_rights?: boolean | number;
  resident_type?: ResidentType;
  parent_id?: number | string;
  last_login?: string;
  created_by?: string | number;
  created_at?: string;
  updated_at?: string;
  socialData?: SocialData;
  // SRE FIX: Added missing 'address' property to match usage in UserModal.tsx
  address?: string;

  // CAMPOS ATÔMICOS DE ENDEREÇO DO USUÁRIO
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

// --- INFRAESTRUTURA IA ---

export interface AIKey {
  id: number;
  label: string;
  key_value: string;
  provider: 'GOOGLE' | 'OPENAI' | string;
  model: string;
  tier: 'FREE' | 'PAID' | string;
  status: 'ACTIVE' | 'INACTIVE';
  priority: number;
  error_count: number;
  last_checked: string;
  created_at: string;
}

export interface AIPromptTemplate {
  id: string | number;
  title: string;
  content: string;
  category: PromptCategory | string;
  is_favorite?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

// --- GOVERNANÇA & DOCUMENTOS ---

export interface AssemblyTopic {
  id: number | string;
  title: string;
  votes: {
    yes: number;
    no: number;
    abstain: number;
  };
}

export interface Assembly {
  id: string | number;
  title: string;
  description: string;
  date: string;
  status: 'SCHEDULED' | 'FINISHED' | string;
  topics: AssemblyTopic[] | string;
  ata_content?: string;
  created_at?: string;
}

export interface OfficialDocument {
  id: string | number;
  title: string;
  content: string;
  type: DocumentType | string;
  status: DocStatus | string;
  created_at?: string;
  updated_at: string;
  created_by?: string | number;
}

export interface DocumentVersion {
  id: string | number;
  document_id: string | number;
  content: string;
  created_at: string;
  created_by: string;
  reason?: string;
}

// --- OPERACIONAL & SEGURANÇA ---

export interface Incident {
  id: string | number;
  title: string;
  location: string;
  priority: string;
  status: IncidentStatus | string;
  description: string;
  radius: number;
  coordinates?: { lat: number; lng: number };
  reporter_name?: string;
  created_at?: string;
}

export interface CameraDevice {
  id: string | number;
  name: string;
  url: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  created_at?: string;
}

export interface Visitor {
  id: string | number;
  name: string;
  document?: string;
  unit: string;
  phone?: string;
  status: 'IN_CLUSTER' | 'COMPLETED' | string;
  arrival_time: string;
  created_at?: string;
}

export interface Delivery {
  id: string | number;
  courier?: string;
  company?: string;
  unit: string;
  recipient: string;
  status: 'PENDING' | 'PICKED_UP' | string;
  arrival_time: string;
  created_at?: string;
}

// --- SUSTENTABILIDADE & BI ---

export interface ConsumptionData {
  date: string;
  value: number;
}

export interface SustainabilityStats {
  energy: ConsumptionData[];
  water: ConsumptionData[];
  waste: Array<{ name: string; value: number; color: string }>;
}

// --- COMUNIDADE ---

export interface MarketItem {
  id: string | number;
  merchant_id?: string | number;
  title: string;
  description: string;
  price: number | string;
  category: 'GOODS' | 'FOOD' | 'SERVICE' | string;
  whatsapp: string;
  created_at?: string;
  updated_at?: string;
}

export interface Reservation {
  id: string | number;
  user_id: string | number;
  area_name: string;
  date: string;
  startTime: string;
  endTime: string;
  userName?: string;
  created_at?: string;
}

export interface Notice {
  id: string | number;
  title: string;
  content: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  date: string;
  created_at?: string;
}

export interface Suggestion {
  id: string | number;
  user_id?: string | number;
  userName?: string;
  title: string;
  content: string;
  category: 'SUGGESTION' | 'COMPLAINT' | 'PRAISE' | 'OTHERS' | string;
  status: 'OPEN' | 'RESOLVED' | string;
  created_at?: string;
}

// --- FINANCEIRO ---

export interface FinancialRecord {
  id: string | number;
  user_id?: string | number;
  description: string;
  amount: number | string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  status: FinancialStatus | string;
  date: string;
  next_due_date?: string;
  is_recurring?: number | boolean;
  billing_cycle?: string;
}

// --- MENSAGERIA ---

export interface MessageTemplate {
  id: string | number;
  event_trigger: string;
  name: string;
  content: string;
  is_active: boolean | number;
  attach_logo: boolean | number; // SRE V15: Flag para anexar logotipo do sistema
  variables_available?: string[] | string;
  created_at?: string;
  // --- CORREÇÕES V18 (Para satisfazer MessengerBridge.tsx) ---
  media_url?: string; // Adicionado para resolver erros de 'media_url'
  media_type?: 'IMAGE' | 'VIDEO' | 'FILE' | string; // Adicionado para resolver erros de 'media_type'
}

// --- DESIGN DE IDENTIDADES (STUDIO) ---

export interface CardElement {
  id: string;
  type: 'text-static' | 'text-dynamic' | 'image' | 'shape' | 'qrcode';
  field?: string;
  value?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  style: React.CSSProperties;
}

// --- AUDITORIA & SISTEMA ---

export interface AuditLog {
  id: string | number;
  action: string;
  user_id?: string | number;
  table_name: string;
  record_id?: string | number;
  details?: string;
  created_at: string;
}

export interface ScheduledBroadcast {
  id: string | number;
  user_id?: string | number;
  target_type: 'ROLE' | 'USER' | 'DIRECT' | string;
  target_value: string;
  message_body: string;
  template_id?: number;
  scheduled_at: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}