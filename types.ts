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
  VISITOR = 'VISITOR'
}

export type UserStatus = 'ACTIVE' | 'PENDING' | 'BANNED' | 'VALIDATION_REQUIRED';
export type FinancialStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'PARTIAL';
export type ProjectStatus = 'PLANNING' | 'EM_EXECUÇÃO' | 'CONCLUÍDO' | 'CANCELADO';
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
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
  welcome_template?: string;
  default_password?: string;
  webhook_url?: string;
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
  // SRE: Coordenada central do cluster
  coordinates?: { lat: number; lng: number };
  // SRE: Representação Legal
  president_name?: string;
  president_cpf?: string;
  management_start?: string;
  management_end?: string;
  president_signature?: string;
}

export interface IdCardTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  frontBackground: string;
  backBackground: string;
  elements: any[];
}

// --- IDENTIDADE & SOCIAL ---

export interface SocialData {
  risk: number;
  tags: string[];
  income_range?: string;
  household_size?: number;
  vulnerabilities?: string[];
  last_census_date?: string;
  ai_notes?: string;
  nis_number?: string;
}

export interface User {
  id: string | number;
  name: string;
  username: string;
  unit?: string;
  role: UserRole | string;
  status: UserStatus;
  active: boolean | number;
  cpf_cnpj: string;
  rg?: string;
  issuing_authority?: string;
  age?: number;
  email?: string;
  phone?: string;
  avatar_url?: string;
  socialData?: SocialData;
  coordinates?: { lat: number; lng: number };
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

// --- OPERACIONAL & COMUNIDADE ---

export interface Incident {
  id: string | number;
  title: string;
  location: string;
  priority: IncidentPriority | string;
  status: IncidentStatus | string;
  description: string;
  coordinates?: { lat: number; lng: number };
}

export interface FinancialRecord {
  id: string | number;
  user_id?: string | number;
  userName?: string;
  description: string;
  amount: number | string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  status: FinancialStatus | string;
  date: string;
  next_due_date?: string;
  is_recurring?: boolean | number;
}

export interface OfficialDocument {
  id: string | number;
  title: string;
  content: string;
  type: DocumentType | string;
  status: 'DRAFT' | 'FINAL' | 'ARCHIVED' | string;
  updated_at: string;
}

export interface MarketItem {
  id: string | number;
  merchant_id?: string | number;
  title: string;
  description: string;
  category: 'FOOD' | 'SERVICE' | 'GOODS' | string;
  price: number | string;
  whatsapp: string;
}

export interface ScheduledBroadcast {
  id: string | number;
  user_id: number;
  target_type: 'ROLE' | 'USER' | 'DIRECT' | string;
  target_value: string;
  message_body: string;
  scheduled_at: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
}

export interface UnitData {
  id: string | number;
  residentName: string;
  cpf: string;
  unit: string;
  address: string;
  phone: string;
  age: number;
  coordinates: { lat: number; lng: number };
  tags: string[];
  role: string;
  socialData?: any;
}

// --- PROTOCOLO ADITIVO SRE V7.0 ---

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'repeater' | string;
  options?: string[];
  required: number | boolean;
  mapping_tag?: string;
  logic?: {
    show_if_question: string;
    show_if_value: any;
  };
  repeater_fields?: any[];
}

export interface Survey {
  id: string | number;
  title: string;
  description: string;
  type: 'CENSUS' | 'SOCIAL_AID' | 'SATISFACTION' | string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  questions: SurveyQuestion[];
}

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

export interface AgendaEvent {
  id: string | number;
  title: string;
  description: string;
  date: string;
  type: 'MEETING' | 'MAINTENANCE' | 'DEADLINE' | string;
  status: 'UPCOMING' | 'FINISHED' | string;
  location?: string;
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
  status: 'PLANNING' | 'EM_EXECUÇÃO' | 'CONCLUÍDO' | 'CANCELADO' | string;
}

export interface CameraDevice {
  id: string | number;
  name: string;
  url: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
}

export interface Asset {
  id: string | number;
  name: string;
  category: string;
  value: number | string;
  status: string;
  date_acquired: string;
  responsible_id?: string | number;
}