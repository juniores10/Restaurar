import { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { MainDashboard } from './MainDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';
import { EmployeeSchedule } from './EmployeeSchedule';
import { ScheduleManagement } from './ScheduleManagement';
import { EmployeeManagement } from './EmployeeManagement';
import { ProductionManagement } from './ProductionManagement';
import { EmployeeProductivity } from './EmployeeProductivity';
import { SuggestionsManagement } from './SuggestionsManagement';
import { EmployeeSuggestions } from './EmployeeSuggestions';
import { DocumentManagement } from './DocumentManagement';
import { EmployeeDocuments } from './EmployeeDocuments';
import { DataManagement } from './DataManagement';
import { NoticeManagement } from './NoticeManagement';
import { HolidayManagement } from './HolidayManagement';
import TimeTracking from './TimeTracking';
import { PayrollManagement } from './PayrollManagement';
import { EmployeePayroll } from './EmployeePayroll';
import { GateControl } from './GateControl';
import { GateValidation } from './GateValidation';
import { Portaria } from './Portaria';
import { AbsenteeismDashboard } from './absenteeism';
import { FactoryMaintenance } from './maintenance/FactoryMaintenance';
import { FreightManagement } from './logistics';
import { TeamProductivityManagement } from './team-productivity/TeamProductivityManagement';
import { EmployeeNotificationPanel } from './EmployeeNotificationPanel';
import { UserSessionsHistory } from './UserSessionsHistory';
import { useAuth } from '../contexts/AuthContext';

export function MainApp() {
  const { canManageSystem, isEmployee, isTerceirizado } = useAuth();
  const [currentView, setCurrentView] = useState(() => {
    return isTerceirizado() ? 'portaria' : 'dashboard';
  });
  const [showNoticesPanel, setShowNoticesPanel] = useState(false);
  const [showEmployeeNotifications, setShowEmployeeNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const handleToggleNoticesPanel = () => {
    if (currentView !== 'dashboard') {
      setCurrentView('dashboard');
    }
    setShowNoticesPanel(prev => !prev);
  };

  const handleToggleEmployeeNotifications = () => {
    setShowEmployeeNotifications(prev => !prev);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (isEmployee() || isTerceirizado()) ? <EmployeeDashboard /> : <MainDashboard showNoticesPanel={showNoticesPanel} onCloseNoticesPanel={() => setShowNoticesPanel(false)} onOpenNoticesPanel={() => setShowNoticesPanel(true)} onNavigate={setCurrentView} />;
      case 'employees':
        return canManageSystem() ? <EmployeeManagement /> : <EmployeeDashboard />;
      case 'production':
        return canManageSystem() ? <ProductionManagement /> : <EmployeeProductivity />;
      case 'schedule':
        return (isEmployee() || isTerceirizado()) ? <EmployeeSchedule /> : <ScheduleManagement />;
      case 'schedule-management':
        return canManageSystem() ? <ScheduleManagement /> : <EmployeeSchedule />;
      case 'time-tracking':
        return canManageSystem() ? <TimeTracking /> : <EmployeeDashboard />;
      case 'payroll':
        return canManageSystem() ? <PayrollManagement /> : <EmployeePayroll />;
      case 'gate-control':
        return canManageSystem() ? <GateControl /> : <EmployeeDashboard />;
      case 'gate-validation':
        return canManageSystem() ? <GateValidation /> : <EmployeeDashboard />;
      case 'team-productivity':
        return canManageSystem() ? <TeamProductivityManagement /> : <EmployeeDashboard />;
      case 'absenteeism':
        return canManageSystem() ? <AbsenteeismDashboard /> : <EmployeeDashboard />;
      case 'factory-maintenance':
        return <FactoryMaintenance />;
      case 'logistics':
        return canManageSystem() ? <FreightManagement /> : <EmployeeDashboard />;
      case 'portaria':
        return isTerceirizado() ? <Portaria /> : <EmployeeDashboard />;
      case 'suggestions':
        return canManageSystem() ? <SuggestionsManagement /> : <EmployeeSuggestions />;
      case 'notices':
        return canManageSystem() ? <NoticeManagement /> : <EmployeeDashboard />;
      case 'documents':
        return canManageSystem() ? <DocumentManagement /> : <EmployeeDocuments />;
      case 'data-management':
        return canManageSystem() ? <DataManagement /> : <EmployeeDashboard />;
      case 'holidays':
        return canManageSystem() ? <HolidayManagement /> : <EmployeeDashboard />;
      case 'user-sessions':
        return canManageSystem() ? <UserSessionsHistory /> : <EmployeeDashboard />;
      default:
        return (isEmployee() || isTerceirizado()) ? <EmployeeDashboard /> : <MainDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation
        currentView={currentView}
        onNavigate={setCurrentView}
        onToggleNoticesPanel={handleToggleNoticesPanel}
        showNoticesPanel={showNoticesPanel}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onToggleEmployeeNotifications={handleToggleEmployeeNotifications}
        showEmployeeNotifications={showEmployeeNotifications}
      />
      <main className={`${
        (isEmployee() || isTerceirizado())
          ? isSidebarCollapsed
            ? 'pt-14 pb-20 md:pb-0 md:pl-20'
            : 'pt-14 pb-20 md:pb-0 md:pl-64'
          : isSidebarCollapsed
            ? 'pt-16 md:pl-20'
            : 'pt-16 md:pl-64'
      }`}>
        {renderView()}
      </main>

      {(isEmployee() || isTerceirizado()) && (
        <EmployeeNotificationPanel
          isOpen={showEmployeeNotifications}
          onClose={() => setShowEmployeeNotifications(false)}
          onNavigate={setCurrentView}
        />
      )}
    </div>
  );
}
