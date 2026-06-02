import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Save, X, Building, Briefcase, Circle, GitBranch, Wrench, MapPin, Clock, Calendar, Building2, Tag, Target, Users, Layers, Truck } from 'lucide-react';
import { dataTypeService } from '../services/dataTypeService';
import { locationService, LocationType } from '../services/locationService';
import { supabase } from '../lib/supabase';
import type { DataType, Location } from '../types/database';
import CompanyLogoManager from './CompanyLogoManager';
import ProductivityCategoryManagement from './ProductivityCategoryManagement';
import GoalsProductivityManagement from './GoalsProductivityManagement';
import { TeamManagement } from './TeamManagement';
import { MaintenanceCadastro } from './maintenance/MaintenanceCadastro';
import PerformanceAdherenceManagement from './PerformanceAdherenceManagement';
import { SuppliersManagement } from './SuppliersManagement';

type TabType = 'branches' | 'workplaces' | 'divisions' | 'functions' | 'status' | 'shift_times' | 'day_options' | 'productivity_categories' | 'goals_productivity' | 'company_logo' | 'teams' | 'maintenance_cadastro' | 'performance_adherence' | 'suppliers';

type DivisionSubTab = 'areas' | 'departments' | 'sectors' | 'positions';

interface Tab {
  id: TabType;
  label: string;
  singular: string;
  icon: typeof Building;
  typeCode: number;
  useLocations?: boolean;
  locationType?: number;
  useCustomTable?: string;
}

interface ShiftTime {
  id: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
  start_time_2: string | null;
  end_time_2: string | null;
  status: number;
  works_sunday?: boolean;
  works_monday?: boolean;
  works_tuesday?: boolean;
  works_wednesday?: boolean;
  works_thursday?: boolean;
  works_friday?: boolean;
  works_saturday?: boolean;
}

interface DayOption {
  id: string;
  name: string;
  color: string;
  status: number;
}

type ItemType = DataType | Location | ShiftTime | DayOption;

export function DataManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('branches');
  const [divisionSubTab, setDivisionSubTab] = useState<DivisionSubTab>('areas');
  const [items, setItems] = useState<ItemType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    short_description: '',
    legal_name: '',
    trade_name: '',
    status: 0,
    name: '',
    start_time: '',
    end_time: '',
    start_time_2: '',
    end_time_2: '',
    color: '#FFFF00',
    works_sunday: false,
    works_monday: false,
    works_tuesday: false,
    works_wednesday: false,
    works_thursday: false,
    works_friday: false,
    works_saturday: false
  });

  const tabs: Tab[] = [
    { id: 'branches', label: 'Filiais', singular: 'Filial', icon: GitBranch, typeCode: 0, useLocations: true, locationType: LocationType.BRANCH },
    { id: 'workplaces', label: 'Locais', singular: 'Local', icon: MapPin, typeCode: 0, useLocations: true, locationType: LocationType.WORKPLACE },
    { id: 'divisions', label: 'Divisões', singular: 'Divisão', icon: Layers, typeCode: 0, useCustomTable: 'divisions' },
    { id: 'functions', label: 'Funções', singular: 'Função', icon: Wrench, typeCode: 1 },
    { id: 'teams', label: 'Equipes', singular: 'Equipe', icon: Users, typeCode: 0, useCustomTable: 'teams' },
    { id: 'status', label: 'Status', singular: 'Status', icon: Circle, typeCode: 6 },
    { id: 'shift_times', label: 'Horarios de Turno', singular: 'Horario', icon: Clock, typeCode: 0, useCustomTable: 'shift_times' },
    { id: 'day_options', label: 'Opcoes de Dia', singular: 'Opcao', icon: Calendar, typeCode: 0, useCustomTable: 'day_options' },
    { id: 'productivity_categories', label: 'Categorias Produtividade', singular: 'Categoria', icon: Tag, typeCode: 0, useCustomTable: 'productivity_categories' },
    { id: 'goals_productivity', label: 'Metas Produtividade', singular: 'Meta', icon: Target, typeCode: 0, useCustomTable: 'goals_productivity' },
    { id: 'company_logo', label: 'Logo da Empresa', singular: 'Logo', icon: Building2, typeCode: 0, useCustomTable: 'company_logo' },
    { id: 'maintenance_cadastro', label: 'Manutencao Fabrica', singular: 'Manutencao', icon: Wrench, typeCode: 0, useCustomTable: 'maintenance_cadastro' },
    { id: 'performance_adherence', label: 'Performance Aderencia', singular: 'Perfil', icon: Target, typeCode: 0, useCustomTable: 'performance_adherence' },
    { id: 'suppliers', label: 'Fornecedores', singular: 'Fornecedor', icon: Truck, typeCode: 0, useCustomTable: 'suppliers' },
  ];

  const currentTab = tabs.find(t => t.id === activeTab)!;
  const isLocationTab = currentTab.useLocations;
  const currentLocationType = currentTab.locationType;
  const isWorkplaceTab = activeTab === 'workplaces';
  const isCustomTable = !!currentTab.useCustomTable;
  const isShiftTimesTab = activeTab === 'shift_times';
  const isDayOptionsTab = activeTab === 'day_options';
  const isDivisionsTab = activeTab === 'divisions';

  const divisionTypeCodeMap: Record<DivisionSubTab, number> = {
    areas: 7,
    departments: 2,
    sectors: 8,
    positions: 3
  };

  const divisionSubTabLabels: Record<DivisionSubTab, { label: string; singular: string }> = {
    areas: { label: 'Áreas', singular: 'Área' },
    departments: { label: 'Departamentos', singular: 'Departamento' },
    sectors: { label: 'Setores', singular: 'Setor' },
    positions: { label: 'Cargos', singular: 'Cargo' }
  };

  const getEffectiveTypeCode = () => {
    if (isDivisionsTab) {
      return divisionTypeCodeMap[divisionSubTab];
    }
    return currentTab.typeCode;
  };

  const getColumnLabels = () => {
    if (isShiftTimesTab) {
      return { primary: 'Nome do Horario', secondary: 'Periodo' };
    }
    if (isDayOptionsTab) {
      return { primary: 'Nome da Opcao', secondary: 'Cor' };
    }
    if (isWorkplaceTab) {
      return { primary: 'Local de Trabalho', secondary: 'Apelido' };
    }
    if (isLocationTab) {
      return { primary: 'Nome Fantasia', secondary: 'Razao Social' };
    }
    return { primary: 'Descricao', secondary: 'Descricao Curta' };
  };

  const columnLabels = getColumnLabels();

  useEffect(() => {
    loadItems();
  }, [activeTab, divisionSubTab]);

  async function loadItems() {
    if (isDivisionsTab) {
      setIsLoading(true);
      try {
        const data = await dataTypeService.getByType(divisionTypeCodeMap[divisionSubTab]);
        setItems(data);
      } catch (error) {
        console.error('Error loading items:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(true);
    try {
      if (isCustomTable && currentTab.useCustomTable) {
        const { data, error } = await supabase
          .from(currentTab.useCustomTable)
          .select('*')
          .order('name');
        if (error) throw error;
        setItems(data || []);
      } else if (isLocationTab && currentLocationType !== undefined) {
        const data = await locationService.getByTypeIncludingInactive(currentLocationType);
        setItems(data);
      } else {
        const data = await dataTypeService.getByType(currentTab.typeCode);
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function isLocation(item: ItemType): item is Location {
    return 'legal_name' in item;
  }

  function isShiftTime(item: ItemType): item is ShiftTime {
    return 'start_time' in item && 'end_time' in item;
  }

  function isDayOption(item: ItemType): item is DayOption {
    return 'color' in item && !('start_time' in item);
  }

  function getItemName(item: ItemType): string {
    if (isShiftTime(item) || isDayOption(item)) {
      return item.name;
    }
    if (isLocation(item)) {
      return item.trade_name || item.legal_name;
    }
    return (item as DataType).description;
  }

  function getItemShortName(item: ItemType): string {
    if (isShiftTime(item)) {
      const parts = [];
      if (item.start_time && item.end_time) {
        parts.push(`${item.start_time.substring(0, 5)} - ${item.end_time.substring(0, 5)}`);
      }
      if (item.start_time_2 && item.end_time_2) {
        parts.push(`${item.start_time_2.substring(0, 5)} - ${item.end_time_2.substring(0, 5)}`);
      }
      return parts.length > 0 ? parts.join(' | ') : '-';
    }
    if (isDayOption(item)) {
      return item.color;
    }
    if (isLocation(item)) {
      return item.legal_name;
    }
    return (item as DataType).short_description || '-';
  }

  function getWeekdaysShort(item: ShiftTime): string {
    const days = [];
    if (item.works_sunday) days.push('Dom');
    if (item.works_monday) days.push('Seg');
    if (item.works_tuesday) days.push('Ter');
    if (item.works_wednesday) days.push('Qua');
    if (item.works_thursday) days.push('Qui');
    if (item.works_friday) days.push('Sex');
    if (item.works_saturday) days.push('Sab');
    return days.length > 0 ? days.join(', ') : 'Nenhum dia';
  }

  function handleEdit(item: ItemType) {
    setEditingId(item.id);
    if (isShiftTime(item)) {
      setFormData({
        description: '',
        short_description: '',
        legal_name: '',
        trade_name: '',
        status: item.status,
        name: item.name,
        start_time: item.start_time || '',
        end_time: item.end_time || '',
        start_time_2: item.start_time_2 || '',
        end_time_2: item.end_time_2 || '',
        color: '#FFFF00',
        works_sunday: item.works_sunday || false,
        works_monday: item.works_monday || false,
        works_tuesday: item.works_tuesday || false,
        works_wednesday: item.works_wednesday || false,
        works_thursday: item.works_thursday || false,
        works_friday: item.works_friday || false,
        works_saturday: item.works_saturday || false
      });
    } else if (isDayOption(item)) {
      setFormData({
        description: '',
        short_description: '',
        legal_name: '',
        trade_name: '',
        status: item.status,
        name: item.name,
        start_time: '',
        end_time: '',
        color: item.color || '#FFFF00',
        works_sunday: false,
        works_monday: false,
        works_tuesday: false,
        works_wednesday: false,
        works_thursday: false,
        works_friday: false,
        works_saturday: false
      });
    } else if (isLocation(item)) {
      setFormData({
        description: '',
        short_description: '',
        legal_name: item.legal_name,
        trade_name: item.trade_name || '',
        status: item.status,
        name: '',
        start_time: '',
        end_time: '',
        start_time_2: '',
        end_time_2: '',
        color: '#FFFF00',
        works_sunday: false,
        works_monday: false,
        works_tuesday: false,
        works_wednesday: false,
        works_thursday: false,
        works_friday: false,
        works_saturday: false
      });
    } else {
      const dataItem = item as DataType;
      setFormData({
        description: dataItem.description,
        short_description: dataItem.short_description || '',
        legal_name: '',
        trade_name: '',
        status: dataItem.status,
        name: '',
        start_time: '',
        end_time: '',
        start_time_2: '',
        end_time_2: '',
        color: '#FFFF00',
        works_sunday: false,
        works_monday: false,
        works_tuesday: false,
        works_wednesday: false,
        works_thursday: false,
        works_friday: false,
        works_saturday: false
      });
    }
    setShowAddForm(false);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      description: '',
      short_description: '',
      legal_name: '',
      trade_name: '',
      status: 0,
      name: '',
      start_time: '',
      end_time: '',
      color: '#FFFF00',
      works_sunday: false,
      works_monday: false,
      works_tuesday: false,
      works_wednesday: false,
      works_thursday: false,
      works_friday: false,
      works_saturday: false
    });
  }

  async function handleSave(id?: string) {
    if (isShiftTimesTab || isDayOptionsTab) {
      if (!formData.name.trim()) {
        alert('Por favor, preencha o nome');
        return;
      }

      const nameToCheck = formData.name.trim().toLowerCase();
      const duplicate = items.find(item => {
        if (isShiftTime(item) || isDayOption(item)) {
          return item.name.toLowerCase() === nameToCheck && item.id !== id;
        }
        return false;
      });

      if (duplicate) {
        alert('Ja existe um registro com este nome. Por favor, escolha um nome diferente.');
        return;
      }
    } else if (isLocationTab) {
      if (!formData.trade_name.trim()) {
        alert(isWorkplaceTab ? 'Por favor, preencha o local de trabalho' : 'Por favor, preencha o nome fantasia');
        return;
      }

      const nameToCheck = formData.trade_name.trim().toLowerCase();
      const duplicate = items.find(item => {
        if (isLocation(item)) {
          const itemName = (item.trade_name || item.legal_name).toLowerCase();
          return itemName === nameToCheck && item.id !== id;
        }
        return false;
      });

      if (duplicate) {
        alert('Ja existe um registro com este nome. Por favor, escolha um nome diferente.');
        return;
      }
    } else {
      if (!formData.description.trim()) {
        alert('Por favor, preencha a descricao');
        return;
      }

      const descToCheck = formData.description.trim().toLowerCase();
      const duplicate = items.find(item => {
        if (!isLocation(item) && !isShiftTime(item) && !isDayOption(item)) {
          return (item as DataType).description.toLowerCase() === descToCheck && item.id !== id;
        }
        return false;
      });

      if (duplicate) {
        alert('Ja existe um registro com esta descricao. Por favor, escolha uma descricao diferente.');
        return;
      }
    }

    try {
      if (isShiftTimesTab) {
        const shiftData = {
          name: formData.name,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          start_time_2: formData.start_time_2 || null,
          end_time_2: formData.end_time_2 || null,
          status: formData.status,
          works_sunday: formData.works_sunday,
          works_monday: formData.works_monday,
          works_tuesday: formData.works_tuesday,
          works_wednesday: formData.works_wednesday,
          works_thursday: formData.works_thursday,
          works_friday: formData.works_friday,
          works_saturday: formData.works_saturday
        };
        if (id) {
          const { error } = await supabase.from('shift_times').update(shiftData).eq('id', id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('shift_times').insert(shiftData);
          if (error) throw error;
        }
      } else if (isDayOptionsTab) {
        const dayOptionData = {
          name: formData.name,
          color: formData.color,
          status: formData.status
        };
        if (id) {
          const { error } = await supabase.from('day_options').update(dayOptionData).eq('id', id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('day_options').insert(dayOptionData);
          if (error) throw error;
        }
      } else if (isLocationTab && currentLocationType !== undefined) {
        const locationData = {
          legal_name: formData.legal_name || formData.trade_name,
          trade_name: formData.trade_name || null,
          status: formData.status
        };
        if (id) {
          await locationService.update(id, locationData);
        } else {
          await locationService.create({
            ...locationData,
            type: currentLocationType
          });
        }
      } else {
        if (id) {
          await dataTypeService.update(id, {
            description: formData.description,
            short_description: formData.short_description || null,
            status: formData.status
          });
        } else {
          await dataTypeService.create({
            description: formData.description,
            short_description: formData.short_description || null,
            status: formData.status,
            type: getEffectiveTypeCode()
          });
        }
      }
      await loadItems();
      handleCancelEdit();
    } catch (error: any) {
      console.error('Error saving:', error);
      if (error?.message?.includes('unique') || error?.code === '23505') {
        alert('Ja existe um registro com este nome. Por favor, escolha um nome diferente.');
      } else {
        alert('Erro ao salvar. Tente novamente.');
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      if (isDivisionsTab) {
        await dataTypeService.delete(id);
      } else if (isCustomTable && currentTab.useCustomTable) {
        const { error } = await supabase.from(currentTab.useCustomTable).delete().eq('id', id);
        if (error) throw error;
      } else if (isLocationTab) {
        await locationService.delete(id);
      } else {
        await dataTypeService.delete(id);
      }
      await loadItems();
    } catch (error: any) {
      console.error('Error deleting:', error);

      if (error?.code === '23503' || error?.message?.includes('foreign key')) {
        let detailMessage = 'Este item está sendo usado e não pode ser excluído.\n\n';

        try {
          if (isShiftTimesTab) {
            const { data: employees } = await supabase
              .from('employees')
              .select('name')
              .eq('shift_id', id);

            if (employees && employees.length > 0) {
              detailMessage += `Funcionários usando este turno:\n`;
              detailMessage += employees.map(emp => `- ${emp.name}`).join('\n');
              detailMessage += `\n\nRemova ou altere o turno destes funcionários antes de excluir.`;
            }
          } else if (currentTab.id === 'divisions') {
            const { data: employees } = await supabase
              .from('employees')
              .select('name')
              .eq('department_id', id);

            if (employees && employees.length > 0) {
              detailMessage += `Funcionários nesta divisão:\n`;
              detailMessage += employees.map(emp => `- ${emp.name}`).join('\n');
            }
          } else if (isDivisionsTab && divisionSubTab === 'positions') {
            const { data: employees } = await supabase
              .from('employees')
              .select('name')
              .eq('position_id', id);

            if (employees && employees.length > 0) {
              detailMessage += `Funcionários com este cargo:\n`;
              detailMessage += employees.map(emp => `- ${emp.name}`).join('\n');
            }
          } else if (currentTab.id === 'workplaces') {
            const { data: employees } = await supabase
              .from('employees')
              .select('name')
              .eq('workplace_id', id);

            if (employees && employees.length > 0) {
              detailMessage += `Funcionários neste local:\n`;
              detailMessage += employees.map(emp => `- ${emp.name}`).join('\n');
            }
          } else if (currentTab.id === 'branches') {
            const { data: employees } = await supabase
              .from('employees')
              .select('name')
              .eq('branch_id', id);

            if (employees && employees.length > 0) {
              detailMessage += `Funcionários nesta filial:\n`;
              detailMessage += employees.map(emp => `- ${emp.name}`).join('\n');
            }
          } else if (currentTab.id === 'teams') {
            const { data: employees } = await supabase
              .from('employees')
              .select('name')
              .eq('team_id', id);

            if (employees && employees.length > 0) {
              detailMessage += `Funcionários nesta equipe:\n`;
              detailMessage += employees.map(emp => `- ${emp.name}`).join('\n');
            }
          }
        } catch (checkError) {
          console.error('Error checking usage:', checkError);
        }

        alert(detailMessage);
      } else {
        alert('Erro ao excluir. Tente novamente.');
      }
    }
  }

  async function handleToggleStatus(id: string, currentStatus: number) {
    try {
      const newStatus = currentStatus === 0 ? 1 : 0;
      if (isDivisionsTab) {
        await dataTypeService.update(id, { status: newStatus });
      } else if (isCustomTable && currentTab.useCustomTable) {
        const { error } = await supabase.from(currentTab.useCustomTable).update({ status: newStatus }).eq('id', id);
        if (error) throw error;
      } else if (isLocationTab) {
        await locationService.update(id, { status: newStatus });
      } else {
        await dataTypeService.update(id, { status: newStatus });
      }
      await loadItems();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status.');
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Cadastros do Sistema</h2>
        <p className="text-gray-600">Gerencie as estruturas basicas do sistema</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    handleCancelEdit();
                  }}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'teams' ? (
            <TeamManagement />
          ) : activeTab === 'company_logo' ? (
            <CompanyLogoManager />
          ) : activeTab === 'productivity_categories' ? (
            <ProductivityCategoryManagement />
          ) : activeTab === 'goals_productivity' ? (
            <GoalsProductivityManagement />
          ) : activeTab === 'maintenance_cadastro' ? (
            <MaintenanceCadastro />
          ) : activeTab === 'performance_adherence' ? (
            <PerformanceAdherenceManagement />
          ) : activeTab === 'suppliers' ? (
            <SuppliersManagement />
          ) : (
            <>
              {isDivisionsTab && (
                <div className="mb-6 border-b border-gray-200">
                  <nav className="flex gap-1">
                    {(['areas', 'departments', 'sectors', 'positions'] as DivisionSubTab[]).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => {
                          setDivisionSubTab(sub);
                          handleCancelEdit();
                        }}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                          divisionSubTab === sub
                            ? 'bg-blue-50 text-blue-700 border border-b-0 border-gray-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {divisionSubTabLabels[sub].label}
                      </button>
                    ))}
                  </nav>
                </div>
              )}

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  {isDivisionsTab ? divisionSubTabLabels[divisionSubTab].label : currentTab.label}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingId(null);
                    setFormData({
                      description: '',
                      short_description: '',
                      legal_name: '',
                      trade_name: '',
                      status: 0,
                      name: '',
                      start_time: '',
                      end_time: '',
                      color: '#FFFF00',
                      works_sunday: false,
                      works_monday: false,
                      works_tuesday: false,
                      works_wednesday: false,
                      works_thursday: false,
                      works_friday: false,
                      works_saturday: false
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar {isDivisionsTab ? divisionSubTabLabels[divisionSubTab].singular : currentTab.singular}
                </button>
              </div>

          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-4">
                {isDivisionsTab ? `Nova ${divisionSubTabLabels[divisionSubTab].singular}` : `Nova ${currentTab.singular}`}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {isShiftTimesTab ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome do Horario *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: 08h às 17h"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hora Inicio
                        </label>
                        <input
                          type="time"
                          value={formData.start_time}
                          onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hora Fim
                        </label>
                        <input
                          type="time"
                          value={formData.end_time}
                          onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hora Inicio 2
                        </label>
                        <input
                          type="time"
                          value={formData.start_time_2}
                          onChange={(e) => setFormData({ ...formData, start_time_2: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hora Fim 2
                        </label>
                        <input
                          type="time"
                          value={formData.end_time_2}
                          onChange={(e) => setFormData({ ...formData, end_time_2: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Dias da Semana
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.works_sunday}
                            onChange={(e) => setFormData({ ...formData, works_sunday: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Domingo</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.works_monday}
                            onChange={(e) => setFormData({ ...formData, works_monday: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Segunda</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.works_tuesday}
                            onChange={(e) => setFormData({ ...formData, works_tuesday: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Terça</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.works_wednesday}
                            onChange={(e) => setFormData({ ...formData, works_wednesday: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Quarta</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.works_thursday}
                            onChange={(e) => setFormData({ ...formData, works_thursday: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Quinta</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.works_friday}
                            onChange={(e) => setFormData({ ...formData, works_friday: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Sexta</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.works_saturday}
                            onChange={(e) => setFormData({ ...formData, works_saturday: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Sábado</span>
                        </label>
                      </div>
                    </div>
                  </>
                ) : isDayOptionsTab ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Opcao *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: FOLGA, DOMINGO, BH"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cor de Destaque
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-14 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="#FFFF00"
                        />
                      </div>
                    </div>
                  </>
                ) : isLocationTab ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {columnLabels.primary} *
                      </label>
                      <input
                        type="text"
                        value={formData.trade_name}
                        onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={isWorkplaceTab ? "Ex: Escritorio Centro" : "Ex: ABC Filial Centro"}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {columnLabels.secondary}
                      </label>
                      <input
                        type="text"
                        value={formData.legal_name}
                        onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={isWorkplaceTab ? "Ex: Centro" : "Ex: Empresa ABC LTDA"}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descricao *
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Administracao"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descricao Curta
                      </label>
                      <input
                        type="text"
                        value={formData.short_description}
                        onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Admin"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancelar
                </button>
                <button
                  onClick={() => handleSave()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  Salvar
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Carregando...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhum item cadastrado ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {columnLabels.primary}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {columnLabels.secondary}
                    </th>
                    {isShiftTimesTab && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dias da Semana
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={isShiftTimesTab || isDayOptionsTab ? formData.name : (isLocationTab ? formData.trade_name : formData.description)}
                            onChange={(e) => setFormData({
                              ...formData,
                              [isShiftTimesTab || isDayOptionsTab ? 'name' : (isLocationTab ? 'trade_name' : 'description')]: e.target.value
                            })}
                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900">{getItemName(item)}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {editingId === item.id ? (
                          isShiftTimesTab ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <input
                                  type="time"
                                  value={formData.start_time}
                                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                  className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  placeholder="Início 1"
                                />
                                <input
                                  type="time"
                                  value={formData.end_time}
                                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                  className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  placeholder="Fim 1"
                                />
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="time"
                                  value={formData.start_time_2}
                                  onChange={(e) => setFormData({ ...formData, start_time_2: e.target.value })}
                                  className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  placeholder="Início 2"
                                />
                                <input
                                  type="time"
                                  value={formData.end_time_2}
                                  onChange={(e) => setFormData({ ...formData, end_time_2: e.target.value })}
                                  className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  placeholder="Fim 2"
                                />
                              </div>
                            </div>
                          ) : isDayOptionsTab ? (
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={isLocationTab ? formData.legal_name : formData.short_description}
                              onChange={(e) => setFormData({
                                ...formData,
                                [isLocationTab ? 'legal_name' : 'short_description']: e.target.value
                              })}
                              className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          )
                        ) : (
                          isDayOptionsTab && isDayOption(item) ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-gray-300"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-gray-600">{item.color}</span>
                            </div>
                          ) : isShiftTimesTab && isShiftTime(item) ? (
                            <div className="text-gray-600 text-sm">
                              {item.start_time && item.end_time && (
                                <div>{item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}</div>
                              )}
                              {item.start_time_2 && item.end_time_2 && (
                                <div>{item.start_time_2.substring(0, 5)} - {item.end_time_2.substring(0, 5)}</div>
                              )}
                              {!item.start_time && !item.end_time && !item.start_time_2 && !item.end_time_2 && '-'}
                            </div>
                          ) : (
                            <span className="text-gray-600">{getItemShortName(item)}</span>
                          )
                        )}
                      </td>
                      {isShiftTimesTab && (
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-600">
                            {isShiftTime(item) ? getWeekdaysShort(item) : '-'}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-4">
                        {editingId === item.id ? (
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                            className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={0}>Ativo</option>
                            <option value={1}>Inativo</option>
                          </select>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(item.id, item.status)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.status === 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.status === 0 ? 'Ativo' : 'Inativo'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {editingId === item.id ? (
                            <>
                              <button
                                onClick={() => handleSave(item.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Salvar"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

              {!isLoading && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                  <span className="text-sm text-gray-500 font-medium">
                    Total: {items.length} {items.length === 1 ? 'item' : 'itens'} cadastrado{items.length === 1 ? '' : 's'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
