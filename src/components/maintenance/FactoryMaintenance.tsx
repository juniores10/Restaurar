import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, BarChart3, List, Trash2, CreditCard as Edit2, Eye, Wrench, Download, RefreshCw, ArrowRightCircle, CheckCircle, XCircle, CheckCircle2 } from 'lucide-react';
import { maintenanceService } from '../../services/maintenanceService';
import { MaintenanceOrderForm } from './MaintenanceOrderForm';
import { MaintenanceOrderDetail } from './MaintenanceOrderDetail';
import { MaintenanceDashboard } from './MaintenanceDashboard';
import { StatusUpdateModal } from './StatusUpdateModal';
import { CloseOrderModal } from './CloseOrderModal';
import { MaintenanceNotificationBell } from './MaintenanceNotificationBell';
import { MaintenanceApprovalModal } from './MaintenanceApprovalModal';
import { useAuth } from '../../contexts/AuthContext';
import type { MaintenanceOrder, FaultType, ProblemOrigin, OrderPriority, OrderStatus } from '../../types/maintenance';
import { PROBLEM_ORIGINS, ORDER_PRIORITIES, ORDER_STATUSES } from '../../types/maintenance';
import { maintenanceCadastroService, type MaintenanceOccurrence } from '../../services/maintenanceCadastroService';

type ViewMode = 'list' | 'dashboard';

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  'Aberto': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'Em Andamento': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Aguardando Peça': { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  'Concluído': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Cancelado': { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

const priorityConfig: Record<string, { bg: string; text: string }> = {
  'Baixa': { bg: 'bg-sky-100', text: 'text-sky-700' },
  'Média': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Alta': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Crítica': { bg: 'bg-red-100', text: 'text-red-700' },
};

const faultConfig: Record<string, { bg: string; text: string }> = {
  'Elétrica': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'Operacional': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Equipamento': { bg: 'bg-rose-100', text: 'text-rose-800' },
};

export function FactoryMaintenance() {
  const { canManageSystem, isAdmin: authIsAdmin, isManager, isLider, user, employeeProfile } = useAuth();
  const isAdmin = canManageSystem();
  const canApprove = isAdmin || authIsAdmin() || isManager() || isLider();
  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [filterFault, setFilterFault] = useState<FaultType | ''>('');
  const [filterOrigin, setFilterOrigin] = useState<ProblemOrigin | ''>('');
  const [filterPriority, setFilterPriority] = useState<OrderPriority | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [occurrenceList, setOccurrenceList] = useState<MaintenanceOccurrence[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<MaintenanceOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<MaintenanceOrder | null>(null);
  const [statusOrder, setStatusOrder] = useState<MaintenanceOrder | null>(null);
  const [approvingNotification, setApprovingNotification] = useState<any | null>(null);
  const [closingOrder, setClosingOrder] = useState<MaintenanceOrder | null>(null);

  useEffect(() => {
    loadOrders();
    maintenanceCadastroService.getOccurrences().then(data => setOccurrenceList(data.filter(o => o.status === 0)));
  }, []);

  useEffect(() => {
    if (orders.length === 0) return;
    const pendingId = sessionStorage.getItem('maintenance_open_order_id');
    if (pendingId) {
      sessionStorage.removeItem('maintenance_open_order_id');
      const order = orders.find(o => o.id === pendingId);
      if (order) setViewingOrder(order);
    }
  }, [orders]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await maintenanceService.listOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (search) {
        const q = search.toLowerCase();
        const match = o.title.toLowerCase().includes(q)
          || o.order_number.toLowerCase().includes(q)
          || o.equipment.toLowerCase().includes(q)
          || o.location.toLowerCase().includes(q)
          || o.requested_by.toLowerCase().includes(q)
          || o.assigned_to.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterStatus && o.status !== filterStatus) return false;
      if (filterFault && o.fault_type !== filterFault) return false;
      if (filterOrigin && o.problem_origin !== filterOrigin) return false;
      if (filterPriority && o.priority !== filterPriority) return false;
      return true;
    });
  }, [orders, search, filterStatus, filterFault, filterOrigin, filterPriority]);

  const handleCreate = () => {
    setEditingOrder(null);
    setShowForm(true);
  };

  const handleEdit = (order: MaintenanceOrder) => {
    setViewingOrder(null);
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleView = (order: MaintenanceOrder) => {
    setViewingOrder(order);
  };

  const handleDelete = async (order: MaintenanceOrder) => {
    if (!confirm(`Excluir o chamado ${order.order_number}?`)) return;
    try {
      await maintenanceService.deleteOrder(order.id);
      loadOrders();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingOrder(null);
    loadOrders();
  };

  const handleExportCSV = () => {
    const headers = ['Numero', 'Titulo', 'Status', 'Prioridade', 'Tipo Falha', 'Origem', 'Local', 'Equipamento', 'Solicitante', 'Tecnico', 'Downtime Est.', 'Downtime Real', 'Custo Est.', 'Custo Real', 'Abertura', 'Conclusao'];
    const rows = filteredOrders.map(o => [
      o.order_number, o.title, o.status, o.priority, o.fault_type, o.problem_origin, o.location, o.equipment,
      o.requested_by, o.assigned_to, o.estimated_downtime_hours, o.actual_downtime_hours, o.estimated_cost, o.actual_cost,
      o.created_at ? new Date(o.created_at).toLocaleDateString('pt-BR') : '',
      o.completed_at ? new Date(o.completed_at).toLocaleDateString('pt-BR') : '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manutencao_fabrica_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInlineApprove = async (order: MaintenanceOrder) => {
    try {
      const notifications = await maintenanceService.getPendingNotificationsForUser(user!.id);
      const notif = notifications.find((n: any) => n.order_id === order.id);
      if (notif) {
        setApprovingNotification(notif);
      } else {
        const syntheticNotif = { id: 'inline-' + order.id, order_id: order.id, maintenance_orders: order };
        setApprovingNotification(syntheticNotif);
      }
    } catch {
      const syntheticNotif = { id: 'inline-' + order.id, order_id: order.id, maintenance_orders: order };
      setApprovingNotification(syntheticNotif);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterFault('');
    setFilterOrigin('');
    setFilterPriority('');
  };

  const hasActiveFilters = filterStatus || filterFault || filterOrigin || filterPriority;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              Manutencao Fabrica
            </h1>
            <p className="text-sm text-gray-500 mt-1">Gestao de chamados de manutencao industrial</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canApprove && (
              <MaintenanceNotificationBell onOrdersChanged={loadOrders} />
            )}

            {isAdmin && (
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Lista
                </button>
                <button
                  onClick={() => setViewMode('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'dashboard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </button>
              </div>
            )}

            {isAdmin && (
              <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            )}

            <button onClick={handleCreate} className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-teal-500/25">
              <Plus className="w-4 h-4" />
              Solicitacao de Manutencao
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'dashboard' ? (
        <MaintenanceDashboard orders={orders} />
      ) : (
        <>
          <div className="mb-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por titulo, numero, equipamento, local..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                    {[filterStatus, filterFault, filterOrigin, filterPriority].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button
                onClick={loadOrders}
                className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                title="Atualizar"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {showFilters && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
                      <option value="">Todos</option>
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo de Falha</label>
                    <select value={filterFault} onChange={e => setFilterFault(e.target.value as any)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
                      <option value="">Todos</option>
                      {occurrenceList.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Origem</label>
                    <select value={filterOrigin} onChange={e => setFilterOrigin(e.target.value as any)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
                      <option value="">Todas</option>
                      {PROBLEM_ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Prioridade</label>
                    <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
                      <option value="">Todas</option>
                      {ORDER_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="mt-3 text-xs font-medium text-teal-600 hover:text-teal-800 transition-colors">
                    Limpar todos os filtros
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 mb-3">
            {filteredOrders.length} chamado{filteredOrders.length !== 1 ? 's' : ''} encontrado{filteredOrders.length !== 1 ? 's' : ''}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 text-teal-500 animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum chamado encontrado</p>
              <p className="text-sm text-gray-400 mt-1">
                {orders.length === 0 ? 'Clique em "Novo Chamado" para comecar' : 'Tente ajustar os filtros'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map(order => {
                const sConf = statusConfig[order.status] || statusConfig['Aberto'];
                const pConf = priorityConfig[order.priority] || priorityConfig['Média'];
                const fConf = faultConfig[order.fault_type] || faultConfig['Equipamento'];

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all p-4 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-gray-400">{order.order_number}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${sConf.bg} ${sConf.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sConf.dot}`}></span>
                            {order.status}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${pConf.bg} ${pConf.text}`}>
                            {order.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${fConf.bg} ${fConf.text}`}>
                            {order.fault_type}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{order.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                          {order.equipment && <span>Equip: {order.equipment}</span>}
                          {order.location && <span>Local: {order.location}</span>}
                          {order.assigned_to && <span>Tec: {order.assigned_to}</span>}
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {canApprove && order.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleInlineApprove(order)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium transition-colors"
                              title="Aprovar"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Aprovar
                            </button>
                            <button
                              onClick={async () => {
                                const reason = prompt('Motivo da rejeicao:');
                                if (!reason?.trim()) return;
                                try {
                                  const notifs = await maintenanceService.getPendingNotificationsForUser(user!.id);
                                  const notif = notifs.find((n: any) => n.order_id === order.id);
                                  await maintenanceService.rejectOrder(order.id, employeeProfile?.full_name ?? 'Gestor', notif?.id ?? 'inline-' + order.id, reason);
                                  loadOrders();
                                } catch (err: any) {
                                  alert('Erro ao rejeitar: ' + err.message);
                                }
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-medium transition-colors"
                              title="Rejeitar"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Rejeitar
                            </button>
                          </>
                        )}
                        {canApprove && order.approval_status === 'approved' && order.status !== 'Concluído' && order.status !== 'Cancelado' && (
                          <button
                            onClick={() => setClosingOrder(order)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                            title="Fechar OS"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Fechar OS
                          </button>
                        )}
                        <button
                          onClick={() => handleView(order)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setStatusOrder(order)}
                              className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Atualizar Status"
                            >
                              <ArrowRightCircle className="w-4 h-4 text-amber-600" />
                            </button>
                            <button
                              onClick={() => handleEdit(order)}
                              className="p-2 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4 text-teal-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(order)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showForm && (
        <MaintenanceOrderForm
          order={editingOrder}
          onClose={() => { setShowForm(false); setEditingOrder(null); }}
          onSaved={handleSaved}
        />
      )}

      {viewingOrder && (
        <MaintenanceOrderDetail
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
          onEdit={() => handleEdit(viewingOrder)}
        />
      )}

      {statusOrder && (
        <StatusUpdateModal
          order={statusOrder}
          onClose={() => setStatusOrder(null)}
          onSaved={() => { setStatusOrder(null); loadOrders(); }}
        />
      )}

      {approvingNotification && (
        <MaintenanceApprovalModal
          notification={approvingNotification}
          approverName={employeeProfile?.full_name ?? 'Gestor'}
          onClose={() => setApprovingNotification(null)}
          onApproved={() => { setApprovingNotification(null); loadOrders(); }}
          onRejected={() => { setApprovingNotification(null); loadOrders(); }}
        />
      )}

      {closingOrder && (
        <CloseOrderModal
          order={closingOrder}
          onClose={() => setClosingOrder(null)}
          onSaved={() => { setClosingOrder(null); loadOrders(); }}
        />
      )}
    </div>
  );
}
