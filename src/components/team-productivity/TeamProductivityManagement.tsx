import { useState } from 'react';
import { FileSpreadsheet, BarChart3, Users, Settings2, Layers } from 'lucide-react';
import { TeamProductivityUpload } from './TeamProductivityUpload';
import { TeamProductivityDashboard } from './TeamProductivityDashboard';
import { TeamProductivityReferences } from './TeamProductivityReferences';
import { TeamProductivityTotalReferences } from './TeamProductivityTotalReferences';

type Tab = 'lancamentos' | 'referencias' | 'referencias_totais' | 'dashboard';

export function TeamProductivityManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('lancamentos');

  const tabs: { key: Tab; label: string; icon: typeof FileSpreadsheet }[] = [
    { key: 'lancamentos', label: 'Lancamentos', icon: FileSpreadsheet },
    { key: 'referencias', label: 'Referencias', icon: Settings2 },
    { key: 'referencias_totais', label: 'Ref. Totais', icon: Layers },
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Produtividade Equipe</h2>
            <p className="text-sm text-gray-500">Lancamento e acompanhamento de producao por equipe</p>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mt-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'lancamentos' && <TeamProductivityUpload />}
      {activeTab === 'referencias' && <TeamProductivityReferences />}
      {activeTab === 'referencias_totais' && <TeamProductivityTotalReferences />}
      {activeTab === 'dashboard' && <TeamProductivityDashboard />}
    </div>
  );
}
