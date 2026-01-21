
import React from 'react';

// --- ENUMS NUCLEARES ---

export enum UserRole {
  ADMIN = 'ADMIN',
  PRESIDENT = 'PRESIDENT',
  VICE_PRESIDENT = 'VICE_PRESIDENT',
  SINDIC = 'SINDIC',
  RESIDENT = 'RESIDENT',
  CONCIERGE = 'CONCIERGE',
  MERCHANT = 'MERCHANT',
  COUNCIL = 'COUNCIL'
}

export type UserStatus = 'ACTIVE' | 'PENDING' | 'BANNED' | 'VALIDATION_REQUIRED';
export type FinancialStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'PARTIAL';
export type ProjectStatus = 'PLANNING' | 'EM_EXECUÇÃO' | 'CONCLUÍDO' | 'CANCELADO';
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type DocumentType = 'OFICIO' | 'ATA' | 'EDITAL' | 'CONTRATO' | 'RELATÓRIO';
export type AIKeyStatus = 'ACTIVE' | 'ERROR' | 'INVALID';
export type AITier = 'FREE' | 'PAID';

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
}

// SRE: Definindo IdCardTemplate para resolver falha de importação em constants.tsx
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

// --- INTERFACES DE IDENTIDADE ---

export interface SocialData {
  risk: number;
  tags: string[];
  income_range?: string;
  household_size?: number;
  vulnerabilities?: string[];
  last_census_date?: string;
  ai_notes?: string;
  nis_number?: string;
  benefits?: string[];
  education_level?: string;
}

export interface User {
  id: string | number;
  name: string;
  username: string;
  unit?: string;
  role: UserRole | string;
  status: UserStatus;
  active: boolean;
  cpf_cnpj: string;
  age?: number; // SRE: Atributo bioestatístico
  email?: string;
  phone?: string;
  avatar_url?: string;
  permissions?: string[];
  socialData?: SocialData;
  coordinates?: { lat: number; lng: number };
  rg?: string;
  rg_issuing_body?: string;
  parent_id?: string | number;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  profession?: string;
  last_login?: string;
}

// --- INTERFACES DE PESQUISA DINÂMICA (SRE V9) ---

export interface QuestionLogic {
  show_if_question?: string | number;
  show_if_value?: any;
}

export interface SurveyQuestion {
  id: string | number;
  text: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'repeater';
  options?: string[];
  mapping_tag?: 'IDENTITY' | 'EDUCATION' | 'DIGITAL' | 'GOV_AID' | 'FAMILY' | 'HEALTH' | 'FINANCE' | 'WORK' | 'TALENT' | 'SOCIAL' | string;
  required: boolean | number;
  logic?: QuestionLogic;
  repeater_fields?: Omit<SurveyQuestion, 'repeater_fields' | 'logic'>[];
}

export interface Survey {
  id: string | number;
  title: string;
  description: string;
  type: 'CENSUS' | 'SOCIAL_AID' | 'SATISFACTION';
  questions: SurveyQuestion[];
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
}

// --- OUTROS ---

export interface Visitor {
    id: string | number;
    name: string;
    document: string;
    unit: string;
    phone: string;
    status: 'IN_CLUSTER' | 'COMPLETED';
    arrival_time: string;
    exit_time?: string;
}

export interface Delivery {
    id: string | number;
    courier: string;
    company: string;
    unit: string;
    recipient: string;
    status: 'PENDING' | 'PICKED_UP';
    arrival_time: string;
    pickup_time?: string;
}

export interface Asset {
  id: string | number;
  name: string;
  category: string;
  value: number | string;
  status: 'PERFEITO' | 'BOM' | 'MANUTENÇÃO' | 'DEPRECIADO';
  date_acquired?: string;
  responsible_id?: string | number;
}

export interface UnitData {
  id: string | number;
  residentName: string;
  cpf: string;
  unit: string;
  address: string;
  coordinates: { lat: number; lng: number };
  tags: string[];
  socialData?: any;
  status?: string;
  role?: string;
  // SRE FIX: Added missing properties to fix property access errors in SmartMap.tsx
  phone: string;
  age: number;
}

export interface ScheduledBroadcast {
  id: string | number;
  user_id: number;
  target_type: 'ROLE' | 'USER' | 'DIRECT' | string;
  target_value: string;
  message_body: string;
  scheduled_at: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  created_at?: string;
}

export interface AIKey {
  id: string | number;
  label: string;
  key_value: string;
  provider: string;
  status: AIKeyStatus | string;
  priority: number;
  error_count: number;
  last_checked?: string;
  created_at?: string;
}

export interface Incident {
  id: string | number;
  title: string;
  location: string;
  priority: IncidentPriority | string;
  status: IncidentStatus | string;
  description: string;
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
  userName?: string;
  description: string;
  amount: number | string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  status: FinancialStatus | string;
  is_recurring?: boolean | number;
  billing_cycle?: string;
  next_due_date?: string;
  date: string;
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
  category: string;
  status: ProjectStatus | string;
}

export interface MarketItem {
  id: string | number;
  merchant_id?: string | number;
  title: string;
  description: string;
  category: 'FOOD' | 'SERVICE' | 'GOODS' | string;
  price: number | string;
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

export interface OfficialDocument {
  id: string | number;
  title: string;
  content: string;
  type: DocumentType | string;
  status: 'DRAFT' | 'FINAL' | 'ARCHIVED' | string;
  created_at?: string;
  updated_at: string;
}
