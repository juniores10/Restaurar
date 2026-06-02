import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Save, X, Loader2, Pencil, Wrench, MapPin, Package, User, Star, AlertTriangle, CheckCircle, XCircle, Search, FileText, FileSpreadsheet, ChevronDown, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  maintenanceCadastroService,
  type MaintenanceEquipment,
  type MaintenanceOccurrence,
  type MaintenanceMaterial,
  type MaintenanceTechnician,
  type MaintenanceSpecialty,
  type MaintenanceLocation,
} from '../../services/maintenanceCadastroService';
import { supabase } from '../../lib/supabase';

interface SimpleEmployee {
  id: string;
  name: string;
  role_name: string | null;
}

type TabId = 'equipment' | 'occurrences' | 'materials' | 'technicians' | 'specialties' | 'locations';

interface TabConfig {
  id: TabId;
  label: string;
  icon: typeof Wrench;
  description: string;
}

const TABS: TabConfig[] = [
  { id: 'equipment', label: 'Equipamentos', icon: Wrench, description: 'Maquinas e equipamentos da fabrica' },
  { id: 'materials', label: 'Material / Outros / Obs.', icon: Package, description: 'Materiais, pecas e observacoes' },
  { id: 'technicians', label: 'Tecnico', icon: User, description: 'Tecnicos de manutencao' },
  { id: 'specialties', label: 'Especialidade', icon: Star, description: 'Especialidades tecnicas' },
  { id: 'locations', label: 'Localizacao', icon: MapPin, description: 'Locais e setores da fabrica' },
  { id: 'occurrences', label: 'Tipo de Falha', icon: AlertCircle, description: 'Tipos de falha e ocorrencias' },
];

const emptyEquipmentForm = { name: '', tag_code: '', location_id: '', sector: '', manufacturer: '', serial_number: '', model: '', installation_date: '', hourly_cost: 0, purchase_value: 0, manual_url: '', available_from: '', available_to: '' };
const emptySimpleForm = { name: '', description: '' };
const emptyMaterialForm = { name: '', unit: 'un', equipment_id: '', warehouse_code: '', description: '', unit_price: 0 };
const emptyTechnicianForm = { name: '', specialty_id: '' };

export function MaintenanceCadastro() {
  const [activeTab, setActiveTab] = useState<TabId>('equipment');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const [equipment, setEquipment] = useState<MaintenanceEquipment[]>([]);
  const [occurrences, setOccurrences] = useState<MaintenanceOccurrence[]>([]);
  const [materials, setMaterials] = useState<MaintenanceMaterial[]>([]);
  const [technicians, setTechnicians] = useState<MaintenanceTechnician[]>([]);
  const [specialties, setSpecialties] = useState<MaintenanceSpecialty[]>([]);
  const [locations, setLocations] = useState<MaintenanceLocation[]>([]);
  const [sectorList, setSectorList] = useState<{ id: string; description: string }[]>([]);
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [uploadingManual, setUploadingManual] = useState(false);
  const [inactivationModal, setInactivationModal] = useState<{ item: MaintenanceEquipment } | null>(null);
  const [inactivationReason, setInactivationReason] = useState('');
  const [matFilterEquipment, setMatFilterEquipment] = useState('');
  const [matFilterName, setMatFilterName] = useState('');
  const [matFilterTag, setMatFilterTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [eqDropdownOpen, setEqDropdownOpen] = useState(false);
  const eqDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAll();
    supabase.from('data_types').select('id, description').eq('type', 8).eq('status', 0).order('description')
      .then(({ data }) => setSectorList(data || []));
    supabase
      .from('employees')
      .select('id, name, data_types!position_id(description)')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setEmployees((data || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          role_name: e.data_types?.description || null,
        })));
      });
  }, []);

  useEffect(() => {
    resetForm();
  }, [activeTab]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (eqDropdownRef.current && !eqDropdownRef.current.contains(e.target as Node)) {
        setEqDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [eq, oc, mat, tech, spec, loc] = await Promise.all([
        maintenanceCadastroService.getEquipment(),
        maintenanceCadastroService.getOccurrences(),
        maintenanceCadastroService.getMaterials(),
        maintenanceCadastroService.getTechnicians(),
        maintenanceCadastroService.getSpecialties(),
        maintenanceCadastroService.getLocations(),
      ]);
      setEquipment(eq);
      setOccurrences(oc);
      setMaterials(mat);
      setTechnicians(tech);
      setSpecialties(spec);
      setLocations(loc);
    } catch (err) {
      console.error('Error loading maintenance cadastro:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setSelectedEquipmentIds([]);
    setEqDropdownOpen(false);
    setManualFile(null);
    setSearchQuery('');
    if (activeTab === 'equipment') setFormData(emptyEquipmentForm);
    else if (activeTab === 'materials') setFormData(emptyMaterialForm);
    else if (activeTab === 'technicians') setFormData(emptyTechnicianForm);
    else setFormData(emptySimpleForm);
  };

  const startAdd = () => {
    setEditingId(null);
    setSelectedEquipmentIds([]);
    setEqDropdownOpen(false);
    if (activeTab === 'equipment') setFormData(emptyEquipmentForm);
    else if (activeTab === 'materials') setFormData(emptyMaterialForm);
    else if (activeTab === 'technicians') setFormData(emptyTechnicianForm);
    else setFormData(emptySimpleForm);
    setShowForm(true);
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    if (activeTab === 'equipment') {
      setFormData({
        name: item.name,
        tag_code: item.tag_code || '',
        location_id: item.location_id || '',
        sector: item.sector || '',
        manufacturer: item.manufacturer || '',
        serial_number: item.serial_number || '',
        model: item.model || '',
        installation_date: item.installation_date || '',
        manual_url: item.manual_url || '',
        available_from: item.available_from || '',
        available_to: item.available_to || '',
        purchase_value: item.purchase_value || 0,
      });
    } else if (activeTab === 'materials') {
      setFormData({
        name: item.name,
        unit: item.unit || 'un',
        equipment_id: item.equipment_id || '',
        warehouse_code: item.warehouse_code || '',
        description: item.description || '',
        unit_price: item.unit_price || 0,
      });
      setSelectedEquipmentIds(item.equipment_ids || (item.equipment_id ? [item.equipment_id] : []));
    } else if (activeTab === 'technicians') {
      const emp = employees.find(e => e.name === item.name);
      setFormData({ name: item.name, specialty_id: item.specialty_id || '', role_display: emp?.role_name || '' });
    } else {
      setFormData({ name: item.name, description: item.description || '' });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert('Informe o nome');
      return;
    }
    setSaving(true);
    try {
      if (activeTab === 'equipment') {
        let manual_url = formData.manual_url || '';
        if (manualFile) {
          setUploadingManual(true);
          const ext = manualFile.name.split('.').pop();
          const path = `${Date.now()}-${manualFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('equipment-manuals')
            .upload(path, manualFile, { upsert: true, contentType: manualFile.type });
          setUploadingManual(false);
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from('equipment-manuals').getPublicUrl(uploadData.path);
          manual_url = urlData.publicUrl;
        }
        const payload = {
          name: formData.name.trim(),
          tag_code: formData.tag_code || '',
          location_id: formData.location_id || null,
          sector: formData.sector || '',
          manufacturer: formData.manufacturer || '',
          serial_number: formData.serial_number || '',
          model: formData.model || '',
          installation_date: formData.installation_date || null,
          manual_url,
          available_from: formData.available_from || null,
          available_to: formData.available_to || null,
          purchase_value: parseFloat(formData.purchase_value as any) || 0,
        };
        if (editingId) {
          await maintenanceCadastroService.updateEquipment(editingId, payload);
        } else {
          await maintenanceCadastroService.createEquipment(payload);
        }
        setEquipment(await maintenanceCadastroService.getEquipment());
      } else if (activeTab === 'occurrences') {
        const payload = { name: formData.name.trim(), description: formData.description || '' };
        if (editingId) {
          await maintenanceCadastroService.updateOccurrence(editingId, payload);
        } else {
          await maintenanceCadastroService.createOccurrence(payload);
        }
        setOccurrences(await maintenanceCadastroService.getOccurrences());
      } else if (activeTab === 'materials') {
        const firstEqId = selectedEquipmentIds[0] || null;
        const payload = {
          name: formData.name.trim(),
          unit: formData.unit || 'un',
          equipment_id: firstEqId,
          warehouse_code: formData.warehouse_code || '',
          description: formData.description || '',
          unit_price: parseFloat(formData.unit_price as any) || 0,
        };
        if (editingId) {
          await maintenanceCadastroService.updateMaterial(editingId, payload, selectedEquipmentIds);
        } else {
          await maintenanceCadastroService.createMaterial(payload, selectedEquipmentIds);
        }
        setMaterials(await maintenanceCadastroService.getMaterials());
      } else if (activeTab === 'technicians') {
        const payload = { name: formData.name.trim(), specialty_id: formData.specialty_id || null };
        if (editingId) {
          await maintenanceCadastroService.updateTechnician(editingId, payload);
        } else {
          await maintenanceCadastroService.createTechnician(payload);
        }
        setTechnicians(await maintenanceCadastroService.getTechnicians());
      } else if (activeTab === 'specialties') {
        const payload = { name: formData.name.trim(), description: formData.description || '' };
        if (editingId) {
          await maintenanceCadastroService.updateSpecialty(editingId, payload);
        } else {
          await maintenanceCadastroService.createSpecialty(payload);
        }
        setSpecialties(await maintenanceCadastroService.getSpecialties());
      } else if (activeTab === 'locations') {
        const payload = { name: formData.name.trim(), description: formData.description || '' };
        if (editingId) {
          await maintenanceCadastroService.updateLocation(editingId, payload);
        } else {
          await maintenanceCadastroService.createLocation(payload);
        }
        setLocations(await maintenanceCadastroService.getLocations());
      }
      resetForm();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmInactivation = async () => {
    if (!inactivationModal) return;
    try {
      await maintenanceCadastroService.updateEquipment(inactivationModal.item.id, {
        status: 1,
        inactivated_at: new Date().toISOString(),
        inactivation_reason: inactivationReason.trim(),
      });
      setEquipment(await maintenanceCadastroService.getEquipment());
    } catch (err: any) {
      alert('Erro ao inativar: ' + err.message);
    } finally {
      setInactivationModal(null);
      setInactivationReason('');
    }
  };

  const handleToggleStatus = async (item: any) => {
    const newStatus = item.status === 0 ? 1 : 0;
    try {
      if (activeTab === 'equipment') {
        if (newStatus === 1) {
          setInactivationModal({ item });
          return;
        }
        await maintenanceCadastroService.updateEquipment(item.id, {
          status: 0,
          inactivated_at: null,
          inactivation_reason: '',
        });
        setEquipment(await maintenanceCadastroService.getEquipment());
      } else if (activeTab === 'occurrences') {
        await maintenanceCadastroService.updateOccurrence(item.id, { status: newStatus });
        setOccurrences(await maintenanceCadastroService.getOccurrences());
      } else if (activeTab === 'materials') {
        await maintenanceCadastroService.updateMaterial(item.id, { status: newStatus });
        setMaterials(await maintenanceCadastroService.getMaterials());
      } else if (activeTab === 'technicians') {
        await maintenanceCadastroService.updateTechnician(item.id, { status: newStatus });
        setTechnicians(await maintenanceCadastroService.getTechnicians());
      } else if (activeTab === 'specialties') {
        await maintenanceCadastroService.updateSpecialty(item.id, { status: newStatus });
        setSpecialties(await maintenanceCadastroService.getSpecialties());
      } else if (activeTab === 'locations') {
        await maintenanceCadastroService.updateLocation(item.id, { status: newStatus });
        setLocations(await maintenanceCadastroService.getLocations());
      }
    } catch (err: any) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Deseja excluir "${item.name}"? Esta acao nao pode ser desfeita.`)) return;
    try {
      if (activeTab === 'equipment') {
        await maintenanceCadastroService.deleteEquipment(item.id);
        setEquipment(prev => prev.filter(i => i.id !== item.id));
      } else if (activeTab === 'occurrences') {
        await maintenanceCadastroService.deleteOccurrence(item.id);
        setOccurrences(prev => prev.filter(i => i.id !== item.id));
      } else if (activeTab === 'materials') {
        await maintenanceCadastroService.deleteMaterial(item.id);
        setMaterials(prev => prev.filter(i => i.id !== item.id));
      } else if (activeTab === 'technicians') {
        await maintenanceCadastroService.deleteTechnician(item.id);
        setTechnicians(prev => prev.filter(i => i.id !== item.id));
      } else if (activeTab === 'specialties') {
        await maintenanceCadastroService.deleteSpecialty(item.id);
        setSpecialties(prev => prev.filter(i => i.id !== item.id));
      } else if (activeTab === 'locations') {
        await maintenanceCadastroService.deleteLocation(item.id);
        setLocations(prev => prev.filter(i => i.id !== item.id));
      }
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const getItems = (): any[] => {
    if (activeTab === 'equipment') return equipment;
    if (activeTab === 'occurrences') return occurrences;
    if (activeTab === 'materials') return materials;
    if (activeTab === 'technicians') return technicians;
    if (activeTab === 'specialties') return specialties;
    if (activeTab === 'locations') return locations;
    return [];
  };

  const getSubtitle = (item: any): string => {
    if (activeTab === 'equipment') {
      const parts = [];
      if (item.tag_code) parts.push(`TAG: ${item.tag_code}`);
      if (item.manufacturer) parts.push(item.manufacturer);
      if (item.model) parts.push(item.model);
      if (item.sector) parts.push(item.sector);
      if (item.available_from && item.available_to) {
        const [hS, mS] = item.available_from.split(':').map(Number);
        const [hE, mE] = item.available_to.split(':').map(Number);
        const diff = (hE * 60 + mE) - (hS * 60 + mS);
        if (diff > 0) parts.push(`${(diff / 60).toFixed(1)}h/dia`);
      }
      return parts.join(' • ') || '—';
    }
    if (activeTab === 'materials') {
      const parts = [];
      if (item.warehouse_code) parts.push(`Alm: ${item.warehouse_code}`);
      if (item.unit) parts.push(`Un: ${item.unit}`);
      const eqNames = (item.linked_equipment && item.linked_equipment.length > 0)
        ? item.linked_equipment.map((e: any) => e.name).join(', ')
        : item.maintenance_equipment?.name || null;
      if (eqNames) parts.push(eqNames);
      return parts.join(' • ') || '—';
    }
    if (activeTab === 'technicians') {
      const parts = [];
      const emp = employees.find(e => e.name === item.name);
      if (emp?.role_name) parts.push(emp.role_name);
      if (item.maintenance_specialties?.name) parts.push(item.maintenance_specialties.name);
      return parts.join(' • ') || 'Sem especialidade';
    }
    return item.description || '—';
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const nameMatch = !matFilterName ||
        m.name.toLowerCase().includes(matFilterName.toLowerCase()) ||
        (m.warehouse_code || '').toLowerCase().includes(matFilterName.toLowerCase()) ||
        (m.description || '').toLowerCase().includes(matFilterName.toLowerCase());
      const eqMatch = !matFilterEquipment || (m.equipment_ids || []).includes(matFilterEquipment) || m.equipment_id === matFilterEquipment;
      const tagMatch = !matFilterTag ||
        (m.linked_equipment || []).some((e: any) =>
          (e.tag_code || '').toLowerCase().includes(matFilterTag.toLowerCase()) ||
          (e.name || '').toLowerCase().includes(matFilterTag.toLowerCase())
        ) ||
        (m.maintenance_equipment?.tag_code || '').toLowerCase().includes(matFilterTag.toLowerCase()) ||
        (m.maintenance_equipment?.name || '').toLowerCase().includes(matFilterTag.toLowerCase());
      return nameMatch && eqMatch && tagMatch;
    });
  }, [materials, matFilterName, matFilterEquipment, matFilterTag]);

  const exportMaterialsExcel = () => {
    const rows = filteredMaterials.map(m => ({
      'Codigo Almoxarifado': m.warehouse_code || '',
      'Nome do Material': m.name,
      'Descricao': m.description || '',
      'Unidade': m.unit,
      'Equipamento Vinculado': m.linked_equipment?.map((e: any) => e.name).join(', ') || m.maintenance_equipment?.name || '',
      'TAG': m.linked_equipment?.map((e: any) => e.tag_code).filter(Boolean).join(', ') || m.maintenance_equipment?.tag_code || '',
      'Status': m.status === 0 ? 'Ativo' : 'Inativo',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Materiais');
    XLSX.writeFile(wb, 'materiais_manutencao.xlsx');
  };

  const exportMaterialsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Material / Outros / Obs. - Manutencao', 14, 15);
    doc.setFontSize(9);
    doc.text(`Exportado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [['Cod. Alm.', 'Nome do Material', 'Descricao', 'Un', 'Equipamento', 'Status']],
      body: filteredMaterials.map(m => [
        m.warehouse_code || '',
        m.name,
        m.description || '',
        m.unit,
        m.linked_equipment?.map((e: any) => e.name).join(', ') || m.maintenance_equipment?.name || '',
        m.status === 0 ? 'Ativo' : 'Inativo',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [13, 148, 136] },
    });
    doc.save('materiais_manutencao.pdf');
  };

  const currentTab = TABS.find(t => t.id === activeTab)!;
  const items = getItems();

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => {
      const name = (item.name || '').toLowerCase();
      const tag = (item.tag_code || '').toLowerCase();
      const manufacturer = (item.manufacturer || '').toLowerCase();
      const model = (item.model || '').toLowerCase();
      const sector = (item.sector || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      const specialty = (item.maintenance_specialties?.name || '').toLowerCase();
      const warehouseCode = (item.warehouse_code || '').toLowerCase();
      return name.includes(q) || tag.includes(q) || manufacturer.includes(q) ||
        model.includes(q) || sector.includes(q) || description.includes(q) ||
        specialty.includes(q) || warehouseCode.includes(q);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">{currentTab.label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{currentTab.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'materials' && (                <>
                  <button
                    onClick={exportMaterialsExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                    title="Exportar para Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </button>
                  <button
                    onClick={exportMaterialsPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    title="Exportar para PDF"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                </>
              )}
              <button
                onClick={startAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={activeTab === 'materials' ? matFilterName : searchQuery}
              onChange={e => activeTab === 'materials' ? setMatFilterName(e.target.value) : setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'equipment' ? 'Pesquisar por nome, TAG, fabricante, modelo, setor...' :
                activeTab === 'materials' ? 'Pesquisar por nome, codigo ou descricao...' :
                activeTab === 'technicians' ? 'Pesquisar por nome ou especialidade...' :
                activeTab === 'locations' ? 'Pesquisar por nome ou descricao...' :
                'Pesquisar...'
              }
              className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
            />
            {(activeTab === 'materials' ? matFilterName : searchQuery) && (
              <button
                onClick={() => activeTab === 'materials' ? setMatFilterName('') : setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {activeTab === 'materials' && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2" />
              <div className="flex gap-2">
                <select
                  value={matFilterEquipment}
                  onChange={e => setMatFilterEquipment(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Todos os equipamentos</option>
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}{eq.tag_code ? ` (${eq.tag_code})` : ''}
                    </option>
                  ))}
                </select>
                {(matFilterName || matFilterEquipment || matFilterTag) && (
                  <button
                    onClick={() => { setMatFilterName(''); setMatFilterEquipment(''); setMatFilterTag(''); }}
                    className="flex items-center gap-1 px-2 py-1.5 text-gray-500 text-sm rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors flex-shrink-0"
                    title="Limpar filtros"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <div className="border-b border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start gap-3 flex-wrap">
              {activeTab === 'equipment' && (
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Equipamento *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ex: Esteira EM-04"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">TAG / Codigo</label>
                      <input
                        type="text"
                        value={formData.tag_code || ''}
                        onChange={e => setFormData(p => ({ ...p, tag_code: e.target.value }))}
                        placeholder="Ex: EM-04"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fabricante</label>
                      <input
                        type="text"
                        value={formData.manufacturer || ''}
                        onChange={e => setFormData(p => ({ ...p, manufacturer: e.target.value }))}
                        placeholder="Ex: Siemens, Bosch"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Modelo</label>
                      <input
                        type="text"
                        value={formData.model || ''}
                        onChange={e => setFormData(p => ({ ...p, model: e.target.value }))}
                        placeholder="Ex: XR-2000"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Numero de Serie</label>
                      <input
                        type="text"
                        value={formData.serial_number || ''}
                        onChange={e => setFormData(p => ({ ...p, serial_number: e.target.value }))}
                        placeholder="Ex: SN-123456"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Data de Instalacao</label>
                      <input
                        type="date"
                        value={formData.installation_date || ''}
                        onChange={e => setFormData(p => ({ ...p, installation_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Setor</label>
                      <select
                        value={formData.sector || ''}
                        onChange={e => setFormData(p => ({ ...p, sector: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Selecionar...</option>
                        {sectorList.map(s => (
                          <option key={s.id} value={s.description}>{s.description}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Custo Estimado por Hora (R$)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={formData.hourly_cost ?? 0}
                        onChange={e => setFormData(p => ({ ...p, hourly_cost: parseFloat(e.target.value) || 0 }))}
                        placeholder="0,00"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Valor de Compra Estimado (R$)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={formData.purchase_value ?? 0}
                        onChange={e => setFormData(p => ({ ...p, purchase_value: parseFloat(e.target.value) || 0 }))}
                        placeholder="0,00"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Disponivel De</label>
                      <input
                        type="time"
                        value={formData.available_from ?? ''}
                        onChange={e => setFormData(p => ({ ...p, available_from: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Disponivel Ate</label>
                      <input
                        type="time"
                        value={formData.available_to ?? ''}
                        onChange={e => setFormData(p => ({ ...p, available_to: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Total Horas Disponiveis/Dia</label>
                      <div className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm bg-gray-50 font-semibold text-teal-700">
                        {formData.available_from && formData.available_to
                          ? (() => {
                              const [hS, mS] = formData.available_from.split(':').map(Number);
                              const [hE, mE] = formData.available_to.split(':').map(Number);
                              const diff = (hE * 60 + mE) - (hS * 60 + mS);
                              return diff > 0 ? `${(diff / 60).toFixed(1)}h` : '0h';
                            })()
                          : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[220px]">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Manual da Maquina (PDF)</label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="truncate text-gray-500">
                            {manualFile ? manualFile.name : formData.manual_url ? 'Manual anexado' : 'Selecionar arquivo...'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={e => setManualFile(e.target.files?.[0] || null)}
                          />
                        </label>
                        {(manualFile || formData.manual_url) && (
                          <div className="flex items-center gap-1">
                            {formData.manual_url && !manualFile && (
                              <a
                                href={formData.manual_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                title="Visualizar manual"
                              >
                                <FileText className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => { setManualFile(null); setFormData(p => ({ ...p, manual_url: '' })); }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Remover manual"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={saving || uploadingManual}
                      className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                      {(saving || uploadingManual) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {editingId ? 'Salvar' : 'Adicionar'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="flex items-center gap-1.5 px-3 py-2 text-gray-600 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {(activeTab === 'occurrences' || activeTab === 'specialties' || activeTab === 'locations') && (
                <>
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="Nome..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descricao</label>
                    <input
                      type="text"
                      value={formData.description || ''}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                      placeholder="Descricao opcional..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {activeTab === 'materials' && (
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Material *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ex: Parafuso M8, Oleo Lubrificante"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Codigo Almoxarifado</label>
                      <input
                        type="text"
                        value={formData.warehouse_code || ''}
                        onChange={e => setFormData(p => ({ ...p, warehouse_code: e.target.value }))}
                        placeholder="Ex: ALM-0042"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Descricao do Material</label>
                      <input
                        type="text"
                        value={formData.description || ''}
                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                        placeholder="Descricao detalhada..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label>
                      <select
                        value={formData.unit || 'un'}
                        onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="un">un</option>
                        <option value="kg">kg</option>
                        <option value="L">L</option>
                        <option value="m">m</option>
                        <option value="cx">cx</option>
                        <option value="pc">pc</option>
                        <option value="par">par</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Valor do Produto (R$)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={formData.unit_price ?? 0}
                        onChange={e => setFormData(p => ({ ...p, unit_price: parseFloat(e.target.value) || 0 }))}
                        placeholder="0,00"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Equipamentos Vinculados</label>
                      <div ref={eqDropdownRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setEqDropdownOpen(o => !o)}
                          className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                        >
                          <span className="truncate text-left text-gray-700">
                            {selectedEquipmentIds.length === 0
                              ? 'Nenhum equipamento vinculado'
                              : selectedEquipmentIds.length === 1
                                ? equipment.find(e => e.id === selectedEquipmentIds[0])?.name || '1 selecionado'
                                : `${selectedEquipmentIds.length} equipamentos selecionados`}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${eqDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {eqDropdownOpen && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                            <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                              <input
                                type="checkbox"
                                checked={selectedEquipmentIds.length === 0}
                                onChange={() => setSelectedEquipmentIds([])}
                                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                              <span className="text-sm text-gray-500 italic">Nenhum equipamento</span>
                            </label>
                            {equipment.filter(eq => eq.status === 0).map(eq => (
                              <label key={eq.id} className="flex items-center gap-2 px-3 py-2 hover:bg-teal-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedEquipmentIds.includes(eq.id)}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedEquipmentIds(prev => [...prev, eq.id]);
                                    } else {
                                      setSelectedEquipmentIds(prev => prev.filter(id => id !== eq.id));
                                    }
                                  }}
                                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                />
                                <span className="text-sm text-gray-700">
                                  {eq.name}{eq.tag_code ? <span className="text-gray-400 ml-1">({eq.tag_code})</span> : ''}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                        {selectedEquipmentIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {selectedEquipmentIds.map(id => {
                              const eq = equipment.find(e => e.id === id);
                              return eq ? (
                                <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-xs border border-teal-200">
                                  {eq.name}{eq.tag_code ? ` (${eq.tag_code})` : ''}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedEquipmentIds(prev => prev.filter(i => i !== id))}
                                    className="hover:text-teal-900 ml-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {editingId ? 'Salvar' : 'Adicionar'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="flex items-center gap-1.5 px-3 py-2 text-gray-600 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'technicians' && (
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Colaborador *</label>
                      <select
                        value={formData.name || ''}
                        onChange={e => {
                          const selected = employees.find(emp => emp.name === e.target.value);
                          setFormData(p => ({
                            ...p,
                            name: e.target.value,
                            role_display: selected?.role_name || '',
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Selecionar colaborador...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.name}>
                            {emp.name}{emp.role_name ? ` — ${emp.role_name}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                      <input
                        type="text"
                        value={formData.role_display || ''}
                        readOnly
                        placeholder="Preenchido automaticamente"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Especialidade</label>
                      <select
                        value={formData.specialty_id || ''}
                        onChange={e => setFormData(p => ({ ...p, specialty_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Selecionar...</option>
                        {specialties.filter(s => s.status === 0).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'equipment' && activeTab !== 'materials' && (
                <div className="flex items-end gap-2 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editingId ? 'Salvar' : 'Adicionar'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex items-center gap-1.5 px-3 py-2 text-gray-600 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : (activeTab === 'materials' ? filteredMaterials : filteredItems).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <currentTab.icon className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">{searchQuery || matFilterName || matFilterEquipment || matFilterTag ? 'Nenhum resultado encontrado' : 'Nenhum cadastro encontrado'}</p>
            <p className="text-xs mt-1">{searchQuery || matFilterName || matFilterEquipment || matFilterTag ? 'Tente outros termos de pesquisa' : 'Clique em "Adicionar" para cadastrar'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(activeTab === 'materials' ? filteredMaterials : filteredItems).map(item => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 truncate">{getSubtitle(item)}</p>
                    {activeTab === 'equipment' && item.status === 1 && item.inactivated_at && (
                      <p className="text-xs text-red-400 mt-0.5">
                        Inativado em {new Date(item.inactivated_at).toLocaleDateString('pt-BR')}
                        {item.inactivation_reason ? ` — ${item.inactivation_reason}` : ''}
                      </p>
                    )}
                    {activeTab === 'materials' && item.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      item.status === 0
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={item.status === 0 ? 'Ativo — clique para inativar' : 'Inativo — clique para ativar'}
                  >
                    {item.status === 0 ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {inactivationModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Inativar Equipamento</h3>
              <p className="text-sm text-gray-500 mt-0.5">{inactivationModal.item.name}</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motivo da Inativacao</label>
                <textarea
                  value={inactivationReason}
                  onChange={e => setInactivationReason(e.target.value)}
                  placeholder="Descreva o motivo da inativacao (opcional)..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => { setInactivationModal(null); setInactivationReason(''); }}
                className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmInactivation}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Confirmar Inativacao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
