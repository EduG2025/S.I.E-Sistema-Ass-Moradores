import React from 'react';

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

export interface SystemInfo {
  id?: number;
  name: string;
  shortName?: string; 
  cnpj?: string;
  address?: string;
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
  module_metadata?: Record<string, { 
    title?: string; 
    slogan?: string;
    greeting?: string;
    unit_label?: string;
    badge_label?: string;
    key_btn?: string;
    ouvidoria_btn?: string;
    balance_label?: string;
    balance_cta?: string;
    agenda_label?: string;
    agenda_cta?: string;
    access_label?: string;
    access_cta?: string;
    mural_title?: string;
    advisor_title?: string;
    advisor_slogan?: string;
    advisor_cta?: string;
    audit_label?: string;
    audit_slogan?: string;
    boot_text?: string;
    sync_text?: string;
    handshake_label?: string;
    logout_label?: string;
    placeholder?: string;
    residents_label?: string;
    tactical_label?: string;
    heatmap_label?: string;
    incident_label?: string;
    doc_label?: string;
    risk_label?: string;
    dossier_btn?: string;
    loading_text?: string;
    concierge_label?: string;
    finance_label?: string;
    deliveries_label?: string;
    watchdog_label?: string;
    hero_badge?: string;
    members_stat_label?: string;
    finance_stat_label?: string;
    alerts_stat_label?: string;
    advisor_btn?: string;
    analytics_btn?: string;
    map_btn?: string;
    sanitary_label?: string;
    occupancy_label?: string;
    sync_label?: string;
    stats_label?: string;
    map_label?: string;
  }>;
}

// --- IDENTIDADE & SOCIAL ---

export interface SocialData {
  risk: number;
  tags: string[];
  income_range?: string;
  household_size?: number;
  vulnerabilities?: string[];
}

export interface User {
  id: string | number;
  name: string; 
  cpf_cnpj: string;
  rg?: string;
  issuing_authority?: string;
  birth_date?: string; 
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  nationality?: string;
  age?: number;
  avatar_url?: string; 
  unit?: string; 
  resident_type?: ResidentType;
  role: UserRole | string; 
  voting_rights?: boolean | number;
  status: UserStatus;
  active: boolean | number;
  socialData?: SocialData;
  username: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  preferred_channel?: PreferredChannel;
  coordinates?: { lat: number; lng: number };
  address?: string;
  profession?: string;
  created_at?: string;
  updated_at?: string;
}

// --- INFRAESTRUTURA IA ---

export interface AIKey {
  id: string | number;
  label: string;
  key_value: string;
  provider: string;
  model: string;
  tier: string;
  status: string;
  priority: number;
  error_count: number;
  last_checked?: string;
}

// --- OUTROS MÓDULOS ---

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'repeater' | string;
  options?: string[];
  required: number | boolean;
  mapping_tag: string;
}

export interface Survey {
  id: string | number;
  title: string;
  description: string;
  type: 'CENSUS' | 'SOCIAL_AID' | 'SATISFACTION' | string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  questions: SurveyQuestion[];
  created_at?: string;
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

export interface AgendaEvent {
  id: string | number;
  title: string;
  description: string;
  date: string;
  type: 'MEETING' | 'MAINTENANCE' | 'DEADLINE' | 'EVENT' | string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | string;
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
  category: 'INFRA' | 'LANDMARK' | string;
  status: ProjectStatus | string;
  created_at?: string;
}

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

export interface CameraDevice {
  id: string | number;
  name: string;
  url: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
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

export interface OfficialDocument {
  id: string | number;
  title: string;
  content: string;
  type: DocumentType | string;
  status: 'DRAFT' | 'SIGNED' | 'ARCHIVED' | string;
  updated_at: string;
}

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

export interface Notice {
  id: string | number;
  title: string;
  content: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  date: string;
  created_at?: string;
}

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