import { Building2, Users, TrendingUp, MessageSquare, Bell, FileText, LogOut, Menu, X, Database, User, Home, CalendarDays, CalendarCheck, Clock, ChevronLeft, ChevronRight, ChevronDown, DollarSign, Shield, ShieldCheck, UserX, Wrench, Activity, Truck, Calendar } from 'lucide-react';
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
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['factory-maintenance']);

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
    ] },
    { id: 'logistics', label: 'Logistica', icon: Truck },
    { id: 'data-management', label: 'Cadastros', icon: Database },
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
        <nav className="gradient-pion shadow-xl fixed top-0 left-0 right-0 z-50 border-b border-white/10">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden w-11 h-11 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-white truncate">Pion G Plus</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleEmployeeNotifications}
                className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
                  showEmployeeNotifications
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Notificacoes"
              >
                <Bell className="w-5 h-5" />
                {unreadEmployeeNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    {unreadEmployeeNotificationsCount > 9 ? '9+' : unreadEmployeeNotificationsCount}
                  </span>
                )}
              </button>
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-white truncate max-w-[150px]">{employeeProfile?.full_name}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-11 h-11 flex items-center justify-center text-white/80 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
            <div
              className="absolute top-0 left-0 bottom-0 w-72 gradient-pion-dark shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-11 h-11 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <div className="px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl mb-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    {employeeProfile?.photo_url ? (
                      <img src={employeeProfile.photo_url} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-pion-cyan/50" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-pion-cyan/20 flex items-center justify-center ring-2 ring-pion-cyan/50">
                        <User className="w-5 h-5 text-pion-cyan" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{employeeProfile?.full_name}</p>
                      <p className="text-xs text-pion-cyan/80 truncate">{employeeProfile?.position_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="px-4 pb-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const showBadge = item.id === 'documents' && unreadDocsCount > 0;
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isExpanded = expandedMenus.includes(item.id);
                  const isActive = currentView === item.id || (hasSubItems && item.subItems!.some(sub => currentView === sub.id));
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
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all min-h-[44px] ${
                          isActive
                            ? 'bg-pion-cyan text-white shadow-lg shadow-pion-cyan/30'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                        {showBadge && (
                          <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                            {unreadDocsCount > 99 ? '99+' : unreadDocsCount}
                          </span>
                        )}
                        {hasSubItems && (
                          <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </button>
                      {hasSubItems && isExpanded && (
                        <div className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3">
                          {item.subItems!.map(sub => {
                            const SubIcon = sub.icon;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => { onNavigate(sub.id); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all min-h-[40px] ${
                                  currentView === sub.id
                                    ? 'bg-white/20 text-white font-medium'
                                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <SubIcon className="w-4 h-4 flex-shrink-0" />
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

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_-4px_rgba(0,90,143,0.15)] safe-area-bottom">
          <div className="grid grid-cols-5 h-16">
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
                    isActive ? 'text-pion-cyan' : 'text-gray-400'
                  }`}
                >
                  <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-pion-cyan/10' : ''}`}>
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadDocsCount > 9 ? '9+' : unreadDocsCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold transition-all ${isActive ? 'text-pion-cyan' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-pion-cyan"></div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <aside className={`hidden md:block fixed left-0 top-14 bottom-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'} gradient-pion-dark overflow-y-auto transition-all duration-300 shadow-2xl`}>
          {onToggleSidebar && (
            <div className="flex justify-end p-2 border-b border-white/10">
              <button
                onClick={onToggleSidebar}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>
          )}

          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const showBadge = item.id === 'documents' && unreadDocsCount > 0;
              const hasSubItems = !!(item.subItems && item.subItems.length > 0);
              const isExpanded = expandedMenus.includes(item.id);
              const isActive = currentView === item.id || (hasSubItems && item.subItems!.some(sub => currentView === sub.id));
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
                    className={`w-full flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center px-3' : 'px-4'} py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-pion-cyan text-white shadow-lg shadow-pion-cyan/30'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && (
                      <>
                        <span className="font-medium">{item.label}</span>
                        {showBadge && (
                          <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                            {unreadDocsCount > 99 ? '99+' : unreadDocsCount}
                          </span>
                        )}
                        {hasSubItems && (
                          <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${(isExpanded || isActive) ? 'rotate-180' : ''}`} />
                        )}
                      </>
                    )}
                    {isSidebarCollapsed && showBadge && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                  {hasSubItems && (isExpanded || isActive) && !isSidebarCollapsed && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-white/20 pl-3">
                      {item.subItems!.map(sub => {
                        const SubIcon = sub.icon;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => onNavigate(sub.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                              currentView === sub.id
                                ? 'bg-white/20 text-white font-medium'
                                : 'text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <SubIcon className="w-4 h-4 flex-shrink-0" />
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

          <div className={`${isSidebarCollapsed ? 'p-2' : 'p-4'} border-t border-white/10`}>
            {!isSidebarCollapsed && (
              <div className="px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl mb-3 border border-white/10">
                <div className="flex items-center gap-3">
                  {employeeProfile?.photo_url ? (
                    <img src={employeeProfile.photo_url} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-pion-cyan/50" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-pion-cyan/20 flex items-center justify-center ring-2 ring-pion-cyan/50">
                      <User className="w-5 h-5 text-pion-cyan" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{employeeProfile?.full_name}</p>
                    <p className="text-xs text-pion-cyan/80 truncate">{employeeProfile?.user_type_name}</p>
                  </div>
                </div>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="flex justify-center mb-3">
                {employeeProfile?.photo_url ? (
                  <img src={employeeProfile.photo_url} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-pion-cyan/50" title={employeeProfile?.full_name} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-pion-cyan/20 flex items-center justify-center ring-2 ring-pion-cyan/50" title={employeeProfile?.full_name}>
                    <User className="w-5 h-5 text-pion-cyan" />
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center px-3' : 'px-4'} py-3 text-red-300 hover:bg-red-500/20 hover:text-red-200 rounded-xl transition-colors`}
              title={isSidebarCollapsed ? 'Sair' : undefined}
            >
              <LogOut className="w-5 h-5" />
              {!isSidebarCollapsed && <span className="font-semibold">Sair</span>}
            </button>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      <nav className="gradient-pion shadow-2xl fixed top-0 left-0 right-0 z-50 border-b border-white/10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">
                <span className="hidden sm:inline">Pion G Plus - Sistema de Gestão Empresarial</span>
                <span className="sm:hidden">Pion G Plus</span>
              </h1>
              {selectedBranch && (
                <button
                  onClick={() => setSelectedBranch(null)}
                  className="ml-3 hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 text-xs font-medium transition-colors border border-white/10"
                  title="Trocar filial"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {selectedBranch.trade_name}
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={onToggleNoticesPanel}
                className={`relative p-2 rounded-xl transition-all ${
                  showNoticesPanel
                    ? 'bg-white/20 text-white backdrop-blur-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Quadro de Avisos"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
              <div className="text-right">
                <div className="text-sm font-semibold text-white">{employeeProfile?.full_name || user?.email}</div>
                <div className="text-xs text-pion-cyan/90">{employeeProfile?.user_type_name || 'Usuario'}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-white/10 hover:bg-red-500/20 hover:text-red-200 rounded-xl transition-colors font-semibold backdrop-blur-sm"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>

            <div className="md:hidden flex items-center gap-1">
              <button
                onClick={onToggleNoticesPanel}
                className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
                  showNoticesPanel
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-11 h-11 flex items-center justify-center text-white/80 hover:text-white rounded-xl transition-all"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <aside className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block fixed left-0 top-16 bottom-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'} gradient-pion-dark overflow-y-auto z-40 transition-all duration-300 shadow-2xl`}>
        {canManageSystem() && onToggleSidebar && (
          <div className="hidden md:flex justify-end p-2 border-b border-white/10">
            <button
              onClick={onToggleSidebar}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        )}

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const showBadge = item.id === 'documents' && unreadDocsCount > 0 && !canManageSystem();
            const hasSubItems = !!(item.subItems && item.subItems.length > 0);
            const isExpanded = expandedMenus.includes(item.id);
            const isActive = currentView === item.id || (hasSubItems && item.subItems!.some(sub => currentView === sub.id));
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
                    setIsMobileMenuOpen(false);
                    if (item.id === 'documents') loadUnreadCount();
                  }}
                  className={`w-full flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center px-3' : 'px-4'} py-3.5 rounded-xl transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-pion-cyan text-white shadow-lg shadow-pion-cyan/30'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      {showBadge && (
                        <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                          {unreadDocsCount > 99 ? '99+' : unreadDocsCount}
                        </span>
                      )}
                      {hasSubItems && (
                        <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${(isExpanded || isActive) ? 'rotate-180' : ''}`} />
                      )}
                    </>
                  )}
                  {isSidebarCollapsed && showBadge && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                {hasSubItems && (isExpanded || isActive) && !isSidebarCollapsed && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-white/20 pl-3">
                    {item.subItems!.map(sub => {
                      const SubIcon = sub.icon;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            onNavigate(sub.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                            currentView === sub.id
                              ? 'bg-white/20 text-white font-medium'
                              : 'text-white/60 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <SubIcon className="w-4 h-4 flex-shrink-0" />
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

        <div className="md:hidden p-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-500/20 hover:text-red-200 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
