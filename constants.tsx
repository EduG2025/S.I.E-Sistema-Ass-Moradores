import { 
  LayoutDashboard, Wallet, Users, Bell, ShieldAlert, CalendarClock, 
  Settings, ClipboardList, BarChart3, Map as MapIcon, Briefcase, ShoppingBag,
  Landmark, Shield, FileText, Gavel, MessageSquareText, MessageSquare, 
  Calendar, Camera, Leaf, Package, Megaphone, HelpCircle, Box, UserPlus, Zap, Monitor
} from 'lucide-react';
import { SystemInfo, IdCardTemplate } from './types';

export const MENU_ITEMS = [
  // CORE & INTELIGÊNCIA
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, permissionId: 'view_dashboard', category: 'ESTRATÉGICO' },
  { id: 'neural_chat', label: 'IA Especialista', icon: MessageSquareText, permissionId: 'use_ai_chat', category: 'ESTRATÉGICO' },
  
  // GESTÃO DE MEMBROS & ACESSO
  { id: 'users', label: 'Famílias & Membros', icon: Users, permissionId: 'manage_users', category: 'GOVERNANÇA' },
  { id: 'concierge', label: 'Portaria & Acesso', icon: Shield, permissionId: 'view_operations', category: 'GOVERNANÇA' },
  { id: 'demographics', label: 'Observatório Social', icon: BarChart3, permissionId: 'view_demographics', category: 'GOVERNANÇA' },
  { id: 'documents', label: 'Hub de Documentos', icon: FileText, permissionId: 'view_documents', category: 'GOVERNANÇA' },
  { id: 'assemblies', label: 'Assembleia Digital', icon: Gavel, permissionId: 'manage_assemblies', category: 'GOVERNANÇA' },
  { id: 'surveys', label: 'Censo & Pesquisas', icon: ClipboardList, permissionId: 'manage_users', category: 'GOVERNANÇA' },

  // OPERACIONAL & INFRA
  { id: 'finance', label: 'Financeiro', icon: Wallet, permissionId: 'view_finances', category: 'OPERACIONAL' },
  { id: 'operations', label: 'Ocorrências', icon: ShieldAlert, permissionId: 'view_operations', category: 'OPERACIONAL' },
  { id: 'timeline', label: 'Agenda & Marcos', icon: CalendarClock, permissionId: 'view_timeline', category: 'OPERACIONAL' },
  { id: 'projects', label: 'Obras & Projetos', icon: Landmark, permissionId: 'view_projects', category: 'OPERACIONAL' },
  { id: 'assets', label: 'Patrimônio', icon: Box, permissionId: 'manage_users', category: 'OPERACIONAL' },
  { id: 'sustainability', label: 'Sustentabilidade', icon: Leaf, permissionId: 'view_dashboard', category: 'OPERACIONAL' },

  // COMUNIDADE & ENGAJAMENTO
  { id: 'communication', label: 'Mural de Avisos', icon: Megaphone, permissionId: 'view_dashboard', category: 'COMUNIDADE' },
  { id: 'marketplace', label: 'Marketplace Local', icon: ShoppingBag, permissionId: 'use_marketplace', category: 'COMUNIDADE' },
  { id: 'reservations', label: 'Reservas de Áreas', icon: Calendar, permissionId: 'use_reservations', category: 'COMUNIDADE' },
  { id: 'suggestions', label: 'Ouvidoria Digital', icon: HelpCircle, permissionId: 'send_suggestions', category: 'COMUNIDADE' },
  
  // CONFIGURAÇÕES
  { id: 'settings', label: 'Configurações', icon: Settings, permissionId: 'manage_settings', category: 'SISTEMA' },
];

export const AVAILABLE_ROLES = ['ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'SINDIC', 'RESIDENT', 'CONCIERGE', 'MERCHANT', 'COUNCIL'];

export const SYSTEM_PERMISSIONS = [
  { id: 'view_dashboard', label: 'Ver Dashboard', module: 'GERAL' },
  { id: 'manage_users', label: 'Gerir Membros', module: 'ADMIN' },
  { id: 'view_finances', label: 'Ver Financeiro', module: 'FINANCEIRO' },
  { id: 'view_operations', label: 'Ver Ocorrências', module: 'OPERACIONAL' },
  { id: 'manage_settings', label: 'Configurações de Kernel', module: 'ADMIN' },
  { id: 'manage_ai_keys', label: 'Gerir Chaves de IA', module: 'SRE' },
  { id: 'use_ai_chat', label: 'Acesso ao Advisor IA', module: 'SRE' },
  { id: 'view_documents', label: 'Gerir Documentos', module: 'GOVERNANÇA' },
  { id: 'manage_assemblies', label: 'Gerir Assembleias', module: 'GOVERNANÇA' },
  { id: 'view_projects', label: 'Ver Projetos/Obras', module: 'PLANEJAMENTO' },
];

export const DEFAULT_SYSTEM_INFO: SystemInfo = {
  name: 'S.I.E — Sistema Inteligente Ativo',
  shortName: 'S.I.E PRO',
  cnpj: '00.000.000/0001-00',
  address: 'Sede Administrativa Central - Cluster 01',
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
  elements: []
};

export const FINANCIAL_CATEGORIES = ['CONDOMÍNIO', 'DOAÇÃO', 'MANUTENÇÃO', 'SEGURANÇA', 'ADMINISTRATIVO', 'EVENTOS', 'OUTROS'];