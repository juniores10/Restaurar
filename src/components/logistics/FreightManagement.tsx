import { useState } from 'react';
import { Truck, LayoutDashboard, PlusCircle, History, Building2, BarChart3, Settings, FileText } from 'lucide-react';
import { FreightDashboard } from './FreightDashboard';
import { FreightEntries } from './FreightEntries';
import { FreightHistory } from './FreightHistory';
import { FreightCarriers } from './FreightCarriers';
import { FreightReports } from './FreightReports';
import { FreightIndicators } from './FreightIndicators';
import { FreightSettings } from './FreightSettings';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'entries', label: 'Lancamentos', icon: PlusCircle },
  { id: 'history', label: 'Historico', icon: History },
  { id: 'carriers', label: 'Transportadoras', icon: Building2 },
  { id: 'reports', label: 'Relatorios', icon: FileText },
  { id: 'indicators', label: 'Indicadores', icon: BarChart3 },
  { id: 'settings', label: 'Configuracoes', icon: Settings },
] as const;

type TabId = typeof tabs[number]['id'];

export function FreightManagement() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <FreightDashboard onNavigate={setActiveTab} />;
      case 'entries': return <FreightEntries />;
      case 'history': return <FreightHistory />;
      case 'carriers': return <FreightCarriers />;
      case 'reports': return <FreightReports />;
      case 'indicators': return <FreightIndicators />;
      case 'settings': return <FreightSettings />;
      default: return <FreightDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-teal-100 rounded-xl">
          <Truck className="w-5 h-5 text-teal-700" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Gestao de Fretes</h1>
          <p className="text-xs sm:text-sm text-slate-500">Modulo de Logistica</p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 sm:mb-6 scrollbar-hide">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {renderContent()}
    </div>
  );
}
