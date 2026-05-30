import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Loader2, ChevronRight, User, Calendar, Clock, DollarSign, Package, FileText, Search, Plus, Trash2, ChevronDown } from 'lucide-react';
import { maintenanceService } from '../../services/maintenanceService';
import { maintenanceCadastroService, type MaintenanceMaterial } from '../../services/maintenanceCadastroService';
import { supabase } from '../../lib/supabase';
import type { MaintenanceOrder } from '../../types/maintenance';

interface Notification {
  id: string;
  order_id: string;
  maintenance_orders: MaintenanceOrder;
}

interface SelectedMaterial {
  id: string;
  name: string;
  unit: string;
  warehouse_code: string;
  quantity: number;
}

interface ServiceOrderForm {
  assigned_to: string;
  start_date: string;
  estimated_completion: string;
  estimated_downtime_hours: string;
  estimated_cost: string;
  materials_needed: SelectedMaterial[];
  action_plan: string;
}

interface SimpleEmployee {
  id: string;
  name: string;
}

interface Props {
  notification: Notification;
  approverName: string;
  onClose: () => void;
  onApproved: (order?: MaintenanceOrder) => void;
  onRejected: () => void;
}

const emptyServiceForm: ServiceOrderForm = {
  assigned_to: '',
  start_date: '',
  estimated_completion: '',
  estimated_downtime_hours: '',
  estimated_cost: '',
  materials_needed: [],
  action_plan: '',
};

export function MaintenanceApprovalModal({ notification, approverName, onClose, onApproved, onRejected }: Props) {
  const [step, setStep] = useState<'review' | 'service-order' | 'reject-confirm'>('review');
  const [serviceForm, setServiceForm] = useState<ServiceOrderForm>(emptyServiceForm);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [materialList, setMaterialList] = useState<MaintenanceMaterial[]>([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const order = notification.maintenance_orders;

  useEffect(() => {
    supabase
      .from('employees')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setEmployees(data || []));

    maintenanceCadastroService.getTechnicians().then(setTechnicians);
    maintenanceCadastroService.getMaterials().then(setMaterialList);
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

  const filteredMaterials = materialList.filter(m => {
    const q = materialSearch.toLowerCase();
    return m.name.toLowerCase().includes(q) || (m.warehouse_code || '').toLowerCase().includes(q);
  });

  const addMaterial = (material: MaintenanceMaterial) => {
    const already = serviceForm.materials_needed.find(m => m.id === material.id);
    if (already) {
      setServiceForm(prev => ({
        ...prev,
        materials_needed: prev.materials_needed.map(m =>
          m.id === material.id ? { ...m, quantity: m.quantity + 1 } : m
        ),
      }));
    } else {
      setServiceForm(prev => ({
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
    setServiceForm(prev => ({
      ...prev,
      materials_needed: prev.materials_needed.filter(m => m.id !== id),
    }));
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setServiceForm(prev => ({
      ...prev,
      materials_needed: prev.materials_needed.map(m =>
        m.id === id ? { ...m, quantity: qty } : m
      ),
    }));
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await maintenanceService.approveOrder(order.id, approverName, notification.id);
      await maintenanceService.saveServiceOrderData(order.id, {
        assigned_to: serviceForm.assigned_to,
        start_date: serviceForm.start_date,
        estimated_completion: serviceForm.estimated_completion,
        estimated_downtime_hours: serviceForm.estimated_downtime_hours ? parseFloat(serviceForm.estimated_downtime_hours) : null,
        estimated_cost: serviceForm.estimated_cost ? parseFloat(serviceForm.estimated_cost) : null,
        materials_needed: serviceForm.materials_needed,
        action_plan: serviceForm.action_plan,
        approved_by: approverName,
        approved_at: new Date().toISOString(),
      });
      onApproved(order);
    } catch (err: any) {
      alert('Erro ao aprovar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Informe o motivo da rejeicao');
      return;
    }
    setLoading(true);
    try {
      await maintenanceService.rejectOrder(order.id, approverName, notification.id, rejectionReason);
      onRejected();
    } catch (err: any) {
      alert('Erro ao rejeitar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const priorityColor: Record<string, string> = {
    'Baixa': 'bg-sky-100 text-sky-700',
    'Média': 'bg-amber-100 text-amber-700',
    'Alta': 'bg-orange-100 text-orange-700',
    'Crítica': 'bg-red-100 text-red-700',
  };

  const sf = (field: keyof Omit<ServiceOrderForm, 'materials_needed'>, value: string) =>
    setServiceForm(p => ({ ...p, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${step === 'service-order' ? 'bg-teal-100' : 'bg-amber-100'}`}>
              {step === 'service-order'
                ? <FileText className="w-5 h-5 text-teal-600" />
                : <AlertTriangle className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {step === 'service-order' ? 'Ordem de Servico' : 'Solicitacao de Manutencao'}
              </h2>
              <p className="text-xs text-gray-500">
                {step === 'service-order' ? 'Preencha os dados para iniciar o servico' : 'Aguardando sua aprovacao'}
              </p>
            </div>
          </div>
          {step !== 'service-order' && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {step === 'service-order' && (
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span className="text-gray-400">Revisao</span>
              <ChevronRight className="w-3 h-3" />
              <span className="font-semibold text-teal-600">Ordem de Servico</span>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-gray-400">{order.order_number}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityColor[order.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                {order.priority}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">{order.title}</h3>
            {order.description && (
              <p className="text-xs text-gray-500 leading-relaxed">{order.description}</p>
            )}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {order.location && (
                <div>
                  <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Local</span>
                  <p className="text-xs text-gray-700 font-medium">{order.location}</p>
                </div>
              )}
              {order.equipment && (
                <div>
                  <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Equipamento</span>
                  <p className="text-xs text-gray-700 font-medium">{order.equipment}</p>
                </div>
              )}
              {order.fault_type && (
                <div>
                  <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Tipo de Falha</span>
                  <p className="text-xs text-gray-700 font-medium">{order.fault_type}</p>
                </div>
              )}
              {order.maintenance_type && (
                <div>
                  <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Tipo</span>
                  <p className="text-xs text-gray-700 font-medium">{order.maintenance_type}</p>
                </div>
              )}
              {order.requested_by && (
                <div className="col-span-2">
                  <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Solicitado por</span>
                  <p className="text-xs text-gray-700 font-medium">{order.requested_by}</p>
                </div>
              )}
            </div>
          </div>

          {step === 'service-order' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <User className="w-3.5 h-3.5 text-teal-500" />
                    Responsavel pelo Servico
                  </label>
                  <select
                    value={serviceForm.assigned_to}
                    onChange={e => sf('assigned_to', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Selecionar responsavel...</option>
                    <optgroup label="Tecnicos">
                      {technicians.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Funcionarios">
                      {employees.map(e => (
                        <option key={e.id} value={e.name}>{e.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-500" />
                    Data de Inicio
                  </label>
                  <input
                    type="date"
                    value={serviceForm.start_date}
                    onChange={e => sf('start_date', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-500" />
                    Previsao de Conclusao
                  </label>
                  <input
                    type="date"
                    value={serviceForm.estimated_completion}
                    onChange={e => sf('estimated_completion', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-500" />
                    Downtime Estimado (horas)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={serviceForm.estimated_downtime_hours}
                    onChange={e => sf('estimated_downtime_hours', e.target.value)}
                    placeholder="Ex: 4"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-teal-500" />
                    Custo Estimado (R$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={serviceForm.estimated_cost}
                    onChange={e => sf('estimated_cost', e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Package className="w-3.5 h-3.5 text-teal-500" />
                    Materiais Necessarios
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
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
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

                  {serviceForm.materials_needed.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {serviceForm.materials_needed.map(item => (
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

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-500" />
                    Plano de Acao
                  </label>
                  <textarea
                    value={serviceForm.action_plan}
                    onChange={e => sf('action_plan', e.target.value)}
                    rows={3}
                    placeholder="Descreva o plano de acao para execucao do servico..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'reject-confirm' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Motivo da Rejeicao *</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Descreva o motivo da rejeicao..."
                className="w-full px-4 py-2.5 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none text-sm"
              />
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl shrink-0">
          {step === 'review' && (
            <>
              <button
                onClick={() => setStep('reject-confirm')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl font-medium text-sm transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Rejeitar
              </button>
              <button
                onClick={() => setStep('service-order')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-medium text-sm transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Aprovar
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'service-order' && (
            <>
              <button
                onClick={() => setStep('review')}
                disabled={loading}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirmar Aprovacao
              </button>
            </>
          )}

          {step === 'reject-confirm' && (
            <>
              <button
                onClick={() => setStep('review')}
                disabled={loading}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirmar Rejeicao
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
