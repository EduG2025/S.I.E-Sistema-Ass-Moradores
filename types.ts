
import React from 'react';

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

export interface SystemInfo {
  name: string;
  shortName?: string; 
  cnpj?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  primaryColor?: string;
  logoUrl?: string;
  registrationMode?: string;
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
  socialData?: any;
  rg?: string;
  rg_issuing_body?: string;
}

export interface OfficialDocument {
  id: string | number;
  title: string;
  content: string;
  type: 'OFICIO' | 'ATA' | 'EDITAL' | 'CONTRATO' | 'RELATÓRIO';
  status: 'DRAFT' | 'SIGNED' | 'ARCHIVED';
  updated_at: string;
}

export interface Incident {
  id: string | number;
  title: string;
  location: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  created_at: string;
}

export interface SurveyQuestion {
  id: string | number;
  text: string;
  type: string;
  options?: string[];
  mapping_tag?: string;
  required: boolean | number;
}

export interface Survey {
  id: string | number;
  title: string;
  description: string;
  type: string;
  questions: SurveyQuestion[];
  status: string;
}

export interface FinancialRecord {
  id: string | number;
  user_id?: string | number;
  description: string;
  amount: number | string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  status: FinancialStatus;
  date: string;
}

export interface UnitData {
  id: string | number;
  residentName: string;
  unit: string;
  coordinates: { lat: number; lng: number };
  tags?: string[];
}

export interface AIKey {
  id: string | number;
  label: string;
  key_value: string;
  provider: string; 
  tier: 'FREE' | 'PAID';
  priority: number;
  status: 'ACTIVE' | 'ERROR' | 'INVALID';
}

export interface IdCardTemplate {
  id: string | number;
  name: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  frontBackground: string;
  backBackground: string;
  elements: any[];
}

export interface Notice {
  id: string | number;
  title: string;
  content: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  date: string;
}

// SRE FIX: AgendaEvent interface added for Timeline component
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
  status: string;
  date_acquired?: string;
  responsible_id?: string | number;
}
