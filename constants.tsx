
import { SocialTag, IdCardTemplate } from './types';
import { 
  LayoutDashboard, Wallet, Users, Bell, ShieldAlert, CalendarClock, 
  Settings, ClipboardList, BarChart3, Map as MapIcon, Briefcase, ShoppingBag,
  Landmark, Shield, FileText, Gavel, MessageSquareText, MessageSquare, Calendar, History, Camera, Activity
} from 'lucide-react';

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, roles: ['ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'SINDIC', 'RESIDENT', 'CONCIERGE', 'MERCHANT', 'COUNCIL'] },
  { id: 'neural_chat', label: 'SRE Advisor (Chat)', icon: MessageSquareText, roles: ['ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'SINDIC', 'RESIDENT', 'CONCIERGE', 'COUNCIL'] },
  { id: 'demographics', label: 'Observatório Social', icon: BarChart3, roles: ['ADMIN', 'PRESIDENT', 'COUNCIL'] },
  { id: 'map', label: 'Mapa Inteligente', icon: MapIcon, roles: ['ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'SINDIC', 'CONCIERGE'] },
  { id: 'digital_watch', label: 'Vigia Digital', icon: Camera, roles: ['ADMIN', 'PRESIDENT', 'CONCIERGE'] },
  { id: 'finance', label: 'Financeiro', icon: Wallet, roles: ['ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'SINDIC', 'RESIDENT'] },
  { id: 'operations', label: 'Ocorrências (Watchdog)', icon: ShieldAlert, roles: ['ADMIN', 'PRESIDENT', 'SINDIC', 'CONCIERGE', 'RESIDENT'] },
  { id: 'documents', label: 'Hub de Documentos', icon: FileText, roles: ['ADMIN', 'PRESIDENT', 'SINDIC', 'COUNCIL'] },
  { id: 'assemblies', label: 'Assembleia Digital', icon: Gavel, roles: ['ADMIN', 'PRESIDENT', 'RESIDENT', 'COUNCIL'] },
  { id: 'users', label: 'Famílias & Membros', icon: Users, roles: ['ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'SINDIC', 'CONCIERGE'] },
  { id: 'surveys', label: 'Censo & Pesquisas', icon: ClipboardList, roles: ['ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'SINDIC', 'RESIDENT'] },
  { id: 'marketplace', label: 'Marketplace Local', icon: ShoppingBag, roles: ['ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'SINDIC', 'RESIDENT', 'MERCHANT'] },
  { id: 'reservations', label: 'Reservas de Áreas', icon: Calendar, roles: ['ADMIN', 'PRESIDENT', 'RESIDENT'] },
  { id: 'timeline', label: 'Cronograma Ativo', icon: CalendarClock, roles: ['ADMIN', 'PRESIDENT', 'SINDIC', 'RESIDENT'] },
  { id: 'projects', label: 'Obras & Projetos', icon: Landmark, roles: ['ADMIN', 'PRESIDENT', 'SINDIC'] },
  { id: 'assets', label: 'Inventário / Ativos', icon: Briefcase, roles: ['ADMIN', 'PRESIDENT', 'SINDIC'] },
  { id: 'suggestions', label: 'Ouvidoria Digital', icon: MessageSquare, roles: ['ADMIN', 'PRESIDENT', 'RESIDENT'] },
  { id: 'settings', label: 'Console Master', icon: Settings, roles: ['ADMIN', 'PRESIDENT'] },
];

export const AVAILABLE_ROLES = [
  'ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'SINDIC', 'RESIDENT', 'CONCIERGE', 'MERCHANT', 'COUNCIL'
];

export const SYSTEM_PERMISSIONS = [
  { id: 'view_dashboard', label: 'Ver Dashboard', module: 'GERAL' },
  { id: 'manage_users', label: 'Gerir Membros', module: 'ADMIN' },
  { id: 'view_finances', label: 'Ver Financeiro', module: 'FINANCEIRO' },
  { id: 'manage_finances', label: 'Lançamentos Financeiros', module: 'FINANCEIRO' },
  { id: 'view_operations', label: 'Ver Ocorrências', module: 'OPERACIONAL' },
  { id: 'manage_operations', label: 'Gerir Ocorrências', module: 'OPERACIONAL' },
  { id: 'manage_settings', label: 'Configurações de Kernel', module: 'ADMIN' },
  { id: 'manage_ai_keys', label: 'Gerir Chaves de IA', module: 'SRE' },
  { id: 'use_ai_chat', label: 'Acesso ao Advisor IA', module: 'SRE' },
  { id: 'manage_marketplace', label: 'Gerir Marketplace', module: 'MARKETPLACE' },
  { id: 'manage_reservations', label: 'Gerir Reservas', module: 'RESERVA' },
  { id: 'manage_documents', label: 'Gerir Documentos', module: 'GOVERNANÇA' },
  { id: 'manage_assemblies', label: 'Gerir Assembleias', module: 'GOVERNANÇA' },
  { id: 'view_demographics', label: 'Ver Observatório Social', module: 'SOCIAL' },
];

export const DEFAULT_SYSTEM_INFO = {
  name: 'S.I.E — Sistema Inteligente Ativo',
  cnpj: '00.000.000/0001-00',
  address: 'Sede Administrativa S.I.E - Cluster 01',
  email: 'governanca@sie.pro',
  phone: '(11) 99999-9999',
  website: 'www.sie.pro',
  primaryColor: '#4f46e5',
  registrationMode: 'APPROVAL'
};

export const DEFAULT_ID_CARD_TEMPLATE: IdCardTemplate = {
  id: 'tpl_standard',
  name: 'Padrão S.I.E Oficial',
  width: 320,
  height: 200,
  orientation: 'landscape',
  frontBackground: '#ffffff',
  backBackground: '#f8fafc',
  elements: [
    { id: 'name', type: 'text-dynamic', label: 'Nome', x: 5, y: 10, layer: 'front', style: { fontSize: '16px', fontWeight: 'bold' }, field: 'name' },
    { id: 'role', type: 'text-dynamic', label: 'Cargo', x: 5, y: 25, layer: 'front', style: { fontSize: '12px', color: '#6366f1' }, field: 'role' },
    { id: 'avatar', type: 'image', label: 'Foto', x: 70, y: 10, layer: 'front', style: {}, field: 'avatar_url', width: 80, height: 80 }
  ]
};

export const FINANCIAL_CATEGORIES = [
  'CONDOMÍNIO', 'DOAÇÃO PONTUAL', 'DOAÇÃO RECORRENTE', 'MANUTENÇÃO', 'SEGURANÇA', 'ADMINISTRATIVO', 'EVENTOS', 'RESERVA', 'OUTROS'
];

export const RECURRENCE_PERIODS = [
  { id: 'NONE', label: 'Único / Pontual' },
  { id: 'MONTHLY', label: 'Mensal' },
  { id: 'QUARTERLY', label: 'Trimestral' },
  { id: 'YEARLY', label: 'Anual' }
];
