import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Save, CreditCard as Edit3, Copy, Grid3x3, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Team {
  id: string;
  name: string;
}

interface PerformanceAdherence {
  id: string;
  name: string;
  green_min: number;
  yellow_min: number;
  yellow_max: number;
  is_active: boolean;
}

interface TeamUpload {
  id: string;
  team_id: string;
  file_name: string;
  reference_month: string;
  description?: string;
  upload_date: string;
  team?: { id: string; name: string };
}

interface TeamSection {
  id: string;
  upload_id: string;
  title: string;
  section_key: string;
  display_order: number;
  has_subject: boolean;
  show_day_total: boolean;
  show_quality_adherence: boolean;
  status: number;
}

interface TeamRecord {
  id: string;
  upload_id: string;
  team_id: string;
  work_date: string;
  points: number | null;
  subject: string | null;
  section_type: string;
  category: string | null;
  is_percentage?: boolean;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDayOfWeek(date: Date): string {
  return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][date.getDay()];
}

function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export function TeamProductivityUpload() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [uploads, setUploads] = useState<TeamUpload[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<TeamUpload | null>(null);
  const [sections, setSections] = useState<TeamSection[]>([]);
  const [records, setRecords] = useState<TeamRecord[]>([]);
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [adherenceConfig, setAdherenceConfig] = useState<PerformanceAdherence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editedRecords, setEditedRecords] = useState<Record<string, Record<string, number | string | null>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [periodData, setPeriodData] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    description: ''
  });

  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<TeamSection | null>(null);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    section_key: '',
    has_subject: false,
    show_day_total: true,
    show_quality_adherence: false,
    display_order: 0,
    initialSubjects: [{ name: '', is_percentage: false }] as { name: string; is_percentage: boolean }[]
  });

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneData, setCloneData] = useState({
    targetMonth: new Date().getMonth(),
    targetYear: new Date().getFullYear()
  });
  const [isCloning, setIsCloning] = useState(false);

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [addSubjectData, setAddSubjectData] = useState({ sectionKey: '', subjects: [{ name: '', is_percentage: false }] as { name: string; is_percentage: boolean }[] });
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [editSubjectData, setEditSubjectData] = useState({ sectionKey: '', oldSubject: '', newSubject: '' });
  const [showDeleteSubjectModal, setShowDeleteSubjectModal] = useState(false);
  const [deleteSubjectData, setDeleteSubjectData] = useState({ sectionKey: '', subject: '' });

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const syncScroll = useCallback((source: HTMLDivElement, target: HTMLDivElement) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    target.scrollLeft = source.scrollLeft;
    requestAnimationFrame(() => { isSyncing.current = false; });
  }, []);

  useEffect(() => {
    loadTeams();
    loadHolidays();
    loadAdherenceConfig();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadUploads();
    } else {
      setUploads([]);
      setSelectedUpload(null);
    }
  }, [selectedTeam]);

  useEffect(() => {
    if (selectedUpload) {
      loadSections(selectedUpload.id);
      loadRecords(selectedUpload.id);
      setIsEditingMode(false);
      setEditedRecords({});
      setHasChanges(false);
    }
  }, [selectedUpload]);

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('date')
        .eq('status', 0);
      if (error) throw error;
      setHolidays(new Set(data?.map(h => h.date) || []));
    } catch (error) {
      console.error('Error loading holidays:', error);
    }
  };

  const loadAdherenceConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('performance_adherence')
        .select('*')
        .eq('is_active', true)
        .order('name')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setAdherenceConfig(data);
    } catch (error) {
      console.error('Error loading adherence config:', error);
    }
  };

  const loadUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('team_productivity_uploads')
        .select('*, team:teams!team_id(id, name)')
        .eq('team_id', selectedTeam)
        .order('reference_month', { ascending: false });
      if (error) throw error;
      setUploads(data || []);
      if (data && data.length > 0 && !selectedUpload) {
        setSelectedUpload(data[0]);
      }
    } catch (error) {
      console.error('Error loading uploads:', error);
    }
  };

  const loadSections = async (uploadId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_productivity_sections')
        .select('*')
        .eq('upload_id', uploadId)
        .eq('status', 0)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const loadRecords = async (uploadId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_productivity_records')
        .select('*')
        .eq('upload_id', uploadId)
        .order('work_date', { ascending: true });
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading records:', error);
    }
  };

  const handleCreatePeriod = async () => {
    if (!selectedTeam) return;
    const refMonth = `${periodData.year}-${String(periodData.month + 1).padStart(2, '0')}`;
    const existing = uploads.find(u => u.reference_month === refMonth);
    if (existing) {
      alert('Ja existe um periodo para este mes nesta equipe.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('team_productivity_uploads')
        .insert({
          team_id: selectedTeam,
          file_name: `${MONTHS[periodData.month]} ${periodData.year}`,
          reference_month: refMonth,
          description: periodData.description || null,
          created_by: user?.id
        })
        .select('*, team:teams!team_id(id, name)')
        .single();
      if (error) throw error;
      setShowPeriodModal(false);
      await loadUploads();
      setSelectedUpload(data);
    } catch (error) {
      console.error('Error creating period:', error);
      alert('Erro ao criar periodo.');
    }
  };

  const handleDeleteUpload = async (uploadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este periodo e todos os seus dados?')) return;
    try {
      const { error } = await supabase
        .from('team_productivity_uploads')
        .delete()
        .eq('id', uploadId);
      if (error) throw error;
      setSelectedUpload(null);
      await loadUploads();
    } catch (error) {
      console.error('Error deleting upload:', error);
      alert('Erro ao excluir periodo.');
    }
  };

  const handleCreateSection = async () => {
    if (!selectedUpload || !sectionForm.title.trim()) {
      alert('Preencha o titulo da tabela.');
      return;
    }
    try {
      const generatedKey = editingSection
        ? sectionForm.section_key
        : sectionForm.title.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
      const payload = {
        upload_id: selectedUpload.id,
        title: sectionForm.title.trim(),
        section_key: generatedKey,
        has_subject: sectionForm.has_subject,
        show_day_total: sectionForm.show_day_total,
        show_quality_adherence: sectionForm.show_quality_adherence,
        display_order: sectionForm.display_order || sections.length + 1,
        status: 0
      };
      if (editingSection) {
        const { error } = await supabase
          .from('team_productivity_sections')
          .update(payload)
          .eq('id', editingSection.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_productivity_sections')
          .insert([payload]);
        if (error) throw error;

        if (sectionForm.has_subject) {
          const validSubjects = sectionForm.initialSubjects.filter(s => s.name.trim());
          if (validSubjects.length > 0) {
            const date = new Date(selectedUpload.reference_month + 'T12:00:00');
            const firstDayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
            const subjectRecords = validSubjects.map(s => ({
              upload_id: selectedUpload.id,
              team_id: selectedUpload.team_id,
              section_type: generatedKey,
              subject: s.name.trim(),
              work_date: firstDayStr,
              points: 0,
              is_percentage: s.is_percentage
            }));
            const { error: recErr } = await supabase.from('team_productivity_records').insert(subjectRecords);
            if (recErr) console.error('Error inserting initial subjects:', recErr);
          }
        }
      }
      await loadSections(selectedUpload.id);
      if (selectedUpload) await loadRecords(selectedUpload.id);
      setShowSectionModal(false);
      setEditingSection(null);
      setSectionForm({ title: '', section_key: '', has_subject: false, show_day_total: true, display_order: 0, initialSubjects: [{ name: '', is_percentage: false }] });
    } catch (error: any) {
      console.error('Error saving section:', error);
      alert('Erro ao salvar tabela: ' + error.message);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Excluir esta tabela?')) return;
    try {
      const { error } = await supabase
        .from('team_productivity_sections')
        .update({ status: 1 })
        .eq('id', sectionId);
      if (error) throw error;
      if (selectedUpload) await loadSections(selectedUpload.id);
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  const getCellKey = (sectionType: string, subject: string | null, dateStr: string) =>
    `${sectionType}||${subject || ''}||${dateStr}`;

  const getCellValue = (sectionType: string, subject: string | null, dateStr: string): number | string | null => {
    const key = getCellKey(sectionType, subject, dateStr);
    if (isEditingMode && editedRecords[key] !== undefined) {
      return editedRecords[key].value ?? null;
    }
    const rec = records.find(r =>
      r.section_type === sectionType &&
      r.subject === (subject || null) &&
      r.work_date === dateStr
    );
    return rec?.points ?? null;
  };

  const handleCellChange = (sectionType: string, subject: string | null, dateStr: string, value: string) => {
    const key = getCellKey(sectionType, subject, dateStr);
    setEditedRecords(prev => ({
      ...prev,
      [key]: { value: value === '' ? null : value }
    }));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    if (!selectedUpload) return;
    setIsSaving(true);
    try {
      const upsertPayload: any[] = [];
      for (const [key, val] of Object.entries(editedRecords)) {
        const [sectionType, subject, dateStr] = key.split('||');
        const existingRec = records.find(r =>
          r.section_type === sectionType &&
          r.subject === (subject || null) &&
          r.work_date === dateStr
        );
        const points = val.value === null || val.value === '' ? null : parseFloat(String(val.value).replace(',', '.'));
        if (existingRec) {
          const { error } = await supabase
            .from('team_productivity_records')
            .update({ points })
            .eq('id', existingRec.id);
          if (error) throw error;
        } else if (points !== null) {
          const sameSubjectRec = records.find(r =>
            r.section_type === sectionType && r.subject === (subject || null)
          );
          upsertPayload.push({
            upload_id: selectedUpload.id,
            team_id: selectedUpload.team_id,
            section_type: sectionType,
            subject: subject || null,
            work_date: dateStr,
            points,
            is_percentage: sameSubjectRec?.is_percentage || false
          });
        }
      }
      if (upsertPayload.length > 0) {
        const { error } = await supabase.from('team_productivity_records').insert(upsertPayload);
        if (error) throw error;
      }
      await loadRecords(selectedUpload.id);
      setEditedRecords({});
      setHasChanges(false);
      setIsEditingMode(false);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClone = async () => {
    if (!selectedUpload || !selectedTeam) return;
    const targetMonth = `${cloneData.targetYear}-${String(cloneData.targetMonth + 1).padStart(2, '0')}`;
    const exists = uploads.find(u => u.reference_month === targetMonth);
    if (exists) {
      alert('Ja existe um periodo para este mes.');
      return;
    }
    setIsCloning(true);
    try {
      const { data: newUpload, error: upErr } = await supabase
        .from('team_productivity_uploads')
        .insert({
          team_id: selectedTeam,
          file_name: `${MONTHS[cloneData.targetMonth]} ${cloneData.targetYear}`,
          reference_month: targetMonth,
          description: selectedUpload.description || null,
          created_by: user?.id
        })
        .select('*')
        .single();
      if (upErr) throw upErr;

      if (sections.length > 0) {
        const newSections = sections.map(s => ({
          upload_id: newUpload.id,
          title: s.title,
          section_key: s.section_key,
          has_subject: s.has_subject,
          show_day_total: s.show_day_total,
          show_quality_adherence: s.show_quality_adherence,
          display_order: s.display_order,
          status: 0
        }));
        const { error: secErr } = await supabase.from('team_productivity_sections').insert(newSections);
        if (secErr) throw secErr;
      }

      setShowCloneModal(false);
      await loadUploads();
      alert('Periodo clonado com sucesso! Os dados nao foram copiados, apenas a estrutura das tabelas.');
    } catch (error) {
      console.error('Error cloning:', error);
      alert('Erro ao clonar periodo.');
    } finally {
      setIsCloning(false);
    }
  };

  const handleAddSubjects = async () => {
    if (!selectedUpload || addSubjectData.subjects.filter(s => s.name.trim()).length === 0) return;
    try {
      const date = new Date(selectedUpload.reference_month + 'T12:00:00');
      const firstDayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      const toInsert = [];
      for (const subj of addSubjectData.subjects.filter(s => s.name.trim())) {
        const exists = records.find(r =>
          r.section_type === addSubjectData.sectionKey && r.subject === subj.name.trim()
        );
        if (!exists) {
          toInsert.push({
            upload_id: selectedUpload.id,
            team_id: selectedUpload.team_id,
            section_type: addSubjectData.sectionKey,
            subject: subj.name.trim(),
            work_date: firstDayStr,
            points: 0,
            is_percentage: subj.is_percentage
          });
        }
      }
      if (toInsert.length > 0) {
        const { error } = await supabase.from('team_productivity_records').insert(toInsert);
        if (error) throw error;
      }
      await loadRecords(selectedUpload.id);
      setShowAddSubjectModal(false);
      setAddSubjectData({ sectionKey: '', subjects: [{ name: '', is_percentage: false }] });
    } catch (error) {
      console.error('Error adding subjects:', error);
      alert('Erro ao adicionar assuntos.');
    }
  };

  const handleEditSubject = async () => {
    if (!selectedUpload || !editSubjectData.oldSubject || !editSubjectData.newSubject.trim()) return;
    try {
      const { error } = await supabase
        .from('team_productivity_records')
        .update({ subject: editSubjectData.newSubject.trim() })
        .eq('upload_id', selectedUpload.id)
        .eq('section_type', editSubjectData.sectionKey)
        .eq('subject', editSubjectData.oldSubject);
      if (error) throw error;
      await loadRecords(selectedUpload.id);
      setShowEditSubjectModal(false);
      setEditSubjectData({ sectionKey: '', oldSubject: '', newSubject: '' });
    } catch (error) {
      console.error('Error editing subject:', error);
      alert('Erro ao editar assunto.');
    }
  };

  const handleDeleteSubject = async () => {
    if (!selectedUpload || !deleteSubjectData.subject) return;
    try {
      const { error } = await supabase
        .from('team_productivity_records')
        .delete()
        .eq('upload_id', selectedUpload.id)
        .eq('section_type', deleteSubjectData.sectionKey)
        .eq('subject', deleteSubjectData.subject);
      if (error) throw error;
      await loadRecords(selectedUpload.id);
      setShowDeleteSubjectModal(false);
      setDeleteSubjectData({ sectionKey: '', subject: '' });
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Erro ao excluir assunto.');
    }
  };

  const getMonthDays = (upload: TeamUpload): Date[] => {
    const [year, month] = upload.reference_month.split('-').map(Number);
    return getDaysInMonth(year, month - 1);
  };

  const getSectionSubjects = (section: TeamSection): string[] => {
    if (!section.has_subject) return [''];
    const subjects = new Set<string>();
    records
      .filter(r => r.section_type === section.section_key && r.subject)
      .forEach(r => subjects.add(r.subject!));
    return Array.from(subjects).sort();
  };

  const getDayTotal = (section: TeamSection, dateStr: string): number => {
    const subjects = section.has_subject ? getSectionSubjects(section) : [''];
    return subjects.reduce((sum, subj) => {
      const val = getCellValue(section.section_key, subj || null, dateStr);
      return sum + (parseFloat(String(val || 0)) || 0);
    }, 0);
  };

  const getMonthTotal = (section: TeamSection, subject: string | null): number => {
    if (!selectedUpload) return 0;
    const days = getMonthDays(selectedUpload);
    return days.reduce((sum, d) => {
      const val = getCellValue(section.section_key, subject, formatDateKey(d));
      return sum + (parseFloat(String(val || 0)) || 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const days = selectedUpload ? getMonthDays(selectedUpload) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Equipe</label>
          <select
            value={selectedTeam}
            onChange={(e) => { setSelectedTeam(e.target.value); setSelectedUpload(null); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Selecione uma equipe...</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {selectedTeam && (
          <>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Periodo</label>
              <select
                value={selectedUpload?.id || ''}
                onChange={(e) => {
                  const up = uploads.find(u => u.id === e.target.value) || null;
                  setSelectedUpload(up);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Selecione um periodo...</option>
                {uploads.map(u => (
                  <option key={u.id} value={u.id}>{u.file_name}{u.description ? ` - ${u.description}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setShowPeriodModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Novo Periodo
              </button>
              {selectedUpload && (
                <button
                  onClick={() => setShowCloneModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Clonar
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {selectedUpload && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-800">
                {selectedUpload.file_name}
                {selectedUpload.description && <span className="text-gray-500 font-normal ml-2">- {selectedUpload.description}</span>}
              </h3>
              <button
                onClick={() => {
                  setShowSectionModal(true);
                  setEditingSection(null);
                  setSectionForm({ title: '', section_key: '', has_subject: false, show_day_total: true, display_order: 0, initialSubjects: [{ name: '', is_percentage: false }] });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <Grid3x3 className="w-4 h-4" />
                Nova Tabela
              </button>
            </div>
            <div className="flex items-center gap-2">
              {isEditingMode ? (
                <>
                  <button
                    onClick={() => { setIsEditingMode(false); setEditedRecords({}); setHasChanges(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={isSaving || !hasChanges}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar Dados
                </button>
              )}
              <button
                onClick={() => handleDeleteUpload(selectedUpload.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Periodo
              </button>
            </div>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <Grid3x3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma tabela criada ainda.</p>
              <p className="text-sm text-gray-400 mt-1">Clique em "Nova Tabela" para comecar.</p>
            </div>
          ) : (
            sections.map(section => {
              const subjects = getSectionSubjects(section);
              const rows = section.has_subject ? subjects : [''];
              return (
                <SectionTable
                  key={section.id}
                  section={section}
                  days={days}
                  rows={rows}
                  holidays={holidays}
                  isEditingMode={isEditingMode}
                  getCellValue={getCellValue}
                  onCellChange={handleCellChange}
                  getDayTotal={getDayTotal}
                  getMonthTotal={getMonthTotal}
                  onEditSection={() => {
                    setEditingSection(section);
                    setSectionForm({
                      title: section.title,
                      section_key: section.section_key,
                      has_subject: section.has_subject,
                      show_day_total: section.show_day_total,
                      show_quality_adherence: section.show_quality_adherence,
                      display_order: section.display_order,
                      initialSubjects: [{ name: '', is_percentage: false }]
                    });
                    setShowSectionModal(true);
                  }}
                  onDeleteSection={() => handleDeleteSection(section.id)}
                  onAddSubject={() => {
                    setAddSubjectData({ sectionKey: section.section_key, subjects: [{ name: '', is_percentage: false }] });
                    setShowAddSubjectModal(true);
                  }}
                  onEditSubject={(subject) => {
                    setEditSubjectData({ sectionKey: section.section_key, oldSubject: subject, newSubject: subject });
                    setShowEditSubjectModal(true);
                  }}
                  onDeleteSubject={(subject) => {
                    setDeleteSubjectData({ sectionKey: section.section_key, subject });
                    setShowDeleteSubjectModal(true);
                  }}
                  adherenceConfig={adherenceConfig}
                  records={records}
                  headerScrollRef={headerScrollRef}
                  bodyScrollRef={bodyScrollRef}
                  syncScroll={syncScroll}
                />
              );
            })
          )}
        </div>
      )}

      {showPeriodModal && (
        <Modal title="Novo Periodo" onClose={() => setShowPeriodModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                <select
                  value={periodData.month}
                  onChange={(e) => setPeriodData(p => ({ ...p, month: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                <input
                  type="number"
                  value={periodData.year}
                  onChange={(e) => setPeriodData(p => ({ ...p, year: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min={2020}
                  max={2099}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPeriodModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCreatePeriod} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Criar Periodo</button>
            </div>
          </div>
        </Modal>
      )}

      {showSectionModal && (
        <Modal title={editingSection ? 'Editar Tabela' : 'Nova Tabela'} onClose={() => { setShowSectionModal(false); setEditingSection(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
              <input
                type="text"
                value={sectionForm.title}
                onChange={(e) => setSectionForm(s => ({ ...s, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Ex: Producao Planejada, Meta Diaria..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sectionForm.has_subject}
                  onChange={(e) => setSectionForm(s => ({ ...s, has_subject: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Tem assunto/linha por categoria</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sectionForm.show_day_total}
                  onChange={(e) => setSectionForm(s => ({ ...s, show_day_total: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Mostrar total por dia</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sectionForm.show_quality_adherence}
                  onChange={(e) => setSectionForm(s => ({ ...s, show_quality_adherence: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Mostrar Aderencia Qualidade</span>
              </label>
            </div>
            {sectionForm.has_subject && !editingSection && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assuntos</label>
                <div className="space-y-2">
                  {sectionForm.initialSubjects.map((subj, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={subj.name}
                        onChange={(e) => {
                          const updated = [...sectionForm.initialSubjects];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setSectionForm(s => ({ ...s, initialSubjects: updated }));
                        }}
                        placeholder="Ex: Planejado, Realizado..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap" title="Exibir valores como porcentagem">
                        <input
                          type="checkbox"
                          checked={subj.is_percentage}
                          onChange={(e) => {
                            const updated = [...sectionForm.initialSubjects];
                            updated[idx] = { ...updated[idx], is_percentage: e.target.checked };
                            setSectionForm(s => ({ ...s, initialSubjects: updated }));
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </label>
                      {sectionForm.initialSubjects.length > 1 && (
                        <button
                          onClick={() => {
                            const updated = sectionForm.initialSubjects.filter((_, i) => i !== idx);
                            setSectionForm(s => ({ ...s, initialSubjects: updated }));
                          }}
                          className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setSectionForm(s => ({ ...s, initialSubjects: [...s.initialSubjects, { name: '', is_percentage: false }] }))}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar outro assunto
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowSectionModal(false); setEditingSection(null); }} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCreateSection} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </Modal>
      )}

      {showCloneModal && (
        <Modal title="Clonar Periodo" onClose={() => setShowCloneModal(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Cria um novo periodo com a mesma estrutura de tabelas do periodo atual, sem copiar os dados.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mes Destino</label>
                <select
                  value={cloneData.targetMonth}
                  onChange={(e) => setCloneData(c => ({ ...c, targetMonth: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano Destino</label>
                <input
                  type="number"
                  value={cloneData.targetYear}
                  onChange={(e) => setCloneData(c => ({ ...c, targetYear: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min={2020}
                  max={2099}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCloneModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleClone} disabled={isCloning} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {isCloning ? 'Clonando...' : 'Clonar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAddSubjectModal && (
        <Modal title="Adicionar Assuntos" onClose={() => { setShowAddSubjectModal(false); setAddSubjectData({ sectionKey: '', subjects: [{ name: '', is_percentage: false }] }); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assuntos (um por linha)</label>
              <div className="space-y-2">
                {addSubjectData.subjects.map((subj, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={subj.name}
                      onChange={(e) => {
                        const updated = [...addSubjectData.subjects];
                        updated[index] = { ...updated[index], name: e.target.value };
                        setAddSubjectData(prev => ({ ...prev, subjects: updated }));
                      }}
                      placeholder="Ex: Planejado, Realizado..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap" title="Exibir valores como porcentagem">
                      <input
                        type="checkbox"
                        checked={subj.is_percentage}
                        onChange={(e) => {
                          const updated = [...addSubjectData.subjects];
                          updated[index] = { ...updated[index], is_percentage: e.target.checked };
                          setAddSubjectData(prev => ({ ...prev, subjects: updated }));
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </label>
                    {addSubjectData.subjects.length > 1 && (
                      <button
                        onClick={() => {
                          const updated = addSubjectData.subjects.filter((_, i) => i !== index);
                          setAddSubjectData(prev => ({ ...prev, subjects: updated }));
                        }}
                        className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setAddSubjectData(prev => ({ ...prev, subjects: [...prev.subjects, { name: '', is_percentage: false }] }))}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar outro assunto
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowAddSubjectModal(false); setAddSubjectData({ sectionKey: '', subjects: [{ name: '', is_percentage: false }] }); }} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button
                onClick={handleAddSubjects}
                disabled={addSubjectData.subjects.filter(s => s.name.trim()).length === 0}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar ({addSubjectData.subjects.filter(s => s.name.trim()).length})
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showEditSubjectModal && (
        <Modal title="Editar Assunto" onClose={() => { setShowEditSubjectModal(false); setEditSubjectData({ sectionKey: '', oldSubject: '', newSubject: '' }); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assunto Atual</label>
              <input type="text" value={editSubjectData.oldSubject} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Novo Assunto</label>
              <input
                type="text"
                value={editSubjectData.newSubject}
                onChange={(e) => setEditSubjectData(prev => ({ ...prev, newSubject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Digite o novo nome do assunto"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowEditSubjectModal(false); setEditSubjectData({ sectionKey: '', oldSubject: '', newSubject: '' }); }} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button
                onClick={handleEditSubject}
                disabled={!editSubjectData.newSubject.trim() || editSubjectData.newSubject === editSubjectData.oldSubject}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteSubjectModal && (
        <Modal title="Excluir Assunto" onClose={() => { setShowDeleteSubjectModal(false); setDeleteSubjectData({ sectionKey: '', subject: '' }); }}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  Tem certeza que deseja excluir o assunto <strong>"{deleteSubjectData.subject}"</strong>? Todos os dados relacionados a este assunto serao perdidos.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowDeleteSubjectModal(false); setDeleteSubjectData({ sectionKey: '', subject: '' }); }} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDeleteSubject} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

interface SectionTableProps {
  section: TeamSection;
  days: Date[];
  rows: string[];
  holidays: Set<string>;
  isEditingMode: boolean;
  getCellValue: (sectionType: string, subject: string | null, dateStr: string) => number | string | null;
  onCellChange: (sectionType: string, subject: string | null, dateStr: string, value: string) => void;
  getDayTotal: (section: TeamSection, dateStr: string) => number;
  getMonthTotal: (section: TeamSection, subject: string | null) => number;
  onEditSection: () => void;
  onDeleteSection: () => void;
  onAddSubject: () => void;
  onEditSubject: (subject: string) => void;
  onDeleteSubject: (subject: string) => void;
  adherenceConfig: PerformanceAdherence | null;
  records: TeamRecord[];
  headerScrollRef: React.RefObject<HTMLDivElement>;
  bodyScrollRef: React.RefObject<HTMLDivElement>;
  syncScroll: (source: HTMLDivElement, target: HTMLDivElement) => void;
}

function SectionTable({ section, days, rows, holidays, isEditingMode, getCellValue, onCellChange, getDayTotal, getMonthTotal, onEditSection, onDeleteSection, onAddSubject, onEditSubject, onDeleteSubject, adherenceConfig, records, syncScroll }: SectionTableProps) {
  const [collapsed, setCollapsed] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const COL_W = 48;
  const LABEL_W = 160;

  const isSubjectPercentage = (subject: string | null): boolean => {
    if (!subject) return false;
    return records.some(r => r.section_type === section.section_key && r.subject === subject && r.is_percentage);
  };

  const handleHeaderScroll = () => {
    if (headerRef.current && bodyRef.current) syncScroll(headerRef.current, bodyRef.current);
  };
  const handleBodyScroll = () => {
    if (bodyRef.current && headerRef.current) syncScroll(bodyRef.current, headerRef.current);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(c => !c)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <span className="font-semibold text-gray-800 text-sm">{section.title}</span>
          <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{section.section_key}</span>
        </div>
        <div className="flex items-center gap-1">
          {section.has_subject && (
            <button onClick={onAddSubject} className="flex items-center gap-1 px-2 py-1.5 text-xs text-green-700 hover:bg-green-50 rounded transition-colors" title="Adicionar assunto">
              <Plus className="w-3.5 h-3.5" />
              Assunto
            </button>
          )}
          <button onClick={onEditSection} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors" title="Editar tabela">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={onDeleteSection} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors" title="Excluir tabela">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div>
          <div
            ref={headerRef}
            onScroll={handleHeaderScroll}
            className="overflow-x-auto border-b border-gray-200"
            style={{ scrollbarHeight: 'none' }}
          >
            <div style={{ minWidth: LABEL_W + days.length * COL_W + COL_W }}>
              <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 bg-gray-50 border-b border-r border-gray-200 text-left px-3 py-2 font-medium text-gray-600 z-10" style={{ minWidth: LABEL_W, width: LABEL_W }}>
                      {section.has_subject ? 'Assunto' : 'Equipe'}
                    </th>
                    {days.map(d => {
                      const key = formatDateKey(d);
                      const isHol = holidays.has(key);
                      const isWknd = isWeekend(d);
                      return (
                        <th
                          key={key}
                          className={`border-b border-r border-gray-200 text-center py-1 px-0 font-medium ${isHol ? 'bg-red-50 text-red-600' : isWknd ? 'bg-gray-100 text-gray-400' : 'text-gray-600'}`}
                          style={{ minWidth: COL_W, width: COL_W, maxWidth: COL_W }}
                        >
                          <div>{d.getDate()}</div>
                          <div className="text-gray-400 font-normal">{getDayOfWeek(d)}</div>
                        </th>
                      );
                    })}
                    <th className="border-b border-gray-200 text-center px-2 py-2 font-medium text-gray-600 bg-blue-50" style={{ minWidth: COL_W }}>Total</th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>

          <div
            ref={bodyRef}
            onScroll={handleBodyScroll}
            className="overflow-x-auto"
          >
            <div style={{ minWidth: LABEL_W + days.length * COL_W + COL_W }}>
              <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
                <tbody>
                  {rows.map((rowLabel, rowIdx) => {
                    const subject = section.has_subject ? rowLabel : null;
                    const monthTotal = getMonthTotal(section, subject);
                    const isPct = isSubjectPercentage(subject);
                    const formatVal = (v: number | string | null) => {
                      if (v === null || v === '') return '-';
                      return isPct ? `${v}%` : String(v);
                    };
                    return (
                      <tr key={rowIdx} className="hover:bg-gray-50">
                        <td className="sticky left-0 bg-white border-b border-r border-gray-200 px-2 py-1 font-medium text-gray-700 z-10 hover:bg-gray-50 group" style={{ minWidth: LABEL_W, width: LABEL_W }}>
                          {section.has_subject ? (
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate text-xs">
                                {rowLabel || '-'}
                                {isPct && <span className="ml-1 text-blue-500 text-[10px]">(%)</span>}
                              </span>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => onEditSubject(rowLabel)} className="p-0.5 text-gray-400 hover:text-blue-600 rounded" title="Editar assunto">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button onClick={() => onDeleteSubject(rowLabel)} className="p-0.5 text-gray-400 hover:text-red-600 rounded" title="Excluir assunto">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : 'Valor'}
                        </td>
                        {days.map(d => {
                          const key = formatDateKey(d);
                          const isHol = holidays.has(key);
                          const isWknd = isWeekend(d);
                          const cellVal = getCellValue(section.section_key, subject, key);
                          return (
                            <td
                              key={key}
                              className={`border-b border-r border-gray-200 text-center p-0 ${isHol ? 'bg-red-50' : isWknd ? 'bg-gray-50' : ''}`}
                              style={{ minWidth: COL_W, width: COL_W, maxWidth: COL_W }}
                            >
                              {isEditingMode ? (
                                <input
                                  type="text"
                                  value={cellVal === null ? '' : String(cellVal)}
                                  onChange={(e) => onCellChange(section.section_key, subject, key, e.target.value)}
                                  className={`w-full text-center border-none outline-none bg-transparent py-2 text-xs ${isHol ? 'bg-red-50' : isWknd ? 'bg-gray-50' : 'bg-white'} focus:bg-yellow-50`}
                                  inputMode="decimal"
                                />
                              ) : (
                                <span className={`block py-2 ${cellVal !== null && cellVal !== '' ? 'text-gray-900 font-medium' : 'text-gray-300'}`}>
                                  {formatVal(cellVal)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="border-b border-gray-200 text-center py-2 font-semibold text-blue-700 bg-blue-50">
                          {monthTotal > 0 ? (isPct ? `${monthTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : monthTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {section.show_day_total && section.has_subject && (() => {
                    const realizadoSubject = rows.find(r => r.toLowerCase().includes('realizado'));
                    const planejadoSubject = rows.find(r => r.toLowerCase().includes('planejado'));
                    const refugoSubject = rows.find(r => r.toLowerCase().includes('refugo'));
                    const hasAdherence = !!realizadoSubject && !!planejadoSubject && !!adherenceConfig;

                    if (hasAdherence) {
                      const getAdherenceColor = (pct: number) => {
                        if (pct >= adherenceConfig!.green_min) return { bg: 'bg-green-100', text: 'text-green-700' };
                        if (pct >= adherenceConfig!.yellow_min && pct <= adherenceConfig!.yellow_max) return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
                        return { bg: 'bg-red-100', text: 'text-red-700' };
                      };

                      let totalRealizado = 0;
                      let totalPlanejado = 0;
                      let totalRefugo = 0;
                      let totalRealizadoForQuality = 0;
                      days.forEach(d => {
                        const k = formatDateKey(d);
                        const r = parseFloat(String(getCellValue(section.section_key, realizadoSubject, k) || 0)) || 0;
                        const p = parseFloat(String(getCellValue(section.section_key, planejadoSubject, k) || 0)) || 0;
                        totalRealizado += r;
                        totalPlanejado += p;
                        if (refugoSubject) {
                          const ref = parseFloat(String(getCellValue(section.section_key, refugoSubject, k) || 0)) || 0;
                          totalRefugo += ref;
                          totalRealizadoForQuality += r;
                        }
                      });
                      const totalPct = totalPlanejado > 0 ? (totalRealizado / totalPlanejado) * 100 : 0;
                      const totalColor = totalPlanejado > 0 ? getAdherenceColor(totalPct) : { bg: '', text: 'text-gray-400' };

                      return (
                        <>
                          <tr className="font-semibold">
                            <td className="sticky left-0 bg-gray-200 border-b border-r border-gray-300 px-3 py-2 text-gray-700 font-semibold z-10" style={{ minWidth: LABEL_W }}>
                              Aderencia Performance
                            </td>
                            {days.map(d => {
                              const key = formatDateKey(d);
                              const isHol = holidays.has(key);
                              const isWknd = isWeekend(d);
                              const realizado = parseFloat(String(getCellValue(section.section_key, realizadoSubject, key) || 0)) || 0;
                              const planejado = parseFloat(String(getCellValue(section.section_key, planejadoSubject, key) || 0)) || 0;
                              const pct = planejado > 0 ? (realizado / planejado) * 100 : 0;
                              const color = planejado > 0 ? getAdherenceColor(pct) : { bg: isHol ? 'bg-red-50' : isWknd ? 'bg-gray-50' : '', text: 'text-gray-400' };
                              return (
                                <td key={key} className={`border-b border-r border-gray-200 text-center py-2 px-0 ${color.bg} ${color.text}`} style={{ minWidth: COL_W, width: COL_W, maxWidth: COL_W }}>
                                  {planejado > 0 ? `${pct.toFixed(0)}%` : '-'}
                                </td>
                              );
                            })}
                            <td className={`border-b border-gray-200 text-center py-2 font-bold ${totalColor.bg} ${totalColor.text}`} style={{ minWidth: COL_W }}>
                              {totalPlanejado > 0 ? `${totalPct.toFixed(1)}%` : '-'}
                            </td>
                          </tr>
                          {section.show_quality_adherence && refugoSubject && realizadoSubject && (() => {
                            const totalQualityPct = totalRealizadoForQuality > 0 ? (totalRefugo / totalRealizadoForQuality) * 100 : 0;
                            return (
                              <tr className="font-semibold">
                                <td className="sticky left-0 bg-blue-100 border-b border-r border-blue-200 px-3 py-2 text-blue-800 font-semibold z-10" style={{ minWidth: LABEL_W }}>
                                  Aderencia Qualidade
                                </td>
                                {days.map(d => {
                                  const key = formatDateKey(d);
                                  const realizado = parseFloat(String(getCellValue(section.section_key, realizadoSubject, key) || 0)) || 0;
                                  const refugo = parseFloat(String(getCellValue(section.section_key, refugoSubject, key) || 0)) || 0;
                                  const pct = realizado > 0 ? (refugo / realizado) * 100 : 0;
                                  return (
                                    <td key={key} className="border-b border-r border-blue-200 text-center py-2 px-0 bg-blue-50 text-blue-800" style={{ minWidth: COL_W, width: COL_W, maxWidth: COL_W }}>
                                      {realizado > 0 ? `${pct.toFixed(0)}%` : '-'}
                                    </td>
                                  );
                                })}
                                <td className="border-b border-blue-200 text-center py-2 font-bold bg-blue-100 text-blue-800" style={{ minWidth: COL_W }}>
                                  {totalRealizadoForQuality > 0 ? `${totalQualityPct.toFixed(1)}%` : '-'}
                                </td>
                              </tr>
                            );
                          })()}
                        </>
                      );
                    }

                    return (
                      <tr className="bg-gray-50 font-semibold">
                        <td className="sticky left-0 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 text-gray-600 z-10" style={{ minWidth: LABEL_W }}>
                          Total do Dia
                        </td>
                        {days.map(d => {
                          const key = formatDateKey(d);
                          const total = getDayTotal(section, key);
                          return (
                            <td key={key} className="border-b border-r border-gray-200 text-center py-2 text-gray-700" style={{ minWidth: COL_W, width: COL_W }}>
                              {total > 0 ? total.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '-'}
                            </td>
                          );
                        })}
                        <td className="border-b border-gray-200 text-center py-2 text-blue-800 bg-blue-100 font-bold">
                          {rows.reduce((sum, rowLabel) => {
                            const subject = section.has_subject ? rowLabel : null;
                            return sum + getMonthTotal(section, subject);
                          }, 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
