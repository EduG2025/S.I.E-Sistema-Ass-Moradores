
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

// --- INTERFACES DE IDENTIDADE ---

export interface SocialData {
  risk: number;
  tags: string[];
  income_range?: string;
  household_size?: number;
  vulnerabilities?: string[];
  last_census_date?: string;
  ai_notes?: string;
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
  profession?: string;
  last_login?: string;
}

// --- INTERFACES OPERACIONAIS & GOVERNANÇA ---

export interface CameraDevice {
  id: string | number;
  name: string;
  url: string;
  location: string;
  status: 'ACTIVE' | 'OFFLINE' | 'MAINTENANCE';
  created_at: string;
}

export interface OfficialDocument {
  id: string | number;
  title: string;
  content: string;
  type: DocumentType;
  status: 'DRAFT' | 'SIGNED' | 'ARCHIVED';
  updated_at: string;
  created_by?: number;
  hash?: string;
}

export interface Incident {
  id: string | number;
  title: string;
  description?: string;
  location: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  created_at: string;
  updated_at?: string;
}

export interface Notice {
  id: string | number;
  title: string;
  content: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  date: string;
  created_at?: string;
}

// --- INTERFACES DE PESQUISA (CENSO) ---

export interface SurveyQuestion {
  id: string | number;
  text: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date';
  options?: string[];
  mapping_tag?: string;
  required: boolean | number;
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

// --- INTERFACES FINANCEIRAS & AUDITORIA ---

export interface FinancialRecord {
  id: string | number;
  user_id?: string | number;
  description: string;
  amount: number | string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  status: FinancialStatus;
  date: string;
  is_recurring?: number | boolean;
  billing_cycle?: string;
  next_due_date?: string;
}

export interface AuditLogEntry {
  id: number;
  user_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT';
  table_name: string;
  record_id: number;
  details: string;
  created_at: string;
}

// --- INTERFACES DE INFRAESTRUTURA IA ---

export interface AIKey {
  id: string | number;
  label: string;
  key_value: string;
  provider: 'GOOGLE' | 'OPENAI'; 
  tier: AITier;
  priority: number;
  status: AIKeyStatus;
  error_count: number;
  last_checked?: string;
}

export interface IdCardElement {
  id: string;
  type: 'text' | 'image' | 'barcode' | 'qrcode';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  field?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
}

export interface IdCardTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  frontBackground?: string;
  backBackground?: string;
  elements: IdCardElement[];
}

// --- INTERFACES COMUNITÁRIAS ---

export interface AgendaEvent {
  id: string | number;
  title: string;
  description: string;
  date: string;
  type: 'MEETING' | 'MAINTENANCE' | 'EVENT' | 'DEADLINE';
  status: 'UPCOMING' | 'FINISHED' | 'CANCELLED' | 'SCHEDULED';
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
  category: string;
  status: ProjectStatus | string;
}

export interface MarketItem {
  id: string | number;
  title: string;
  description: string;
  category: 'GOODS' | 'FOOD' | 'SERVICE';
  price: number | string;
  whatsapp: string;
  merchant_id?: string | number;
  merchantName?: string;
  unit?: string;
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
  unit: string;
  coordinates: { lat: number; lng: number };
  tags?: string[];
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
}
