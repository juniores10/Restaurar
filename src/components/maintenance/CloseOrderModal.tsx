import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Calendar, Clock, Package, FileText, Save, Loader2, User, AlertCircle, AlertTriangle, History, Camera, ImagePlus, Trash2, Image as ImageIcon } from 'lucide-react';
import { maintenanceService } from '../../services/maintenanceService';
import { maintenanceCadastroService, type MaintenanceMaterial, type MaintenanceTechnician, type MaintenanceOccurrence } from '../../services/maintenanceCadastroService';
import { supabase } from '../../lib/supabase';
import type { MaintenanceOrder } from '../../types/maintenance';
import { MaterialSelector } from './MaterialSelector';

interface FaultTypeHistoryEntry {
  fault_type: string;
  changed_at: string;
  stage: 'abertura' | 'fechamento';
}

interface ClosePhoto {
  file: File;
  preview: string;
  type: 'inicio' | 'fim';
  uploading?: boolean;
  url?: string;
}

interface Props {
  order: MaintenanceOrder;
  onClose: () => void;
  onSaved: () => void;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const MIN_INICIO = 2;
const MIN_FIM = 2;

export function CloseOrderModal({ order, onClose, onSaved }: Props) {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [technicianId, setTechnicianId] = useState(order.assigned_to || '');
  const [faultType, setFaultType] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState<{ material: MaintenanceMaterial; quantity: number }[]>([]);
  const [resolutionNotes, setResolutionNotes] = useState(order.resolution_notes || '');
  const [saving, setSaving] = useState(false);
  const [technicians, setTechnicians] = useState<MaintenanceTechnician[]>([]);
  const [occurrences, setOccurrences] = useState<MaintenanceOccurrence[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<ClosePhoto[]>([]);

  const inicioInputRef = useRef<HTMLInputElement>(null);
  const fimInputRef = useRef<HTMLInputElement>(null);

  const existingHistory: FaultTypeHistoryEntry[] = (order.service_order_data?.fault_type_history as FaultTypeHistoryEntry[] | undefined) ?? [];

  const [pendingFaultChanges, setPendingFaultChanges] = useState<FaultTypeHistoryEntry[]>([]);
  const [showFaultSelector, setShowFaultSelector] = useState(false);

  useEffect(() => {
    maintenanceCadastroService.getTechnicians().then(setTechnicians).catch(() => {});
    maintenanceCadastroService.getOccurrences().then(setOccurrences).catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      photos.forEach(p => URL.revokeObjectURL(p.preview));
    };
  }, []);

  const buildISODate = (date: string, time: string): string | null => {
    if (!date) return null;
    return new Date(`${date}T${time || '00:00'}:00`).toISOString();
  };

  const calcDowntimeHours = (): number => {
    if (!startDate || !endDate) return order.actual_downtime_hours || 0;
    const start = new Date(`${startDate}T${startTime || '00:00'}:00`);
    const end = new Date(`${endDate}T${endTime || '00:00'}:00`);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return 0;
    return Math.round((diffMs / 3600000) * 100) / 100;
  };

  const photosInicio = photos.filter(p => p.type === 'inicio');
  const photosFim = photos.filter(p => p.type === 'fim');

  const addPhotos = (files: FileList, type: 'inicio' | 'fim') => {
    const duplicates: string[] = [];
    const toAdd: ClosePhoto[] = [];

    Array.from(files).forEach(file => {
      const isDuplicate = photos.some(
        p => p.file.name === file.name && p.file.size === file.size && p.file.lastModified === file.lastModified
      );
      if (isDuplicate) {
        duplicates.push(file.name);
      } else {
        toAdd.push({ file, preview: URL.createObjectURL(file), type });
      }
    });

    if (duplicates.length > 0) {
      setErrors(prev => ({
        ...prev,
        photoDuplicate: `Foto(s) ja adicionada(s): ${duplicates.join(', ')}`,
      }));
    } else {
      setErrors(prev => ({ ...prev, photoDuplicate: '' }));
    }

    if (toAdd.length > 0) {
      setPhotos(prev => [...prev, ...toAdd]);
      setErrors(prev => ({ ...prev, photos: '' }));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadPhotos = async (): Promise<{ url: string; type: string; uploaded_at: string }[]> => {
    const results: { url: string; type: string; uploaded_at: string }[] = [];
    for (const photo of photos) {
      const ext = photo.file.name.split('.').pop() ?? 'jpg';
      const path = `${order.id}/${Date.now()}-${photo.type}.${ext}`;
      const { error } = await supabase.storage
        .from('maintenance-photos')
        .upload(path, photo.file, { upsert: true });
      if (error) throw new Error('Erro ao enviar foto: ' + error.message);
      const { data: { publicUrl } } = supabase.storage.from('maintenance-photos').getPublicUrl(path);
      results.push({ url: publicUrl, type: photo.type, uploaded_at: new Date().toISOString() });
    }
    return results;
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!startDate) e.startDate = 'Data de inicio obrigatoria';
    if (!endDate) e.endDate = 'Data de conclusao obrigatoria';
    if (startDate && endDate) {
      const start = new Date(`${startDate}T${startTime || '00:00'}:00`);
      const end = new Date(`${endDate}T${endTime || '00:00'}:00`);
      if (end <= start) e.endDate = 'Data de conclusao deve ser posterior ao inicio';
    }
    if (!technicianId) e.technicianId = 'Tecnico responsavel obrigatorio';
    if (!resolutionNotes.trim()) e.resolutionNotes = 'Descricao da solucao obrigatoria';
    const inicioCount = photos.filter(p => p.type === 'inicio').length;
    const fimCount = photos.filter(p => p.type === 'fim').length;
    if (inicioCount < MIN_INICIO || fimCount < MIN_FIM) {
      e.photos = `Obrigatorio: ${MIN_INICIO} fotos de inicio e ${MIN_FIM} fotos de fim do servico`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildFaultTypeHistory = (): FaultTypeHistoryEntry[] => {
    const base: FaultTypeHistoryEntry[] = order.fault_type && existingHistory.length === 0
      ? [{ fault_type: order.fault_type, changed_at: order.created_at, stage: 'abertura' }]
      : [...existingHistory];
    return [...base, ...pendingFaultChanges];
  };

  const currentFaultType = pendingFaultChanges.length > 0
    ? pendingFaultChanges[pendingFaultChanges.length - 1].fault_type
    : order.fault_type || '';

  const handleAddFaultChange = () => {
    if (!faultType || faultType === currentFaultType) return;
    setPendingFaultChanges(prev => [
      ...prev,
      { fault_type: faultType, changed_at: new Date().toISOString(), stage: 'fechamento' },
    ]);
    setFaultType('');
    setShowFaultSelector(false);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const uploadedPhotos = await uploadPhotos();
      const startedAt = buildISODate(startDate, startTime);
      const completedAt = buildISODate(endDate, endTime) ?? new Date().toISOString();
      const downtimeHours = calcDowntimeHours();
      const faultTypeHistory = buildFaultTypeHistory();
      const actualCost = (order.service_order_data as any)?.estimated_cost ?? order.estimated_cost ?? 0;

      await maintenanceService.updateOrder(order.id, {
        status: 'Concluído',
        started_at: startedAt ?? order.started_at,
        completed_at: completedAt,
        actual_downtime_hours: downtimeHours,
        actual_cost: actualCost,
        assigned_to: technicianId || order.assigned_to,
        fault_type: currentFaultType || order.fault_type,
        resolution_notes: resolutionNotes,
        close_photos: uploadedPhotos,
        service_order_data: {
          ...(order.service_order_data ?? {}),
          fault_type_history: faultTypeHistory,
          materials_used: materialsUsed.map(({ material, quantity }) => ({
            id: material.id,
            name: material.name,
            unit: material.unit,
            warehouse_code: material.warehouse_code,
            quantity,
          })),
        },
      });
      onSaved();
    } catch (err: any) {
      alert('Erro ao fechar OS: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const downtimePreview = calcDowntimeHours();

  const fieldClass = (field: string) =>
    `w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:border-transparent transition-colors ${
      errors[field]
        ? 'border-red-300 focus:ring-red-400 bg-red-50'
        : 'border-gray-200 focus:ring-emerald-500'
    }`;

  const historyForDisplay: FaultTypeHistoryEntry[] = [
    ...(order.fault_type && existingHistory.length === 0
      ? [{ fault_type: order.fault_type, changed_at: order.created_at, stage: 'abertura' as const }]
      : existingHistory),
    ...pendingFaultChanges,
  ];

  const PhotoSection = ({
    type,
    label,
    items,
    minCount,
    inputRef,
  }: {
    type: 'inicio' | 'fim';
    label: string;
    items: ClosePhoto[];
    minCount: number;
    inputRef: React.RefObject<HTMLInputElement>;
  }) => {
    const allPhotos = photos;
    const offsetIndex = type === 'fim' ? photos.filter(p => p.type === 'inicio').length : 0;
    const missing = Math.max(0, minCount - items.length);

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              items.length >= minCount ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
            }`}>
              {items.length}/{minCount} min
            </span>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={e => { if (e.target.files?.length) addPhotos(e.target.files, type); e.target.value = ''; }}
        />

        {items.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors ${
              errors.photos ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
            }`}
          >
            <Camera className={`w-6 h-6 ${errors.photos ? 'text-red-400' : 'text-gray-300'}`} />
            <span className={`text-xs ${errors.photos ? 'text-red-500' : 'text-gray-400'}`}>
              Toque para tirar foto ou selecionar
            </span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.map((photo, localIdx) => {
              const globalIdx = allPhotos.findIndex((p, gi) => {
                const sameType = p.type === type;
                const sameIndex = allPhotos.filter(x => x.type === type).indexOf(p) === localIdx;
                return sameType && sameIndex;
              });
              return (
                <div key={localIdx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(globalIdx >= 0 ? globalIdx : photos.indexOf(photo))}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                  {localIdx < minCount && (
                    <div className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 bg-black/60 text-white rounded-md">
                      {localIdx + 1}/{minCount}
                    </div>
                  )}
                </div>
              );
            })}
            {missing > 0 && Array.from({ length: missing }).map((_, i) => (
              <button
                key={`empty-${i}`}
                type="button"
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 flex items-center justify-center transition-colors"
              >
                <ImageIcon className="w-5 h-5 text-gray-300" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Fechar Ordem de Servico</h3>
              <p className="text-xs text-gray-500 font-mono">{order.order_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">{order.title}</p>
            {order.equipment && <p className="text-xs text-gray-500 mt-0.5">Equip: {order.equipment}</p>}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              Tecnico Responsavel
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              value={technicianId}
              onChange={e => { setTechnicianId(e.target.value); setErrors(prev => ({ ...prev, technicianId: '' })); }}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:border-transparent bg-white transition-colors ${
                errors.technicianId ? 'border-red-300 focus:ring-red-400 bg-red-50' : 'border-gray-200 focus:ring-emerald-500'
              }`}
            >
              <option value="">Selecione o tecnico...</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.maintenance_specialties?.name ? ` — ${t.maintenance_specialties.name}` : ''}
                </option>
              ))}
            </select>
            {errors.technicianId && (
              <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                <AlertCircle className="w-3 h-3" />{errors.technicianId}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <AlertTriangle className="w-3.5 h-3.5 text-emerald-500" />
                Tipo de Falha
              </label>
              {!showFaultSelector && (
                <button
                  type="button"
                  onClick={() => setShowFaultSelector(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200"
                >
                  <span className="text-base leading-none">+</span> Trocar Tipo
                </button>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden mb-3">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-100">
                <History className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Historico de Tipo de Falha</span>
              </div>
              <div className="divide-y divide-gray-50">
                {historyForDisplay.map((entry, i) => {
                  const isLast = i === historyForDisplay.length - 1;
                  return (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2.5 ${isLast ? 'bg-white' : ''}`}>
                      <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                        entry.stage === 'abertura'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {entry.stage === 'abertura' ? 'Abertura' : 'Alteracao'}
                      </span>
                      <span className={`flex-1 text-sm font-medium ${isLast ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                        {entry.fault_type}
                      </span>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{formatDateTime(entry.changed_at)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {showFaultSelector && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">Selecione o novo tipo de falha</p>
                <select
                  value={faultType}
                  onChange={e => setFaultType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-amber-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white transition-colors"
                >
                  <option value="">Selecione...</option>
                  {occurrences.filter(o => o.status === 0).map(o => (
                    <option key={o.id} value={o.name}>{o.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowFaultSelector(false); setFaultType(''); }}
                    className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors border border-gray-200 bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddFaultChange}
                    disabled={!faultType || faultType === currentFaultType}
                    className="flex-1 py-2 text-sm text-white bg-amber-500 hover:bg-amber-600 rounded-lg font-medium transition-colors disabled:opacity-40"
                  >
                    Confirmar Troca
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              Data e Hora de Inicio
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Data</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); setErrors(prev => ({ ...prev, startDate: '' })); }}
                  className={fieldClass('startDate')}
                />
                {errors.startDate && (
                  <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                    <AlertCircle className="w-3 h-3" />{errors.startDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Hora</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              Data e Hora de Conclusao
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Data</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => { setEndDate(e.target.value); setErrors(prev => ({ ...prev, endDate: '' })); }}
                  className={fieldClass('endDate')}
                />
                {errors.endDate && (
                  <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                    <AlertCircle className="w-3 h-3" />{errors.endDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Hora</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            {startDate && endDate && downtimePreview > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                Downtime calculado: <span className="font-semibold">{downtimePreview}h</span>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              <Package className="w-3.5 h-3.5 text-emerald-500" />
              Materiais Gastos
            </label>
            <MaterialSelector value={materialsUsed} onChange={setMaterialsUsed} />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              Descricao da Solucao
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              value={resolutionNotes}
              onChange={e => { setResolutionNotes(e.target.value); setErrors(prev => ({ ...prev, resolutionNotes: '' })); }}
              rows={3}
              placeholder="Descreva detalhadamente o que foi feito para resolver o problema..."
              className={fieldClass('resolutionNotes') + ' resize-none'}
            />
            {errors.resolutionNotes && (
              <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                <AlertCircle className="w-3 h-3" />{errors.resolutionNotes}
              </p>
            )}
          </div>

          {/* Photo Section */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              <Camera className="w-3.5 h-3.5 text-emerald-500" />
              Fotos do Servico
              <span className="text-red-500 ml-0.5">*</span>
            </label>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
                <PhotoSection
                  type="inicio"
                  label="Fotos de Inicio"
                  items={photosInicio}
                  minCount={MIN_INICIO}
                  inputRef={inicioInputRef}
                />
              </div>

              <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
                <PhotoSection
                  type="fim"
                  label="Fotos de Fim"
                  items={photosFim}
                  minCount={MIN_FIM}
                  inputRef={fimInputRef}
                />
              </div>
            </div>

            {errors.photos && (
              <p className="flex items-center gap-1 text-[11px] text-red-500 mt-2">
                <AlertCircle className="w-3 h-3" />{errors.photos}
              </p>
            )}
            {errors.photoDuplicate && (
              <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                <AlertCircle className="w-3 h-3" />{errors.photoDuplicate}
              </p>
            )}

            <p className="text-[11px] text-gray-400 mt-2">
              Minimo de {MIN_INICIO} fotos de inicio e {MIN_FIM} fotos de fim. Voce pode adicionar mais fotos se necessario.
            </p>
          </div>

          {Object.values(errors).some(Boolean) && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Preencha os campos obrigatorios antes de fechar a OS.
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Fechando...' : 'Confirmar Fechamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
