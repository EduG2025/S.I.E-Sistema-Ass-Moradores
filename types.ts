
import React from 'react';

/**
 * S.I.E PRO - ENUMS DE GOVERNANÇA (RBAC & STATUS)
 * Protocolo de Resiliência SRE V22.0
 */

/** Papéis de usuário no sistema (Role-Based Access Control) */
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

/** Estados operacionais do usuário */
// SRE FIX: Alinhado com strings em Inglês utilizadas no Kernel e DB para evitar erros de "no overlap"
export type UserStatus = 'ACTIVE' | 'PENDING' | 'BANNED' | 'VALIDATION_REQUIRED';

/** Tags sociais para análise do Observatório Demográfico */
export type SocialTag = 
  | 'BAIXA_RENDA' 
  | 'IDOSO_SOLO' 
  | 'PCD' 
  | 'AJUDA_URGENTE' 
  | 'CANDIDATO_COMERCIO' 
  | 'RISCO_SANEAMENTO' 
  | 'ZONA_DE_RISCO'
  | 'NENHUMA';

/** Status Financeiros */
// SRE FIX: Alinhado com strings em Inglês utilizadas no Kernel e DB
export type FinancialStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'PARTIAL';

/** Status de Pesquisas e Censos */
// SRE FIX: Normalizado para Inglês para compatibilidade com o Kernel e as views (Resolução de erros de overlap)
export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'SCHEDULED';

/** Condição de Ativos e Patrimônio */
export type AssetStatus = 'PERFEITO' | 'BOM' | 'MANUTENÇÃO' | 'DEPRECIADO';

/** Status de Projetos de Infraestrutura */
export type ProjectStatus = 'PLANEJAMENTO' | 'EM_EXECUÇÃO' | 'CONCLUÍDO' | 'CANCELADO';

/** Prioridades de Ocorrência (Watchdog) */
// SRE FIX: Alinhado com strings em Inglês utilizadas no Kernel
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Status de Incidentes */
// SRE FIX: Alinhado com strings em Inglês utilizadas no Kernel
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

/**
 * S.I.E PRO - SOCIAL & DEMOGRÁFICO
 * Interface para armazenamento de dados do Censo Neural
 */
export interface SocialQuestionnaireData {
  residenceType?: string;          // Alvenaria, Madeira, etc.
  residenceOwnership?: string;     // Próprio, Alugado, Cedido
  residentsCount?: number;         // Total de pessoas na unidade
  childrenCount?: number;          // Menores de 12 anos
  adultCount?: number;             // 18 a 59 anos
  seniorCount?: number;            // 60+ anos
  hasDisabledPerson?: boolean;     // Possui PCD na unidade
  disabledPersonDetail?: string;   // Detalhes da deficiência
  incomeRange?: string;            // Faixa de renda familiar
  incomeSource?: string;           // Principal fonte (Trabalho, Auxílio, Aposentadoria)
  waterSupply?: string;            // Rede pública, Poço, etc.
  sewage?: string;                 // Rede pública, Fossa, etc.
  electricity?: string;            // Regular, Compartilhada, etc.
  trashCollection?: boolean;       // Possui coleta regular
  educationLevel?: string;         // Escolaridade predominante
  workStatus?: string;             // Empregado, Autônomo, Desempregado
  chronicDisease?: string;         // Doenças crônicas na família
  continuousMedication?: boolean;  // Uso de medicação contínua
  isMerchant?: boolean;            // É comerciante local
  businessName?: string;           // Nome do negócio
  businessType?: string;           // Ramo de atividade
  businessRevenue?: string;        // Faturamento estimado
  hasLicense?: boolean;            // Possui alvará/licença
  urgentNeed?: string;             // Necessidade imediata (ex: Cesta básica)
  socialRisk?: boolean;            // Marcador de risco social detectado pela IA
  childrenOutOfSchool?: number;    // Crianças fora da escola
  unemployedCount?: number;        // Total de desempregados na unidade
  seniorsAlone?: number;           // Idosos que residem sozinhos
  tags?: SocialTag[];              // Tags automáticas geradas pelo Kernel
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
  last_login?: string;
}

/**
 * S.I.E PRO - OPERACIONAL & MAPA
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

/**
 * S.I.E PRO - FINANCEIRO (ERP)
 */
export interface FinancialRecord {
  id: string | number;
  description: string;
  amount: number | string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  status: FinancialStatus;
  payment_method?: string;
  receipt_url?: string;
}

export interface Bill {
  id: string | number;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  barcode?: string;
}

/**
 * S.I.E PRO - COMUNICAÇÃO & SISTEMA
 */
export interface SystemInfo {
  name: string;
  cnpj?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  primaryColor?: string;
  registrationMode?: 'OPEN' | 'APPROVAL' | 'INVITE_ONLY';
  logoUrl?: string;
  slogan?: string;
}

export interface Alert {
  id: string | number;
  title: string;
  content: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  date: string;
  author_id?: string | number;
}

export interface Notice {
  id: string | number;
  title: string;
  content: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  date: string;
  category?: string;
}

/**
 * S.I.E PRO - CENSO & INTELIGÊNCIA SOCIAL
 */
export interface SurveyQuestion {
  id: string | number;
  text: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'radio' | 'checkbox' | 'select' | 'boolean';
  options?: string[];
  mapping_tag?: string;
  required?: boolean;
}

export interface Survey {
  id: string | number;
  title: string;
  description: string;
  type: 'CENSUS' | 'SOCIAL_AID' | 'SATISFACTION' | 'POLL';
  status: SurveyStatus;
  questions: SurveyQuestion[];
  responses_count?: number;
  created_at?: string;
}

/**
 * S.I.E PRO - AGENDA & RESERVAS
 */
export interface AgendaEvent {
  id: string | number;
  title: string;
  description: string;
  date: string;
  type: 'MEETING' | 'MAINTENANCE' | 'EVENT' | 'DEADLINE';
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  location?: string;
}

export interface Reservation {
  id: string | number;
  title: string;
  area_name: string;
  user_id: string | number;
  userName?: string;
  userUnit?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
}

/**
 * S.I.E PRO - WATCHDOG & SEGURANÇA
 */
export interface Incident {
  id: string | number;
  title: string;
  description?: string;
  location: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  created_at: string;
  resolved_at?: string;
  author_id?: string | number;
  images?: string[];
}

export interface Visitor {
  id: string | number;
  name: string;
  document: string;
  type: 'VISITOR' | 'DELIVERY' | 'SERVICE';
  unit_target: string;
  check_in: string;
  check_out?: string;
  authorized_by?: string;
  photo_url?: string;
}

/**
 * S.I.E PRO - GOVERNANÇA DIGITAL (DOCUMENTOS & ASSEMBLEIAS)
 */
export interface OfficialDocument {
  id: string | number;
  title: string;
  content: string;
  type: 'OFICIO' | 'ATA' | 'EDITAL' | 'CONTRATO' | 'RELATÓRIO';
  status: 'DRAFT' | 'SIGNED' | 'ARCHIVED';
  updated_at: string;
  file_url?: string;
}

export interface AssemblyTopic {
  id: string | number;
  title: string;
  description: string;
  voting_type: 'YES_NO' | 'OPTIONS' | 'RATING';
  options?: string[];
  results?: any;
}

export interface Assembly {
  id: string | number;
  title: string;
  description: string;
  date: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  type: 'ORDINARY' | 'EXTRAORDINARY';
  topics: AssemblyTopic[];
  ata_content?: string;
  quorum_count?: number;
}

/**
 * S.I.E PRO - INFRAESTRUTURA & ATIVOS
 */
export interface CommunityProject {
  id: string | number;
  title: string;
  description: string;
  budget: number | string;
  spent: number | string;
  progress: number;
  status: ProjectStatus;
  startDate: string;
  category: 'INFRA' | 'SOCIAL' | 'LEGAL' | 'ENVIRONMENT';
}

export interface Asset {
  id: string | number;
  name: string;
  category: string;
  value: number;
  status: AssetStatus;
  date_acquired: string;
  responsible_id?: string | number;
  responsibleName?: string;
  maintenance_history?: any[];
}

/**
 * S.I.E PRO - MARKETPLACE (ECONOMIA CIRCULAR)
 */
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
  status?: 'ACTIVE' | 'SOLD' | 'PAUSED';
}

/**
 * S.I.E PRO - STUDIO DE IDENTIDADE
 */
export interface CardElement {
  id: string;
  type: 'text-dynamic' | 'image' | 'shape' | 'barcode' | 'qrcode';
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

/**
 * S.I.E PRO - INTELIGÊNCIA ARTIFICIAL (IA GATEWAY)
 */
export interface AIKey {
  id: string | number;
  label: string;
  key_value: string;
  provider: string; // GEMINI, OPENAI, etc.
  tier: 'FREE' | 'PAID';
  priority: number;
  status: 'ACTIVE' | 'ERROR' | 'QUOTA_EXCEEDED' | 'INVALID';
  error_count: number;
  last_checked: string;
}

/**
 * S.I.E PRO - SUSTENTABILIDADE & ESG
 */
export interface ResourceConsumption {
  id: string | number;
  type: 'WATER' | 'ELECTRICITY' | 'GAS';
  value: number; // m3, kWh, etc.
  cost: number;
  period_month: number;
  period_year: number;
  carbon_footprint?: number;
}

export interface WasteManagement {
  id: string | number;
  category: 'ORGANIC' | 'RECYCLABLE' | 'HAZARDOUS' | 'ELECTRONIC';
  weight_kg: number;
  collection_date: string;
  destination?: string;
}

/**
 * S.I.E PRO - AUDITORIA & LOGS
 */
export interface AuditLog {
  id: string | number;
  user_id: string | number;
  action: string;
  module: string;
  timestamp: string;
  ip_address?: string;
  details?: string;
}
