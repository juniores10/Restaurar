import { useState } from 'react';
import { X, ArrowRightCircle, Clock, Package, CheckCircle2, Save } from 'lucide-react';
import { maintenanceService } from '../../services/maintenanceService';
import type { MaintenanceOrder, OrderStatus } from '../../types/maintenance';

interface Props {
  order: MaintenanceOrder;
  onClose: () => void;
  onSaved: () => void;
}

const quickStatuses: { value: OrderStatus; label: string; icon: typeof Clock; color: string; bg: string; border: string }[] = [
  { value: 'Em Andamento', label: 'Em Andamento', icon: ArrowRightCircle, color: 'text-amber-700', bg: 'bg-amber-50 hover:bg-amber-100', border: 'border-amber-300 ring-amber-200' },
  { value: 'Aguardando Peça', label: 'Aguardando Peca', icon: Package, color: 'text-sky-700', bg: 'bg-sky-50 hover:bg-sky-100', border: 'border-sky-300 ring-sky-200' },
  { value: 'Concluído', label: 'Concluido', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 hover:bg-emerald-100', border: 'border-emerald-300 ring-emerald-200' },
];

export function StatusUpdateModal({ order, onClose, onSaved }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [resolutionNotes, setResolutionNotes] = useState(order.resolution_notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (selectedStatus === order.status && resolutionNotes === (order.resolution_notes || '')) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<MaintenanceOrder> = { status: selectedStatus, resolution_notes: resolutionNotes };

      if (selectedStatus === 'Em Andamento' && !order.started_at) {
        updates.started_at = new Date().toISOString();
      }
      if (selectedStatus === 'Concluído' && !order.completed_at) {
        updates.completed_at = new Date().toISOString();
      }

      await maintenanceService.updateOrder(order.id, updates);
      onSaved();
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Atualizar Status</h3>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{order.order_number} - {order.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Selecione o novo status</label>
            <div className="grid gap-2">
              {quickStatuses.map(s => {
                const Icon = s.icon;
                const isSelected = selectedStatus === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => setSelectedStatus(s.value)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? `${s.border} ${s.bg} ring-2 shadow-sm`
                        : 'border-gray-150 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? s.bg : 'bg-gray-100'}`}>
                      <Icon className={`w-5 h-5 ${isSelected ? s.color : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm font-semibold ${isSelected ? s.color : 'text-gray-700'}`}>{s.label}</span>
                      {s.value === 'Em Andamento' && (
                        <p className="text-[11px] text-gray-400 mt-0.5">Trabalho iniciado no chamado</p>
                      )}
                      {s.value === 'Aguardando Peça' && (
                        <p className="text-[11px] text-gray-400 mt-0.5">Aguardando material para continuar</p>
                      )}
                      {s.value === 'Concluído' && (
                        <p className="text-[11px] text-gray-400 mt-0.5">Servico finalizado com sucesso</p>
                      )}
                    </div>
                    {isSelected && (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${s.bg}`}>
                        <CheckCircle2 className={`w-4 h-4 ${s.color}`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Observacoes / Notas de resolucao</label>
            <textarea
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              rows={3}
              placeholder="Descreva o andamento ou resolucao do chamado..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
