import { Building2, Users, TrendingUp, MessageSquare, Bell, FileText, LogOut, Menu, X, Database, User, Home, CalendarDays, CalendarCheck, Clock, ChevronLeft, ChevronRight, ChevronDown, DollarSign, Shield, ShieldCheck, UserX, Wrench, Activity, Truck, Calendar, Package, CreditCard, BarChart3, MapPin, Layers, Briefcase, Circle, Tag, Target, Building } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { documentService } from '../services/documentService';
import { supabase } from '../lib/supabase';

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onToggleNoticesPanel?: () => void;
  showNoticesPanel?: boolean;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onToggleEmployeeNotifications?: () => void;
  showEmployeeNotifications?: boolean;
}

export function Navigation({ currentView, onNavigate, onToggleNoticesPanel, showNoticesPanel, isSidebarCollapsed = false, onToggleSidebar, onToggleEmployeeNotifications, showEmployeeNotifications }: NavigationProps) {
  const { user, employeeProfile, signOut, canManageSystem, isEmployee, isTerceirizado, selectedBranch, setSelectedBranch } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadDocsCount, setUnreadDocsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadEmployeeNotificationsCount, setUnreadEmployeeNotificationsCount] = useState(0);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['factory-maintenance', 'logistics', 'data-management']);

  useEffect(() => {
    if (employeeProfile && !canManageSystem()) {
      loadUnreadCount();
      loadUnreadEmployeeNotificationsCount();
      const interval = setInterval(loadUnreadCount, 30000);
      const notifInterval = setInterval(loadUnreadEmployeeNotificationsCount, 15000);
      return () => {
        clearInterval(interval);
        clearInterval(notifInterval);
      };
    }
  }, [employeeProfile?.id, employeeProfile?.user_type_id]);

  useEffect(() => {
    if (canManageSystem()) {
      loadUnreadNotificationsCount();
      const interval = setInterval(loadUnreadNotificationsCount, 15000);
      return () => clearInterval(interval);
    }
  }, [employeeProfile?.user_type_id]);

  async function loadUnreadNotificationsCount() {
    try {
      const { count } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      setUnreadNotificationsCount(count || 0);
    } catch (error) {
      console.error('Error loading notifications count:', error);
    }
  }

  async function loadUnreadEmployeeNotificationsCount() {
    try {
      const { count } = await supabase
        .from('employee_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      setUnreadEmployeeNotificationsCount(count || 0);
    } catch (error) {
      console.error('Error loading employee notifications count:', error);
    }
  }

  async function loadUnreadCount() {
    if (!employeeProfile) return;
    try {
      const count = await documentService.getUnreadCount(employeeProfile.id);
      setUnreadDocsCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }

  type MenuItem = {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    subItems?: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  };

  const adminMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'employees', label: 'Colaboradores', icon: Users },
    { id: 'schedule-management', label: 'Escala do Mês', icon: CalendarDays },
    { id: 'time-tracking', label: 'Controle de Ponto', icon: Clock },
    { id: 'payroll', label: 'Holerites e Ponto', icon: DollarSign },
    { id: 'production', label: 'Produtividade', icon: TrendingUp },
    { id: 'team-productivity', label: 'Produtividade Equipe', icon: Users },
    { id: 'absenteeism', label: 'Absenteísmo', icon: UserX },
    { id: 'gate-control', label: 'Controle Portaria', icon: Shield },
    { id: 'gate-validation', label: 'Validação', icon: ShieldCheck },
    { id: 'suggestions', label: 'Sugestões', icon: MessageSquare },
    { id: 'notices', label: 'Quadro de Avisos', icon: Bell },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'factory-maintenance', label: 'OS Manutencao', icon: Wrench, subItems: [
      { id: 'preventive-schedule', label: 'Agenda de Preventivas', icon: Calendar },
      { id: 'maintenance-reports', label: 'Relatorios', icon: BarChart3 },
    ] },
    { id: 'logistics', label: 'Logistica', icon: Truck, subItems: [
      { id: 'expedition', label: 'Expedicao', icon: Package },
      { id: 'freight-management', label: 'Gestao de Frete', icon: CreditCard },
    ] },
    { id: 'data-management', label: 'Cadastros', icon: Database, subItems: [
      { id: 'dm:branches', label: 'Filiais', icon: Building2 },
      { id: 'dm:workplaces', label: 'Locais', icon: MapPin },
      { id: 'dm:divisions', label: 'Divisões', icon: Layers },
      { id: 'dm:functions', label: 'Funções', icon: Briefcase },
      { id: 'dm:teams', label: 'Equipes', icon: Users },
      { id: 'dm:status', label: 'Status', icon: Circle },
      { id: 'dm:shift_times', label: 'Horarios de Turno', icon: Clock },
      { id: 'dm:day_options', label: 'Opcoes de Dia', icon: Calendar },
      { id: 'dm:productivity_categories', label: 'Categorias Produtividade', icon: Tag },
      { id: 'dm:goals_productivity', label: 'Metas Produtividade', icon: Target },
      { id: 'dm:company_logo', label: 'Logo da Empresa', icon: Building },
      { id: 'dm:maintenance_cadastro', label: 'Manutencao Fabrica', icon: Wrench },
      { id: 'dm:performance_adherence', label: 'Performance Aderencia', icon: Activity },
      { id: 'dm:suppliers', label: 'Fornecedores', icon: Truck },
    ] },
    { id: 'holidays', label: 'Feriados', icon: CalendarCheck },
    { id: 'user-sessions', label: 'Usuarios Online', icon: Activity },
  ];

  const employeeMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Meu Painel', icon: Home },
    { id: 'schedule', label: 'Minha Escala', icon: CalendarDays },
    { id: 'payroll', label: 'Holerites e Ponto', icon: DollarSign },
    { id: 'production', label: 'Produtividade', icon: TrendingUp },
    { id: 'suggestions', label: 'Sugestões', icon: MessageSquare },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'factory-maintenance', label: 'OS Manutencao', icon: Wrench, subItems: [
      { id: 'preventive-schedule', label: 'Agenda de Preventivas', icon: Calendar },
      { id: 'maintenance-reports', label: 'Relatorios', icon: BarChart3 },
    ] },
  ];

  const terceirizadoMenuItems: MenuItem[] = [
    { id: 'portaria', label: 'Portaria', icon: Shield },
    { id: 'dashboard', label: 'Meu Painel', icon: Home },
    { id: 'schedule', label: 'Minha Escala', icon: CalendarDays },
    { id: 'payroll', label: 'Holerites e Ponto', icon: DollarSign },
    { id: 'suggestions', label: 'Sugestões', icon: MessageSquare },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'factory-maintenance', label: 'OS Manutencao', icon: Wrench, subItems: [
      { id: 'preventive-schedule', label: 'Agenda de Preventivas', icon: Calendar },
      { id: 'maintenance-reports', label: 'Relatorios', icon: BarChart3 },
    ] },
  ];

  const menuItems = canManageSystem() ? adminMenuItems : (isTerceirizado() ? terceirizadoMenuItems : employeeMenuItems);

  const mobileNavItems = isEmployee() ? [
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'schedule', label: 'Escala', icon: CalendarDays },
    { id: 'payroll', label: 'Holerites', icon: DollarSign },
    { id: 'production', label: 'Produtiv.', icon: TrendingUp },
    { id: 'documents', label: 'Docs', icon: FileText },
  ] : isTerceirizado() ? [
    { id: 'portaria', label: 'Portaria', icon: Shield },
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'schedule', label: 'Escala', icon: CalendarDays },
    { id: 'payroll', label: 'Holerites', icon: DollarSign },
    { id: 'documents', label: 'Docs', icon: FileText },
  ] : [];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isEmployee() || isTerceirizado()) {
    return (
      <>
        <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 shadow-sm">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-base font-bold text-slate-800 truncate tracking-tight">Pion G Plus</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleEmployeeNotifications}
                className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                  showEmployeeNotifications
                    ? 'bg-sky-50 text-sky-600'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Notificacoes"
              >
                <Bell className="w-5 h-5" />
                {unreadEmployeeNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {unreadEmployeeNotificationsCount > 9 ? '9+' : unreadEmployeeNotificationsCount}
                  </span>
                )}
              </button>
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{employeeProfile?.full_name}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
            <div
              className="absolute top-0 left-0 bottom-0 w-72 bg-slate-900 shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <div className="px-3 py-3 bg-slate-800 rounded-lg mb-4 border border-slate-700">
                  <div className="flex items-center gap-3">
                    {employeeProfile?.photo_url ? (
                      <img src={employeeProfile.photo_url} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-500/30" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-sky-500/20 flex items-center justify-center ring-2 ring-sky-500/30">
                        <User className="w-4 h-4 text-sky-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{employeeProfile?.full_name}</p>
                      <p className="text-xs text-slate-400 truncate">{employeeProfile?.position_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="px-3 pb-4 space-y-0.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const showBadge = item.id === 'documents' && unreadDocsCount > 0;
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isExpanded = expandedMenus.includes(item.id);
                  const isActive = currentView === item.id || (hasSubItems && item.subItems!.some(sub => currentView === sub.id)) || (item.id === 'data-management' && currentView.startsWith('dm:'));
                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => {
                          if (hasSubItems) {
                            setExpandedMenus(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                            if (!isExpanded) onNavigate(item.id);
                          } else {
                            onNavigate(item.id);
                            setIsMobileMenuOpen(false);
                          }
                          if (item.id === 'documents') loadUnreadCount();
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-[13px] ${
                          isActive
                            ? 'bg-sky-600 text-white font-medium shadow-sm'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                        <span>{item.label}</span>
                        {showBadge && (
                          <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                            {unreadDocsCount > 99 ? '99+' : unreadDocsCount}
                          </span>
                        )}
                        {hasSubItems && (
                          <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </button>
                      {hasSubItems && isExpanded && (
                        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-700 pl-2.5">
                          {item.subItems!.map(sub => {
                            const SubIcon = sub.icon;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => { onNavigate(sub.id); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-all ${
                                  currentView === sub.id
                                    ? 'bg-sky-600/20 text-sky-400 font-medium'
                                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                                }`}
                              >
                                <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_8px_-2px_rgba(0,0,0,0.08)] safe-area-bottom">
          <div className="grid grid-cols-5 h-14">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const showBadge = item.id === 'documents' && unreadDocsCount > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    if (item.id === 'documents') loadUnreadCount();
                  }}
                  className={`relative flex flex-col items-center justify-center gap-0.5 transition-all ${
                    isActive ? 'text-sky-600' : 'text-slate-400'
                  }`}
                >
                  <div className={`relative p-1 rounded-lg transition-all ${isActive ? 'bg-sky-50' : ''}`}>
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-105' : ''}`} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unreadDocsCount > 9 ? '9+' : unreadDocsCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-sky-600' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <aside className={`hidden md:block fixed left-0 top-14 bottom-0 ${isSidebarCollapsed ? 'w-[68px]' : 'w-60'} bg-slate-900 overflow-y-auto transition-all duration-300 border-r border-slate-800`}>
          {onToggleSidebar && (
            <div className="flex justify-end px-3 py-2 border-b border-slate-800">
              <button
                onClick={onToggleSidebar}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
                title={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          )}

          <nav className="p-2 space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const showBadge = item.id === 'documents' && unreadDocsCount > 0;
              const hasSubItems = !!(item.subItems && item.subItems.length > 0);
              const isExpanded = expandedMenus.includes(item.id);
              const isActive = currentView === item.id || (hasSubItems && item.subItems!.some(sub => currentView === sub.id)) || (item.id === 'data-management' && currentView.startsWith('dm:'));
              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (hasSubItems && !isSidebarCollapsed) {
                        if (!expandedMenus.includes(item.id)) {
                          setExpandedMenus(prev => [...prev, item.id]);
                        }
                      }
                      onNavigate(item.id);
                      if (item.id === 'documents') loadUnreadCount();
                    }}
                    className={`w-full flex items-center gap-2.5 ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg transition-all text-[13px] ${
                      isActive
                        ? 'bg-sky-600 text-white font-medium shadow-sm shadow-sky-600/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!isSidebarCollapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {showBadge && (
                          <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                            {unreadDocsCount > 99 ? '99+' : unreadDocsCount}
                          </span>
                        )}
                        {hasSubItems && (
                          <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${(isExpanded || isActive) ? 'rotate-180' : ''}`} />
                        )}
                      </>
                    )}
                    {isSidebarCollapsed && showBadge && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                  {hasSubItems && (isExpanded || isActive) && !isSidebarCollapsed && (
                    <div className="mt-0.5 ml-3 space-y-0.5 border-l border-slate-700 pl-2.5">
                      {item.subItems!.map(sub => {
                        const SubIcon = sub.icon;
                        const isSubActive = currentView === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => onNavigate(sub.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-all ${
                              isSubActive
                                ? 'bg-sky-600/20 text-sky-400 font-medium'
                                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className={`${isSidebarCollapsed ? 'p-2' : 'p-3'} border-t border-slate-800`}>
            {!isSidebarCollapsed && (
              <div className="px-3 py-2.5 bg-slate-800 rounded-lg mb-3 border border-slate-700">
                <div className="flex items-center gap-2.5">
                  {employeeProfile?.photo_url ? (
                    <img src={employeeProfile.photo_url} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500/30" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center ring-2 ring-sky-500/30">
                      <User className="w-4 h-4 text-sky-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{employeeProfile?.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{employeeProfile?.user_type_name}</p>
                  </div>
                </div>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="flex justify-center mb-3">
                {employeeProfile?.photo_url ? (
                  <img src={employeeProfile.photo_url} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500/30" title={employeeProfile?.full_name} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center ring-2 ring-sky-500/30" title={employeeProfile?.full_name}>
                    <User className="w-4 h-4 text-sky-400" />
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-2.5 ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-sm`}
              title={isSidebarCollapsed ? 'Sair' : undefined}
            >
              <LogOut className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="font-medium text-[13px]">Sair</span>}
            </button>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <h1 className="text-base sm:text-lg font-bold text-slate-800 truncate tracking-tight">
                <span className="hidden sm:inline">Pion G Plus</span>
                <span className="sm:hidden">Pion G+</span>
              </h1>
              {selectedBranch && (
                <button
                  onClick={() => setSelectedBranch(null)}
                  className="ml-3 hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-medium transition-colors border border-sky-200"
                  title="Trocar filial"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {selectedBranch.trade_name}
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={onToggleNoticesPanel}
                className={`relative p-2 rounded-lg transition-all ${
                  showNoticesPanel
                    ? 'bg-sky-50 text-sky-600'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Quadro de Avisos"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-700">{employeeProfile?.full_name || user?.email}</div>
                <div className="text-xs text-slate-400">{employeeProfile?.user_type_name || 'Usuario'}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>

            <div className="md:hidden flex items-center gap-1">
              <button
                onClick={onToggleNoticesPanel}
                className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                  showNoticesPanel
                    ? 'bg-sky-50 text-sky-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-700 rounded-lg transition-all"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <aside className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block fixed left-0 top-14 bottom-0 ${isSidebarCollapsed ? 'w-[68px]' : 'w-60'} bg-slate-900 overflow-y-auto z-40 transition-all duration-300 border-r border-slate-800`}>
        {canManageSystem() && onToggleSidebar && (
          <div className="hidden md:flex justify-end px-3 py-2 border-b border-slate-800">
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
              title={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        )}

        <nav className="p-2 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const showBadge = item.id === 'documents' && unreadDocsCount > 0 && !canManageSystem();
            const hasSubItems = !!(item.subItems && item.subItems.length > 0);
            const isExpanded = expandedMenus.includes(item.id);
            const isActive = currentView === item.id || (hasSubItems && item.subItems!.some(sub => currentView === sub.id)) || (item.id === 'data-management' && currentView.startsWith('dm:'));
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasSubItems && !isSidebarCollapsed) {
                      setExpandedMenus(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                    } else {
                      onNavigate(item.id);
                    }
                    setIsMobileMenuOpen(false);
                    if (item.id === 'documents') loadUnreadCount();
                  }}
                  className={`w-full flex items-center gap-2.5 ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg transition-all text-[13px] ${
                    isActive && !hasSubItems
                      ? 'bg-sky-600 text-white font-medium shadow-sm shadow-sky-600/30'
                      : isActive && hasSubItems
                        ? 'text-white bg-slate-800'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {showBadge && (
                        <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                          {unreadDocsCount > 99 ? '99+' : unreadDocsCount}
                        </span>
                      )}
                      {hasSubItems && (
                        <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </>
                  )}
                  {isSidebarCollapsed && showBadge && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                {hasSubItems && isExpanded && !isSidebarCollapsed && (
                  <div className="mt-0.5 ml-3 space-y-0.5 border-l border-slate-700 pl-2.5">
                    {item.subItems!.map(sub => {
                      const SubIcon = sub.icon;
                      const isSubActive = currentView === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            onNavigate(sub.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-all ${
                            isSubActive
                              ? 'bg-sky-600/20 text-sky-400 font-medium'
                              : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                          }`}
                        >
                          <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="md:hidden p-3 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
