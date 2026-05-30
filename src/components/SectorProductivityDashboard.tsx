import { Target } from 'lucide-react';
import EmployeeProductivityAnalysis from './EmployeeProductivityAnalysis';

export default function SectorProductivityDashboard() {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Target className="h-7 w-7 text-pion-deep-blue" />
              Produtividade do Setor
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Análise de metas e desempenho dos colaboradores
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <EmployeeProductivityAnalysis />
      </div>
    </div>
  );
}
