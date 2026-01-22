import { 
  LayoutDashboard, Wallet, Users, Bell, ShieldAlert, CalendarClock, 
  Settings, ClipboardList, BarChart3, Shield, FileText, Gavel, 
  MessageSquareText, Calendar, Camera, Leaf, ShoppingBag, 
  Megaphone, HelpCircle, Box, Monitor, Brain
} from 'lucide-react';
import { SystemInfo } from './types';

export const MENU_ITEMS = [
  // ESTRATÉGICO
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, permissionId: 'view_dashboard', category: 'ESTRATÉGICO' },
  { id: 'neural_chat', label: 'IA Especialista', icon: Brain, permissionId: 'use_ai_chat', category: 'ESTRATÉGICO' },
  
  // GOVERNANÇA
  { id: 'users', label: 'Famílias & Membros', icon: Users, permissionId: 'manage_users', category: 'GOVERNANÇA' },
  { id: 'demographics', label: 'Observatório Social', icon: BarChart3, permissionId: 'view_demographics', category: 'GOVERNANÇA' },
  { id: 'documents', label: 'Hub de Documentos', icon: FileText, permissionId: 'view_documents', category: 'GOVERNANÇA' },
  { id: 'assemblies', label: 'Assembleia Digital', icon: Gavel, permissionId: 'manage_assemblies', category: 'GOVERNANÇA' },
  { id: 'surveys', label: 'Censo & Pesquisas', icon: ClipboardList, permissionId: 'manage_surveys', category: 'GOVERNANÇA' },

  // OPERACIONAL
  { id: 'watchdog', label: 'Central de Vigilância', icon: Camera, permissionId: 'view_operations', category: 'OPERACIONAL' },
  { id: 'finance', label: 'ERP Financeiro', icon: Wallet, permissionId: 'view_finances', category: 'OPERACIONAL' },
  { id: 'operations', label: 'Ocorrências', icon: ShieldAlert, permissionId: 'view_operations', category: 'OPERACIONAL' },
  { id: 'projects', label: 'Obras & Projetos', icon: Box, permissionId: 'view_projects', category: 'OPERACIONAL' },
  { id: 'sustainability', label: 'Sustentabilidade', icon: Leaf, permissionId: 'view_dashboard', category: 'OPERACIONAL' },

  // COMUNIDADE
  { id: 'communication', label: 'Mural de Avisos', icon: Megaphone, permissionId: 'manage_communication', category: 'COMUNIDADE' },
  { id: 'marketplace', label: 'Marketplace Local', icon: ShoppingBag, permissionId: 'use_marketplace', category: 'COMUNIDADE' },
  { id: 'reservations', label: 'Reservas de Áreas', icon: Calendar, permissionId: 'use_reservations', category: 'COMUNIDADE' },
  { id: 'suggestions', label: 'Ouvidoria Digital', icon: HelpCircle, permissionId: 'send_suggestions', category: 'COMUNIDADE' },
  
  // SISTEMA
  { id: 'settings', label: 'Configurações', icon: Settings, permissionId: 'manage_settings', category: 'SISTEMA' },
];

export const DEFAULT_SYSTEM_INFO: SystemInfo = {
  name: 'S.I.E — Sistema Inteligente Ativo',
  shortName: 'S.I.E PRO',
  cnpj: '00.000.000/0001-00',
  address: 'Sede Administrativa Central',
  primaryColor: '#4f46e5',
  registrationMode: 'APPROVAL'
};

export const SYSTEM_PERMISSIONS = [
  { id: 'view_dashboard', label: 'Visualizar Dashboard' },
  { id: 'manage_users', label: 'Gerenciar Membros' },
  { id: 'view_finances', label: 'Visualizar Financeiro' },
  { id: 'view_operations', label: 'Visualizar Operações/Câmeras' },
  { id: 'use_ai_chat', label: 'Usar IA Advisor' },
  { id: 'view_documents', label: 'Ver Documentos' },
  { id: 'manage_assemblies', label: 'Gerenciar Assembleias' },
  { id: 'manage_surveys', label: 'Gerenciar Pesquisas/Censo' },
  { id: 'manage_communication', label: 'Gerenciar Comunicados' },
  { id: 'view_timeline', label: 'Ver Agenda' },
  { id: 'view_projects', label: 'Ver Projetos' },
  { id: 'send_suggestions', label: 'Enviar Sugestões' },
  { id: 'view_demographics', label: 'Ver Observatório Social' },
  { id: 'manage_settings', label: 'Gerenciar Configurações' },
  { id: 'manage_ai_keys', label: 'Gerenciar Chaves de IA' },
];

export const FINANCIAL_CATEGORIES = ['CONDOMÍNIO', 'DOAÇÃO', 'MANUTENÇÃO', 'SEGURANÇA', 'ADMINISTRATIVO', 'EVENTOS', 'OUTROS'];
