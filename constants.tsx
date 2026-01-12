
import { SystemInfo, IdCardTemplate } from './types';
import { 
  LayoutDashboard, Wallet, Users, Bell, ShieldAlert, CalendarClock, 
  Settings, ClipboardList, BarChart3, Map as MapIcon, Briefcase, ShoppingBag,
  Landmark, Shield, FileText, Gavel, MessageSquareText, MessageSquare, Calendar, Camera, Leaf
} from 'lucide-react';

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, permissionId: 'view_dashboard' },
  { id: 'neural_chat', label: 'SRE Advisor (Chat)', icon: MessageSquareText, permissionId: 'use_ai_chat' },
  { id: 'demographics', label: 'Observatório Social', icon: BarChart3, permissionId: 'view_demographics' },
  { id: 'digital_watch', label: 'Vigia Digital', icon: Camera, permissionId: 'manage_operations' },
  { id: 'finance', label: 'Financeiro', icon: Wallet, permissionId: 'view_finances' },
  { id: 'operations', label: 'Ocorrências (Watchdog)', icon: ShieldAlert, permissionId: 'view_operations' },
  { id: 'documents', label: 'Hub de Documentos', icon: FileText, permissionId: 'manage_documents' },
  { id: 'assemblies', label: 'Assembleia Digital', icon: Gavel, permissionId: 'manage_assemblies' },
  { id: 'users', label: 'Famílias & Membros', icon: Users, permissionId: 'manage_users' },
  { id: 'projects', label: 'Obras & Projetos', icon: Landmark, permissionId: 'view_projects' },
  { id: 'settings', label: 'Configurações', icon: Settings, permissionId: 'manage_settings' },
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
  { id: 'manage_documents', label: 'Gerir Documentos', module: 'GOVERNANÇA' },
  { id: 'manage_assemblies', label: 'Gerir Assembleias', module: 'GOVERNANÇA' },
  { id: 'view_projects', label: 'Ver Projetos/Obras', module: 'PLANEJAMENTO' },
];

export const DEFAULT_SYSTEM_INFO: SystemInfo = {
  name: 'Associação de Moradores de Cacaria',
  shortName: 'AMC',
  cnpj: '00.000.000/0001-00',
  address: 'Cacaria, RJ - Brasil',
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
