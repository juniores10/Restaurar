import { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, ClipboardList, User, Wrench, Clock, DollarSign, Search, Plus, Trash2, ChevronDown } from 'lucide-react';
import { maintenanceService } from '../../services/maintenanceService';
import { maintenanceCadastroService, type MaintenanceTechnician, type MaintenanceMaterial } from '../../services/maintenanceCadastroService';
import type { MaintenanceOrder } from '../../types/maintenance';

interface SelectedMaterial {
  id: string;
  name: string;
  unit: string;
  warehouse_code: string;
  quantity: number;
}

interface ServiceOrderData {
  assigned_to: string;
  started_at: string;
  estimated_completion: string;
  notes: string;
  estimated_downtime_hours: number;
  estimated_cost: number;
  materials_needed: SelectedMaterial[];
}

interface Props {
  order: MaintenanceOrder;
  onClose: () => void;
  onSaved: () => void;
}

export function ServiceOrderForm({ order, onClose, onSaved }: Props) {
  const [form, setForm] = useState<ServiceOrderData>({
    assigned_to: order.assigned_to ?? '',
    started_at: new Date().toISOString().slice(0, 16),
    estimated_completion: '',
    notes: '',
    estimated_downtime_hours: order.estimated_downtime_hours ?? 0,
    estimated_cost: order.estimated_cost ?? 0,
    materials_needed: [],
  });
  const [technicianList, setTechnicianList] = useState<MaintenanceTechnician[]>([]);
  const [materialList, setMaterialList] = useState<MaintenanceMaterial[]>([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    maintenanceCadastroService.getTechnicians().then(data => setTechnicianList(data.filter(t => t.status === 0)));
    maintenanceCadastroService.getMaterials().then(data => setMaterialList(data));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMaterialDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const set = (field: keyof ServiceOrderData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const filteredMaterials = materialList.filter(m => {
    const q = materialSearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.warehouse_code || '').toLowerCase().includes(q)
    );
  });

  const addMaterial = (material: MaintenanceMaterial) => {
    const already = form.materials_needed.find(m => m.id === material.id);
    if (already) {
      setForm(prev => ({
        ...prev,
        materials_needed: prev.materials_needed.map(m =>
          m.id === material.id ? { ...m, quantity: m.quantity + 1 } : m
        ),
      }));
    } else {
      setForm(prev => ({
        ...prev,
        materials_needed: [
          ...prev.materials_needed,
          { id: material.id, name: material.name, unit: material.unit || 'un', warehouse_code: material.warehouse_code || '', quantity: 1 },
        ],
      }));
    }
    setMaterialSearch('');
    setShowMaterialDropdown(false);
  };

  const removeMaterial = (id: string) => {
    setForm(prev => ({
      ...prev,
      materials_needed: prev.materials_needed.filter(m => m.id !== id),
    }));
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setForm(prev => ({
      ...prev,
      materials_needed: prev.materials_needed.map(m =>
        m.id === id ? { ...m, quantity: qty } : m
      ),
    }));
  };

  const handleSave = async () => {
    if (!form.assigned_to.trim()) {
      alert('Informe o responsavel pelo servico');
      return;
    }
    setSaving(true);
    try {
      await maintenanceService.saveServiceOrderData(order.id, form);
      await maintenanceService.updateOrder(order.id, {
        assigned_to: form.assigned_to,
        started_at: form.started_at ? new Date(form.started_at).toISOString() : null,
        estimated_downtime_hours: form.estimated_downtime_hours,
        estimated_cost: form.estimated_cost,
        status: 'Em Andamento',
      });
      onSaved();
    } catch (err: any) {
      alert('Erro ao salvar ordem de servico: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Ordem de Servico</h2>
              <p className="text-xs text-gray-500 font-mono">{order.order_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">Solicitacao Aprovada</p>
            <p className="text-sm font-semibold text-gray-900">{order.title}</p>
            {order.equipment && (
              <p className="text-xs text-gray-500 mt-0.5">{order.equipment} {order.location ? `— ${order.location}` : ''}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              <span className="flex items-center gap-1.5"><User className="w-4 h-4" />Responsavel pelo Servico *</span>
            </label>
            {technicianList.length > 0 ? (
              <select
                value={form.assigned_to}
                onChange={e => set('assigned_to', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="">Selecionar tecnico...</option>
                {technicianList.map(t => (
                  <option key={t.id} value={t.name}>
                    {t.name}{t.maintenance_specialties?.name ? ` — ${t.maintenance_specialties.name}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.assigned_to}
                onChange={e => set('assigned_to', e.target.value)}
                placeholder="Nome do responsavel"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />Inicio Previsto</span>
              </label>
              <input
                type="datetime-local"
                value={form.started_at}
                onChange={e => set('started_at', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />Conclusao Prevista</span>
              </label>
              <input
                type="datetime-local"
                value={form.estimated_completion}
                onChange={e => set('estimated_completion', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />Downtime Est. (h)</span>
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.estimated_downtime_hours}
                onChange={e => set('estimated_downtime_hours', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" />Custo Est. (R$)</span>
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.estimated_cost}
                onChange={e => set('estimated_cost', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-1.5"><Wrench className="w-4 h-4" />Materiais / Pecas Necessarios</span>
            </label>

            <div className="relative" ref={dropdownRef}>
              <div
                className="flex items-center gap-2 w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white cursor-text focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent"
                onClick={() => setShowMaterialDropdown(true)}
              >
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={materialSearch}
                  onChange={e => { setMaterialSearch(e.target.value); setShowMaterialDropdown(true); }}
                  onFocus={() => setShowMaterialDropdown(true)}
                  placeholder="Buscar material por nome ou codigo..."
                  className="flex-1 text-sm outline-none bg-transparent"
                />
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>

              {showMaterialDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-52 overflow-y-auto">
                  {filteredMaterials.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400">Nenhum material encontrado</div>
                  ) : (
                    filteredMaterials.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => addMaterial(m)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-teal-50 text-left transition-colors"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900">{m.name}</span>
                          {m.warehouse_code && (
                            <span className="ml-2 text-xs text-gray-400">Alm: {m.warehouse_code}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{m.unit || 'un'}</span>
                          <Plus className="w-3.5 h-3.5 text-teal-600" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {form.materials_needed.length > 0 && (
              <div className="mt-3 space-y-2">
                {form.materials_needed.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      {item.warehouse_code && (
                        <p className="text-xs text-gray-400">Alm: {item.warehouse_code}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 text-xs font-bold"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 text-xs font-bold"
                      >
                        +
                      </button>
                      <span className="text-xs text-gray-400 w-6">{item.unit}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMaterial(item.id)}
                      className="p-1 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Observacoes / Plano de Acao</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="Descreva o plano de acao, procedimentos ou observacoes importantes..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Ordem de Servico
          </button>
        </div>
      </div>
    </div>
  );
}
