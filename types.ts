
import React from 'react';

/**
 * S.I.E PRO - ENUMS DE GOVERNANÇA (RBAC & STATUS)
 * Protocolo SRE V22.0
 */
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
export type SocialTag = 'BAIXA_RENDA' | 'IDOSO_SOLO' | 'PCD' | 'AJUDA_URGENTE' | 'CANDIDATO_COMERCIO' | 'RISCO_SANEAMENTO' | 'NENHUMA';
export type FinancialStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'PARTIAL';
export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'SCHEDULED';
export type AssetStatus = 'PERFEITO' | 'BOM' | 'MANUTENÇÃO' | 'DEPRECIADO';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

/**
 * S.I.E PRO - SOCIAL & DEMOGRÁFICO
 */
export interface SocialQuestionnaireData {
  residenceType?: string;
  residenceOwnership?: string;
  residentsCount?: number;
  childrenCount?: number;
  adultCount?: number;
  seniorCount?: number;
  hasDisabledPerson?: boolean;
  disabledPersonDetail?: string;
  incomeRange?: string;
  incomeSource?: string;
  waterSupply?: string;
  sewage?: string;
  electricity?: string;
  trashCollection?: boolean;
  educationLevel?: string;
  workStatus?: string;
  chronicDisease?: string;
  continuousMedication?: boolean;
  isMerchant?: boolean;
  businessName?: string;
  businessType?: string;
  businessRevenue?: string;
  hasLicense?: boolean;
  urgentNeed?: string;
  socialRisk?: boolean;
  childrenOutOfSchool?: number;
  unemployedCount?: number;
  seniorsAlone?: number;
  tags?: SocialTag[];
}

/**
 * S.I.E PRO - IDENTIDADE E MEMBROS
 */
export interface User {
  id: string | number;
  name: string;
  username: string;
  unit?: string;
  role: UserRole | string;
  status: UserStatus;
  active: boolean;
  cpf_cnpj: string;
  rg?: string;
  rg_issuing_body?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  socialData?: SocialQuestionnaireData;
  lgpd_consent?: boolean;
  permissions?: string[];
}

/**
 * S.I.E PRO - OPERACIONAL
 */
export interface UnitData {
  id: string | number;
  residentName: string;
  unit: string;
  tags: SocialTag[];
  coordinates: { lat: number; lng: number };
  block?: string; 
  number?: string;
}

export interface FinancialRecord {
  id: string | number;
  description: string;
  amount: number | string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  status: FinancialStatus;
}

export interface Bill {
  id: string | number;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
}

export interface SystemInfo {
  name: string;
  cnpj?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  primaryColor?: string;
  registrationMode?: string;
  logoUrl?: string;
}

export interface Alert {
  id: string | number;
  title: string;
  content: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  date: string;
}

export interface Notice {
  id: string | number;
  title: string;
  content: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  date: string;
}

export interface SurveyQuestion {
  id: string | number;
  text: string;
  type: 'text' | 'choice' | 'boolean';
  options?: string[];
  mapping_tag?: string;
}

export interface Survey {
  id: string | number;
  title: string;
  description: string;
  type: string;
  status: string;
  questions: SurveyQuestion[];
}

export interface AgendaEvent {
  id: string | number;
  title: string;
  description: string;
  date: string;
  type: 'MEETING' | 'MAINTENANCE' | 'EVENT' | 'DEADLINE';
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
}

export interface Reservation {
  id: string | number;
  title: string;
  date: string;
  status: string;
}

export interface Incident {
  id: string | number;
  title: string;
  location: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: string;
}

export interface Visitor {
  id: string | number;
  name: string;
}

export interface MaintenanceRecord {
  id: string | number;
  title: string;
  description?: string;
}

export interface OfficialDocument {
  id: string | number;
  title: string;
  content: string;
  type: string;
  status: string;
  updated_at: string;
}

export interface CommunityProject {
  id: string | number;
  title: string;
  description: string;
  budget: number | string;
  spent: number | string;
  progress: number;
  status: string;
  startDate: string;
  category: string;
}

export interface MarketItem {
  id: string | number;
  title: string;
  description: string;
  category: 'FOOD' | 'SERVICE' | 'GOODS';
  price?: number;
  whatsapp?: string;
  merchantName?: string;
  merchant_id?: string | number;
  unit?: string;
}

export interface CardElement {
  id: string;
  type: 'text-dynamic' | 'image' | 'shape';
  label: string;
  x: number;
  y: number;
  layer: 'front' | 'back';
  style: any;
  field?: string;
  width?: number;
  height?: number;
}

export interface IdCardTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  frontBackground: string;
  backBackground: string;
  elements: CardElement[];
}

export interface Asset {
  id: string | number;
  name: string;
  category: string;
  value: number;
  status: 'PERFEITO' | 'BOM' | 'MANUTENÇÃO' | 'DEPRECIADO';
  date_acquired: string;
  responsible_id?: string | number;
  responsibleName?: string;
}

export interface AIKey {
  id: string | number;
  label: string;
  key_value: string;
  provider: string;
  tier: 'FREE' | 'PAID';
  priority: number;
  status: 'ACTIVE' | 'ERROR' | 'QUOTA_EXCEEDED' | 'INVALID';
  error_count: number;
  last_checked: string;
}
