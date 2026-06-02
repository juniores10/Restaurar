import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { maintenanceService } from '../../services/maintenanceService';
import { maintenanceCadastroService, type MaintenanceEquipment, type MaintenanceTechnician, type MaintenanceLocation, type MaintenanceOccurrence } from '../../services/maintenanceCadastroService';
import type { MaintenanceOrder, FaultType, MaintenanceType, ProblemOrigin, OrderPriority, OrderStatus } from '../../types/maintenance';
import { MAINTENANCE_TYPES, PROBLEM_ORIGINS, ORDER_PRIORITIES, ORDER_STATUSES } from '../../types/maintenance';
import { supabase } from '../../lib/supabase';

interface Props {
  order: MaintenanceOrder | null;
  onClose: () => void;
  onSaved: () => void;
  initialDate?: string;
}

const emptyForm = {
  order_number: '',
  title: '',
  description: '',
  maintenance_type: 'Corretiva' as MaintenanceType,
  fault_type: '' as FaultType,
  problem_origin: 'Projeto/Equipamento (defeito/desgaste)' as ProblemOrigin,
  priority: 'Média' as OrderPriority,
  status: 'Aberto' as OrderStatus,
  location: '',
  equipment: '',
  requested_by: '',
  assigned_to: '',
  estimated_downtime_hours: 0,
  actual_downtime_hours: 0,
  estimated_cost: 0,
  actual_cost: 0,
  started_at: null as string | null,
  completed_at: null as string | null,
  scheduled_start: null as string | null,
  scheduled_end: null as string | null,
  scheduled_materials: [] as string[],
  resolution_notes: '',
};

export function MaintenanceOrderForm({ order, onClose, onSaved, initialDate }: Props) {
  const { employeeProfile } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [equipmentList, setEquipmentList] = useState<MaintenanceEquipment[]>([]);
  const [technicianList, setTechnicianList] = useState<MaintenanceTechnician[]>([]);
  const [locationList, setLocationList] = useState<MaintenanceLocation[]>([]);
  const [occurrenceList, setOccurrenceList] = useState<MaintenanceOccurrence[]>([]);
  const [sectorList, setSectorList] = useState<{ id: string; description: string }[]>([]);
  const [materialList, setMaterialList] = useState<{ id: string; name: string; unit: string }[]>([]);

  useEffect(() => {
    maintenanceCadastroService.getEquipment().then(data => setEquipmentList(data.filter(e => e.status === 0)));
    maintenanceCadastroService.getTechnicians().then(data => setTechnicianList(data.filter(t => t.status === 0)));
    maintenanceCadastroService.getLocations().then(data => setLocationList(data.filter(l => l.status === 0)));
    maintenanceCadastroService.getOccurrences().then(data => setOccurrenceList(data.filter(o => o.status === 0)));
    maintenanceCadastroService.getMaterials().then(data => setMaterialList(data.filter((m: any) => m.status === 0).map((m: any) => ({ id: m.id, name: m.name, unit: m.unit }))));
    supabase.from('data_types').select('id, description').eq('type', 8).eq('status', 0).order('description')
      .then(({ data }) => setSectorList(data || []));
  }, []);

  useEffect(() => {
    if (order) {
      setForm({
        order_number: order.order_number,
        title: order.title,
        description: order.description,
        maintenance_type: order.maintenance_type ?? 'Corretiva',
        fault_type: order.fault_type,
        problem_origin: order.problem_origin,
        priority: order.priority,
        status: order.status,
        location: order.location,
        equipment: order.equipment,
        requested_by: order.requested_by,
        assigned_to: order.assigned_to,
        estimated_downtime_hours: order.estimated_downtime_hours,
        actual_downtime_hours: order.actual_downtime_hours,
        estimated_cost: order.estimated_cost,
        actual_cost: order.actual_cost,
        started_at: order.started_at,
        completed_at: order.completed_at,
        scheduled_start: order.scheduled_start ?? null,
        scheduled_end: order.scheduled_end ?? null,
        scheduled_materials: order.scheduled_materials ?? [],
        resolution_notes: order.resolution_notes,
      });
    } else {
      maintenanceService.generateOrderNumber().then(num => {
        setForm(prev => ({
          ...prev,
          order_number: num,
          requested_by: employeeProfile?.full_name ?? '',
          ...(initialDate ? {
            maintenance_type: 'Preventiva' as MaintenanceType,
            scheduled_start: initialDate,
            scheduled_end: new Date(new Date(initialDate).getTime() + 3600000).toISOString(),
          } : {}),
        }));
      });
    }
  }, [order, employeeProfile]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('Informe o titulo do chamado');
      return;
    }
    if (form.maintenance_type === 'Preventiva' && !order) {
      if (!form.scheduled_start) {
        alert('Informe a data de inicio do agendamento');
        return;
      }
      if (!form.scheduled_end) {
        alert('Informe a data final do agendamento');
        return;
      }
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!order && payload.maintenance_type === 'Preventiva') {
        payload.status = 'Agendado' as OrderStatus;
      }
      if (order) {
        const { order_number: _, ...updates } = payload;
        await maintenanceService.updateOrder(order.id, updates);
      } else {
        const created = await maintenanceService.createOrder(payload as any);
        await maintenanceService.notifyManagersAndAdmins(created.id);
      }
      onSaved();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const toLocalInputValue = (iso: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fromLocalInputValue = (local: string): string | null => {
    if (!local) return null;
    return new Date(local).toISOString();
  };

  const calcDowntime = (start: string | null, end: string | null): number => {
    if (!start || !end) return form.actual_downtime_hours;
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs <= 0) return 0;
    return Math.round((diffMs / 3600000) * 100) / 100;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {order ? `Editar Chamado ${order.order_number}` : 'Solicitacao de Manutencao'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Numero do Chamado</label>
              <input
                type="text"
                value={form.order_number}
                readOnly
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Prioridade *</label>
              <select
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {ORDER_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Titulo *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Descricao breve do problema"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Descricao Detalhada</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="Descreva o problema com detalhes..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Manutencao *</label>
            <div className="grid grid-cols-2 gap-3">
              {MAINTENANCE_TYPES.map(mt => {
                const activeStyle =
                  mt === 'Corretiva'  ? 'bg-rose-50 border-rose-500 text-rose-700' :
                  mt === 'Preventiva' ? 'bg-teal-50 border-teal-500 text-teal-700' :
                  mt === 'Preditiva'  ? 'bg-blue-50 border-blue-500 text-blue-700' :
                                       'bg-amber-50 border-amber-500 text-amber-700';
                return (
                  <button
                    key={mt}
                    type="button"
                    onClick={() => set('maintenance_type', mt)}
                    className={`py-2.5 rounded-xl font-medium text-sm border-2 transition-all ${
                      form.maintenance_type === mt
                        ? activeStyle
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {mt}
                  </button>
                );
              })}
            </div>
          </div>

          {form.maintenance_type === 'Preventiva' && (
            <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-4 space-y-4">
              <p className="text-sm font-semibold text-teal-700">Agendamento da Preventiva</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicio *</label>
                  <input
                    type="datetime-local"
                    value={toLocalInputValue(form.scheduled_start)}
                    onChange={e => set('scheduled_start', fromLocalInputValue(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Final *</label>
                  <input
                    type="datetime-local"
                    value={toLocalInputValue(form.scheduled_end)}
                    onChange={e => set('scheduled_end', fromLocalInputValue(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Materiais Planejados</label>
                <div className="flex gap-2 mb-2">
                  <select
                    id="material-select"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    defaultValue=""
                  >
                    <option value="">Selecionar material...</option>
                    {materialList
                      .filter(m => !form.scheduled_materials.includes(m.name))
                      .map(m => <option key={m.id} value={m.name}>{m.name} ({m.unit})</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const sel = document.getElementById('material-select') as HTMLSelectElement;
                      if (sel.value) {
                        set('scheduled_materials', [...form.scheduled_materials, sel.value]);
                        sel.value = '';
                      }
                    }}
                    className="px-3 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.scheduled_materials.length > 0 && (
                  <div className="space-y-1">
                    {form.scheduled_materials.map((mat, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-700">{mat}</span>
                        <button
                          type="button"
                          onClick={() => set('scheduled_materials', form.scheduled_materials.filter((_, i) => i !== idx))}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {form.scheduled_materials.length === 0 && (
                  <p className="text-xs text-gray-400">Nenhum material adicionado</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Falha *</label>
            <select
              value={form.fault_type}
              onChange={e => set('fault_type', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Selecionar...</option>
              {occurrenceList.map(oc => <option key={oc.id} value={oc.name}>{oc.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-400">O que quebrou</p>
          </div>

          {order && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Setor</label>
              <select
                value={form.location}
                onChange={e => { set('location', e.target.value); set('equipment', ''); }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Selecionar setor...</option>
                {sectorList.map(s => (
                  <option key={s.id} value={s.description}>{s.description}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Equipamento / Maquina</label>
              <select
                value={form.equipment}
                onChange={e => set('equipment', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                disabled={!form.location}
              >
                <option value="">{form.location ? 'Selecionar equipamento...' : 'Selecione o setor primeiro...'}</option>
                {equipmentList
                  .filter(eq => eq.status === 0 && (!form.location || eq.sector === form.location))
                  .map(eq => (
                    <option key={eq.id} value={eq.name}>{eq.name}{eq.tag_code ? ` (${eq.tag_code})` : ''}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Solicitado por</label>
              <input
                type="text"
                value={form.requested_by}
                onChange={e => set('requested_by', e.target.value)}
                readOnly={!order}
                placeholder="Nome do solicitante"
                className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent ${!order ? 'bg-gray-50 text-gray-600 cursor-default' : ''}`}
              />
            </div>
          </div>


          {order && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Inicio do Trabalho</label>
                  <input
                    type="datetime-local"
                    value={toLocalInputValue(form.started_at)}
                    onChange={e => {
                      const newStart = fromLocalInputValue(e.target.value);
                      set('started_at', newStart);
                      set('actual_downtime_hours', calcDowntime(newStart, form.completed_at));
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Conclusao</label>
                  <input
                    type="datetime-local"
                    value={toLocalInputValue(form.completed_at)}
                    onChange={e => {
                      const newEnd = fromLocalInputValue(e.target.value);
                      set('completed_at', newEnd);
                      set('actual_downtime_hours', calcDowntime(form.started_at, newEnd));
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notas de Resolucao</label>
                <textarea
                  value={form.resolution_notes}
                  onChange={e => set('resolution_notes', e.target.value)}
                  rows={3}
                  placeholder="Descreva como o problema foi resolvido..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {order ? 'Salvar Alteracoes' : 'Enviar Solicitacao'}
          </button>
        </div>
      </div>
    </div>
  );
}
