import { useState, useEffect } from 'react';
import { Package, TrendingUp, Clock, AlertTriangle, CheckCircle2, Truck, DollarSign, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalShipments: number;
  inTransit: number;
  delivered: number;
  delayed: number;
  avgFreightPercentage: number;
  totalFreightValue: number;
  avgSlaCompliance: number;
  totalNfValue: number;
}

interface FreightDashboardProps {
  onNavigate: (tab: any) => void;
}

export function FreightDashboard({ onNavigate }: FreightDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalShipments: 0,
    inTransit: 0,
    delivered: 0,
    delayed: 0,
    avgFreightPercentage: 0,
    totalFreightValue: 0,
    avgSlaCompliance: 0,
    totalNfValue: 0,
  });
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('180');

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data: records, error } = await supabase
        .from('freight_records')
        .select('*')
        .gte('shipment_date', startDateStr)
        .order('shipment_date', { ascending: false });

      if (error) throw error;

      const data = records || [];

      const inTransit = data.filter(r => r.status === 'em_transporte').length;
      const delivered = data.filter(r => r.status === 'entregue_prazo' || r.status === 'entregue_atraso').length;
      const delayed = data.filter(r => r.status === 'atrasado' || r.status === 'entregue_atraso').length;
      const totalFreightValue = data.reduce((sum, r) => sum + (Number(r.freight_value) || 0), 0);
      const totalNfValue = data.reduce((sum, r) => sum + (Number(r.nf_value) || 0), 0);
      const avgFreightPercentage = totalNfValue > 0 ? (totalFreightValue / totalNfValue) * 100 : 0;

      const deliveredRecords = data.filter(r => r.status === 'entregue_prazo');
      const avgSlaCompliance = data.length > 0 ? (deliveredRecords.length / data.length) * 100 : 0;

      setStats({
        totalShipments: data.length,
        inTransit,
        delivered,
        delayed,
        avgFreightPercentage: Math.round(avgFreightPercentage * 100) / 100,
        totalFreightValue,
        avgSlaCompliance: Math.round(avgSlaCompliance * 10) / 10,
        totalNfValue,
      });

      setRecentRecords(data.slice(0, 8));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      em_transporte: 'Em Transporte',
      entregue_prazo: 'Entregue no Prazo',
      entregue_atraso: 'Entregue c/ Atraso',
      atrasado: 'Atrasado',
      cancelado: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      em_transporte: 'bg-blue-100 text-blue-700',
      entregue_prazo: 'bg-green-100 text-green-700',
      entregue_atraso: 'bg-orange-100 text-orange-700',
      atrasado: 'bg-red-100 text-red-700',
      cancelado: 'bg-slate-100 text-slate-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
              <div className="h-10 w-10 bg-slate-200 rounded-lg mb-3"></div>
              <div className="h-7 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800">Visao Geral</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-xs sm:text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="7">Ultimos 7 dias</option>
          <option value="15">Ultimos 15 dias</option>
          <option value="30">Ultimos 30 dias</option>
          <option value="60">Ultimos 60 dias</option>
          <option value="90">Ultimos 90 dias</option>
          <option value="180">Ultimos 6 meses</option>
          <option value="365">Ultimo ano</option>
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-center w-9 h-9 bg-teal-100 rounded-lg mb-2">
            <Package className="w-4 h-4 text-teal-700" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.totalShipments}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Total Envios</p>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-center w-9 h-9 bg-blue-100 rounded-lg mb-2">
            <Truck className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.inTransit}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Em Transporte</p>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-center w-9 h-9 bg-green-100 rounded-lg mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-700" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.delivered}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Entregues</p>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-center w-9 h-9 bg-red-100 rounded-lg mb-2">
            <AlertTriangle className="w-4 h-4 text-red-700" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.delayed}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Atrasados</p>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-center w-9 h-9 bg-emerald-100 rounded-lg mb-2">
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900">{formatCurrency(stats.totalFreightValue)}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Valor Total Frete</p>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-center w-9 h-9 bg-amber-100 rounded-lg mb-2">
            <BarChart3 className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.avgFreightPercentage}%</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">% Frete s/ NF</p>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-center w-9 h-9 bg-sky-100 rounded-lg mb-2">
            <TrendingUp className="w-4 h-4 text-sky-700" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.avgSlaCompliance}%</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">SLA Cumprido</p>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-center w-9 h-9 bg-slate-100 rounded-lg mb-2">
            <Clock className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900">{formatCurrency(stats.totalNfValue)}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Valor Total NF</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Ultimos Lancamentos</h3>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            Ver todos
          </button>
        </div>
        {recentRecords.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Nenhum lancamento encontrado</p>
            <button
              onClick={() => onNavigate('entries')}
              className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Criar primeiro lancamento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Data</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">NF</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600 hidden sm:table-cell">Cliente</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600 hidden md:table-cell">Transportadora</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600">Frete</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map(record => (
                  <tr key={record.id} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-700">
                      {new Date(record.shipment_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-medium">{record.nf_number || '-'}</td>
                    <td className="py-2 px-3 text-slate-600 hidden sm:table-cell truncate max-w-[150px]">
                      {record.client_name || '-'}
                    </td>
                    <td className="py-2 px-3 text-slate-600 hidden md:table-cell">
                      {record.carrier_name || '-'}
                    </td>
                    <td className="py-2 px-3 text-slate-700 text-right font-medium">
                      {formatCurrency(record.freight_value || 0)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
