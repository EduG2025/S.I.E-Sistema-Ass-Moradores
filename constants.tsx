
import { SocialTag, IdCardTemplate, SystemInfo } from './types';
import { 
  LayoutDashboard, Wallet, Users, Bell, ShieldAlert, CalendarClock, 
  Settings, ClipboardList, BarChart3, Map as MapIcon, Briefcase, ShoppingBag,
  Landmark, Shield, FileText, Gavel, MessageSquareText, MessageSquare, Calendar, History, Camera, Activity, Leaf
} from 'lucide-react';

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, permissionId: 'view_dashboard' },
  { id: 'neural_chat', label: 'SRE Advisor (Chat)', icon: MessageSquareText, permissionId: 'use_ai_chat' },
  { id: 'demographics', label: 'Observatório Social', icon: BarChart3, permissionId: 'view_demographics' },
  { id: 'map', label: 'Mapa Inteligente', icon: MapIcon, permissionId: 'view_dashboard' },
  { id: 'digital_watch', label: 'Vigia Digital', icon: Camera, permissionId: 'manage_operations' },
  { id: 'sustainability', label: 'Gestão ESG', icon: Leaf, permissionId: 'manage_sustainability' },
  { id: 'finance', label: 'Financeiro', icon: Wallet, permissionId: 'view_finances' },
  { id: 'operations', label: 'Ocorrências (Watchdog)', icon: ShieldAlert, permissionId: 'view_operations' },
  { id: 'documents', label: 'Hub de Documentos', icon: FileText, permissionId: 'manage_documents' },
  { id: 'assemblies', label: 'Assembleia Digital', icon: Gavel, permissionId: 'manage_assemblies' },
  { id: 'users', label: 'Famílias & Membros', icon: Users, permissionId: 'manage_users' },
  // FIX: Substituído 'manage_surveys' por 'ClipboardList' que está devidamente importado da lucide-react
  { id: 'surveys', label: 'Censo & Pesquisas', icon: ClipboardList, permissionId: 'manage_users' },
  { id: 'marketplace', label: 'Marketplace Local', icon: ShoppingBag, permissionId: 'manage_marketplace' },
  { id: 'reservations', label: 'Reservas de Áreas', icon: Calendar, permissionId: 'manage_reservations' },
  { id: 'timeline', label: 'Cronograma Ativo', icon: CalendarClock, permissionId: 'view_timeline' },
  { id: 'projects', label: 'Obras & Projetos', icon: Landmark, permissionId: 'view_projects' },
  { id: 'assets', label: 'Inventário / Ativos', icon: Briefcase, permissionId: 'view_assets' },
  { id: 'suggestions', label: 'Ouvidoria Digital', icon: MessageSquare, permissionId: 'view_suggestions' },
  { id: 'settings', label: 'Console Master', icon: Settings, permissionId: 'manage_settings' },
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
  { id: 'manage_sustainability', label: 'Gerir ESG', module: 'MEIO AMBIENTE' },
  { id: 'view_timeline', label: 'Ver Cronograma', module: 'PLANEJAMENTO' },
  { id: 'view_projects', label: 'Ver Projetos/Obras', module: 'PLANEJAMENTO' },
  { id: 'view_assets', label: 'Ver Inventário', module: 'PATRIMÔNIO' },
  { id: 'view_suggestions', label: 'Ver Ouvidoria', module: 'SOCIAL' },
];

export const DEFAULT_SYSTEM_INFO: SystemInfo = {
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