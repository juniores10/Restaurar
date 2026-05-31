import React, { useState, useEffect, useRef } from 'react';
import { employeeService, type EmployeeWithRelations } from '../services/employeeService';
import { dataTypeService } from '../services/dataTypeService';
import { locationService } from '../services/locationService';
import { userTypeService } from '../services/userTypeService';
import { teamService, type Team } from '../services/teamService';
import type { DataType, Location, UserType } from '../types/database';
import { EmployeeStatus } from '../types/database';
import { UserPlus, CreditCard as Edit2, Trash2, Search, User, Briefcase, Users as UsersIcon, Shield, Building2, Eye, EyeOff, Lock, Calendar, Umbrella, Coffee, Camera, X, MapPin, FileText, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ShiftTime {
  id: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
  status: number;
}

export function EmployeeManagement() {
  const { selectedBranch } = useAuth();
  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [workplaces, setWorkplaces] = useState<Location[]>([]);
  const [departments, setDepartments] = useState<DataType[]>([]);
  const [sectors, setSectors] = useState<DataType[]>([]);
  const [areas, setAreas] = useState<DataType[]>([]);
  const [positions, setPositions] = useState<DataType[]>([]);
  const [roles, setRoles] = useState<DataType[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [shiftTimes, setShiftTimes] = useState<ShiftTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<number | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'employees' | 'admins' | 'terceirizados'>('employees');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithRelations | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    cpf: '',
    rg: '',
    ctps: '',
    password: '',
    birth_date: '',
    location_id: '',
    workplace_id: '',
    department_id: '',
    sector_id: '',
    position_id: '',
    role_id: '',
    team_id: '',
    shift_id: '',
    shift_id_2: '',
    status: 0,
    phone: '',
    phone2: '',
    address: '',
    user_type_id: 3,
    registration_number: '',
    hire_date: '',
    next_vacation_start: '',
    next_vacation_end: '',
    next_dayoff_date: '',
    dayoff_frequency_days: 7,
    supervisor_id: '',
    area: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [rgDocumentFile, setRgDocumentFile] = useState<File | null>(null);
  const [rgDocumentPreview, setRgDocumentPreview] = useState<string | null>(null);

  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const { data: shiftsData } = await supabase
        .from('shift_times')
        .select('*')
        .eq('status', 0)
        .order('name');

      const [emp, loc, wpl, dept, pos, rol, types, tms] = await Promise.all([
        employeeService.getAll(),
        locationService.getBranches(),
        locationService.getWorkplaces(),
        dataTypeService.getDepartments(),
        dataTypeService.getPositions(),
        dataTypeService.getRoles(),
        userTypeService.getAll(),
        teamService.getActive().catch(() => [] as Team[])
      ]);

      const { data: sectorsData } = await supabase
        .from('data_types')
        .select('*')
        .eq('type', 7)
        .eq('status', 0)
        .order('description');

      const { data: areasData } = await supabase
        .from('data_types')
        .select('*')
        .eq('type', 8)
        .eq('status', 0)
        .order('description');

      setEmployees(emp);
      setLocations(loc);
      setWorkplaces(wpl);
      setDepartments(dept);
      setSectors(sectorsData || []);
      setAreas(areasData || []);
      setPositions(pos);
      setRoles(rol);
      setUserTypes(types);
      setTeams(tms);
      setShiftTimes(shiftsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    if (selectedBranch && emp.location_id !== selectedBranch.id) return false;

    const isAdminOrLider = emp.user_type_id === 1 || emp.user_type_id === 5;
    const isTerceirizado = emp.user_type_id === 4;
    let matchesTab = false;

    if (activeTab === 'admins') {
      matchesTab = isAdminOrLider;
    } else if (activeTab === 'terceirizados') {
      matchesTab = isTerceirizado;
    } else {
      matchesTab = !isAdminOrLider && !isTerceirizado;
    }

    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (emp.cpf && emp.cpf.includes(searchTerm));
    const matchesFilter = filterStatus === null || emp.status === filterStatus;
    const matchesDepartment = !filterDepartment || emp.department_id === filterDepartment;
    const matchesLocation = !filterLocation || emp.location_id === filterLocation;
    return matchesTab && matchesSearch && matchesFilter && matchesDepartment && matchesLocation;
  });

  const employeesOnly = employees.filter(emp => {
    if (selectedBranch && emp.location_id !== selectedBranch.id) return false;
    return emp.user_type_id !== 1 && emp.user_type_id !== 5;
  });

  const getStatusLabel = (status: number) => {
    switch (status) {
      case EmployeeStatus.ACTIVE: return 'Ativo';
      case EmployeeStatus.VACATION: return 'Férias';
      case EmployeeStatus.SUSPENDED: return 'Suspenso';
      case EmployeeStatus.AWAY: return 'Afastado';
      case EmployeeStatus.TERMINATED: return 'Desligado';
      default: return 'Desconhecido';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case EmployeeStatus.ACTIVE: return 'bg-green-100 text-green-800';
      case EmployeeStatus.VACATION: return 'bg-blue-100 text-blue-800';
      case EmployeeStatus.SUSPENDED: return 'bg-yellow-100 text-yellow-800';
      case EmployeeStatus.AWAY: return 'bg-orange-100 text-orange-800';
      case EmployeeStatus.TERMINATED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserTypeColor = (userTypeId: number | null) => {
    switch (userTypeId) {
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-amber-100 text-amber-800 border-amber-200';
      case 3: return 'bg-sky-100 text-sky-800 border-sky-200';
      case 4: return 'bg-purple-100 text-purple-800 border-purple-200';
      case 5: return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUserTypeIcon = (userTypeId: number | null) => {
    switch (userTypeId) {
      case 1: return 'text-red-600';
      case 2: return 'text-amber-600';
      case 3: return 'text-sky-600';
      case 4: return 'text-purple-600';
      case 5: return 'text-teal-600';
      default: return 'text-gray-600';
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleRgDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRgDocumentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRgDocumentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveRgDocument = () => {
    setRgDocumentFile(null);
    setRgDocumentPreview(null);
  };

  const handleEdit = (employee: EmployeeWithRelations) => {
    setSelectedEmployee(employee);
    setEditForm({
      name: employee.name,
      email: employee.email,
      cpf: employee.cpf,
      rg: (employee as any).rg || '',
      ctps: (employee as any).ctps || '',
      password: '',
      birth_date: employee.birth_date || '',
      location_id: employee.location_id || '',
      workplace_id: employee.workplace_id || '',
      department_id: employee.department_id || '',
      sector_id: (employee as any).sector_id || '',
      position_id: employee.position_id || '',
      role_id: employee.role_id || '',
      team_id: (employee as any).team_id || '',
      shift_id: (employee as any).shift_id || '',
      shift_id_2: (employee as any).shift_id_2 || '',
      status: employee.status,
      phone: employee.phone || '',
      phone2: (employee as any).phone2 || '',
      address: employee.address || '',
      user_type_id: employee.user_type_id || 3,
      registration_number: employee.registration_number || '',
      hire_date: (employee as Record<string, unknown>).hire_date as string || '',
      next_vacation_start: (employee as Record<string, unknown>).next_vacation_start as string || '',
      next_vacation_end: (employee as Record<string, unknown>).next_vacation_end as string || '',
      next_dayoff_date: (employee as Record<string, unknown>).next_dayoff_date as string || '',
      dayoff_frequency_days: ((employee as Record<string, unknown>).dayoff_frequency_days as number) || 7,
      supervisor_id: (employee as any).supervisor_id || '',
      area: (employee as any).area || '',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setRgDocumentFile(null);
    setRgDocumentPreview(null);
    setShowPassword(false);
    setShowEditModal(true);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setEditForm({
      name: '',
      email: '',
      cpf: '',
      rg: '',
      password: '',
      birth_date: '',
      location_id: '',
      workplace_id: '',
      department_id: '',
      sector_id: '',
      position_id: '',
      role_id: '',
      team_id: '',
      shift_id: '',
      shift_id_2: '',
      status: 0,
      phone: '',
      address: '',
      user_type_id: 3,
      registration_number: '',
      hire_date: '',
      next_vacation_start: '',
      next_vacation_end: '',
      next_dayoff_date: '',
      dayoff_frequency_days: 7,
      supervisor_id: '',
      area: '',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setRgDocumentFile(null);
    setRgDocumentPreview(null);
    setShowPassword(false);
    setShowAddModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;

    try {
      const updateData: Record<string, unknown> = {
        name: editForm.name,
        email: editForm.email,
        cpf: editForm.cpf,
        rg: editForm.rg || null,
        ctps: editForm.ctps || null,
        birth_date: editForm.birth_date || null,
        location_id: editForm.location_id || null,
        workplace_id: editForm.workplace_id || null,
        department_id: editForm.department_id || null,
        sector_id: editForm.sector_id || null,
        position_id: editForm.position_id || null,
        role_id: editForm.role_id || null,
        team_id: editForm.team_id || null,
        shift_id: editForm.shift_id || null,
        shift_id_2: editForm.shift_id_2 || null,
        status: editForm.status,
        is_active: editForm.status === 0,
        phone: editForm.phone || null,
        phone2: editForm.phone2 || null,
        address: editForm.address || null,
        user_type_id: editForm.user_type_id,
        registration_number: editForm.registration_number || selectedEmployee.registration_number,
        hire_date: editForm.hire_date || null,
        next_vacation_start: editForm.next_vacation_start || null,
        next_vacation_end: editForm.next_vacation_end || null,
        next_dayoff_date: editForm.next_dayoff_date || null,
        dayoff_frequency_days: editForm.dayoff_frequency_days || 7,
        supervisor_id: editForm.supervisor_id || null,
        area: editForm.area || null,
      };

      if (editForm.password.trim()) {
        updateData.password = editForm.password;
      }

      // Upload RG document if provided
      if (rgDocumentFile) {
        const fileExt = rgDocumentFile.name.split('.').pop();
        const fileName = `${selectedEmployee.id}_${Date.now()}.${fileExt}`;
        const filePath = `${selectedEmployee.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('employee-documents')
          .upload(filePath, rgDocumentFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        updateData.rg_document_url = filePath;
      }

      await employeeService.update(selectedEmployee.id, updateData);

      if (photoFile) {
        await employeeService.uploadPhoto(selectedEmployee.id, photoFile);
      }

      await loadData();
      setShowEditModal(false);
      setSelectedEmployee(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      setRgDocumentFile(null);
      setRgDocumentPreview(null);
    } catch (error) {
      console.error('Error updating employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao atualizar funcionario: ${errorMessage}`);
    }
  };

  const handleSaveAdd = async () => {
    if (!editForm.name || !editForm.email || !editForm.cpf || !editForm.password) {
      alert('Preencha todos os campos obrigatorios: Nome, E-mail, CPF e Senha');
      return;
    }

    try {
      const timestamp = Date.now().toString().slice(-6);
      const createData: Record<string, unknown> = {
        name: editForm.name,
        email: editForm.email,
        cpf: editForm.cpf,
        rg: editForm.rg || null,
        ctps: editForm.ctps || null,
        password: editForm.password,
        birth_date: editForm.birth_date || null,
        location_id: editForm.location_id || null,
        workplace_id: editForm.workplace_id || null,
        department_id: editForm.department_id || null,
        sector_id: editForm.sector_id || null,
        position_id: editForm.position_id || null,
        role_id: editForm.role_id || null,
        team_id: editForm.team_id || null,
        shift_id: editForm.shift_id || null,
        shift_id_2: editForm.shift_id_2 || null,
        status: editForm.status,
        is_active: editForm.status === 0,
        phone: editForm.phone || null,
        phone2: editForm.phone2 || null,
        address: editForm.address || null,
        user_type_id: editForm.user_type_id,
        registration_number: editForm.registration_number || `EMP${timestamp}`,
        monthly_workload: 220,
        workload_sunday: 0,
        workload_monday: 8,
        workload_tuesday: 8,
        workload_wednesday: 8,
        workload_thursday: 8,
        workload_friday: 8,
        workload_saturday: 4,
        initial_balance: 0,
        signature_status: 0,
        hire_date: editForm.hire_date || null,
        next_vacation_start: editForm.next_vacation_start || null,
        next_vacation_end: editForm.next_vacation_end || null,
        next_dayoff_date: editForm.next_dayoff_date || null,
        dayoff_frequency_days: editForm.dayoff_frequency_days || 7,
        supervisor_id: editForm.supervisor_id || null,
        area: editForm.area || null,
      };

      const newEmployee = await employeeService.create(createData);

      if (photoFile && newEmployee.id) {
        await employeeService.uploadPhoto(newEmployee.id, photoFile);
      }

      // Upload RG document if provided
      if (rgDocumentFile && newEmployee.id) {
        const fileExt = rgDocumentFile.name.split('.').pop();
        const fileName = `${newEmployee.id}_${Date.now()}.${fileExt}`;
        const filePath = `${newEmployee.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('employee-documents')
          .upload(filePath, rgDocumentFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Update employee with document URL
        await employeeService.update(newEmployee.id, { rg_document_url: filePath });
      }

      await loadData();
      setShowAddModal(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      setRgDocumentFile(null);
      setRgDocumentPreview(null);
    } catch (error: unknown) {
      console.error('Error creating employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao cadastrar funcionario: ${errorMessage}`);
    }
  };

  const handleDelete = async (employee: EmployeeWithRelations) => {
    if (!confirm(`Deseja realmente excluir o funcionário ${employee.name}?`)) {
      return;
    }

    try {
      await employeeService.delete(employee.id);
      await loadData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Erro ao excluir funcionário');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <UsersIcon className="w-6 h-6" />
              Gerenciamento de Funcionários
            </h2>
            <p className="text-sm text-slate-600 mt-1">{filteredEmployees.length} funcionários encontrados</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-medium hover:from-slate-800 hover:to-slate-900 transition-all shadow-md hover:shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Novo
          </button>
        </div>

        <div className="flex gap-2 mb-6 border-b-2 border-slate-200">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'employees'
                ? 'text-slate-800 border-b-4 border-slate-800 -mb-0.5'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              Colaboradores
            </div>
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'admins'
                ? 'text-slate-800 border-b-4 border-slate-800 -mb-0.5'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Administradores
            </div>
          </button>
          <button
            onClick={() => setActiveTab('terceirizados')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'terceirizados'
                ? 'text-slate-800 border-b-4 border-slate-800 -mb-0.5'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Terceirizados
            </div>
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar funcionário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
            />
          </div>
          <select
            value={filterStatus ?? ''}
            onChange={(e) => setFilterStatus(e.target.value ? parseInt(e.target.value) : null)}
            className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white min-w-[150px]"
          >
            <option value="">Todos Status</option>
            <option value={EmployeeStatus.ACTIVE}>Ativo</option>
            <option value={EmployeeStatus.VACATION}>Férias</option>
            <option value={EmployeeStatus.SUSPENDED}>Suspenso</option>
            <option value={EmployeeStatus.AWAY}>Afastado</option>
            <option value={EmployeeStatus.TERMINATED}>Desligado</option>
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white min-w-[150px]"
          >
            <option value="">Todos Setores</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.description}
              </option>
            ))}
          </select>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white min-w-[150px]"
          >
            <option value="">Todas Filiais</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.trade_name || location.legal_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!loading && activeTab === 'employees' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border-2 border-slate-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total</span>
              <UsersIcon className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{employeesOnly.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Ativos</span>
              <User className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-800">
              {employeesOnly.filter(e => e.status === EmployeeStatus.ACTIVE).length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Férias</span>
              <Umbrella className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-800">
              {employeesOnly.filter(e => e.status === EmployeeStatus.VACATION).length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Afastados</span>
              <Coffee className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-800">
              {employeesOnly.filter(e => e.status === EmployeeStatus.AWAY).length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border-2 border-yellow-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Suspensos</span>
              <Lock className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-800">
              {employeesOnly.filter(e => e.status === EmployeeStatus.SUSPENDED).length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Desligados</span>
              <X className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-800">
              {employeesOnly.filter(e => e.status === EmployeeStatus.TERMINATED).length}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-slate-700"></div>
          <p className="text-slate-600 mt-4 font-medium">Carregando funcionários...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Nenhum funcionário encontrado</p>
        </div>
      ) : (
        <>
          <div
            ref={topScrollRef}
            className="overflow-x-auto overflow-y-hidden mb-4 border-b-2 border-slate-200"
            onScroll={(e) => {
              if (tableScrollRef.current) {
                tableScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
          >
            <div style={{ height: '8px', width: '1400px' }}></div>
          </div>
          <div
            ref={tableScrollRef}
            className="overflow-x-auto"
            onScroll={(e) => {
              if (topScrollRef.current) {
                topScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
          >
            <table className="w-full">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Funcionário
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Filial
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Setor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Tipo de Acesso
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  onClick={() => handleEdit(employee)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {employee.photo_url ? (
                        <img
                          src={employee.photo_url}
                          alt={employee.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-200">
                          {getInitials(employee.name)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-800">{employee.name}</p>
                        <p className="text-sm text-slate-500">{employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {employee.location ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200">
                        <Building2 className="w-3.5 h-3.5" />
                        {employee.location.trade_name || employee.location.legal_name}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Sem filial</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {employee.department ? (
                      <span className="text-sm text-slate-700">{employee.department.description}</span>
                    ) : (
                      <span className="text-sm text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {(employee as any).sector_id ? (
                      <span className="text-sm text-slate-700">
                        {sectors.find(s => s.id === (employee as any).sector_id)?.description || '-'}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {employee.position ? (
                      <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                        <Briefcase className="w-4 h-4" />
                        {employee.position.description}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${getUserTypeColor(employee.user_type_id)}`}>
                      <Shield className={`w-3.5 h-3.5 ${getUserTypeIcon(employee.user_type_id)}`} />
                      {employee.user_type?.name || 'Colaborador'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(employee.status)}`}>
                      {getStatusLabel(employee.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(employee);
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600 group-hover:text-blue-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(employee);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-slate-600 group-hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}

      {showEditModal && selectedEmployee && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
            setPhotoFile(null);
            setPhotoPreview(null);
            setRgDocumentFile(null);
            setRgDocumentPreview(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-800">Editar Funcionário</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Foto do Funcionário</label>
                <div className="relative group">
                  {photoPreview || selectedEmployee?.photo_url ? (
                    <div className="relative">
                      <img
                        src={photoPreview || selectedEmployee?.photo_url || ''}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover ring-4 ring-slate-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold text-3xl ring-4 ring-slate-200">
                      {getInitials(editForm.name || 'FU')}
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-40 rounded-full cursor-pointer transition-all group-hover:opacity-100 opacity-0">
                    <Camera className="w-8 h-8 text-white drop-shadow-lg" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-2">Clique na foto para alterar</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">CPF *</label>
                  <input
                    type="text"
                    value={editForm.cpf}
                    onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">RG</label>
                  <input
                    type="text"
                    value={editForm.rg}
                    onChange={(e) => setEditForm({ ...editForm, rg: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">CTPS</label>
                  <input
                    type="text"
                    value={editForm.ctps}
                    onChange={(e) => setEditForm({ ...editForm, ctps: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    placeholder="Ex: 1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Matrícula</label>
                  <input
                    type="text"
                    value={editForm.registration_number}
                    onChange={(e) => setEditForm({ ...editForm, registration_number: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    placeholder="Ex: EMP001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Senha de Acesso {!selectedEmployee && '*'}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder={selectedEmployee ? 'Deixe em branco para manter a atual' : 'Digite a senha'}
                      className="w-full px-4 py-2 pr-12 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                      required={!selectedEmployee}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {selectedEmployee && (
                    <p className="text-xs text-slate-500 mt-1">Deixe em branco para manter a senha atual</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Data de Nascimento</label>
                  <input
                    type="date"
                    value={editForm.birth_date}
                    onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documento RG/CPF
                    </span>
                  </label>
                  <div className="space-y-2">
                    {rgDocumentPreview ? (
                      <div className="relative">
                        {rgDocumentFile?.type.includes('pdf') ? (
                          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <FileText className="w-8 h-8 text-slate-600" />
                            <span className="text-sm text-slate-700">{rgDocumentFile.name}</span>
                          </div>
                        ) : (
                          <img
                            src={rgDocumentPreview}
                            alt="RG Preview"
                            className="w-full h-32 object-cover rounded-lg border-2 border-slate-200"
                          />
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveRgDocument}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          id="rgDocumentInput"
                          accept="image/*,application/pdf"
                          onChange={handleRgDocumentChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="rgDocumentInput"
                          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all"
                        >
                          <Upload className="w-5 h-5 text-slate-500" />
                          <span className="text-sm text-slate-600">Anexar documento (imagem ou PDF)</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone 2</label>
                  <input
                    type="text"
                    value={editForm.phone2}
                    onChange={(e) => setEditForm({ ...editForm, phone2: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Filial</label>
                  <select
                    value={editForm.location_id}
                    onChange={(e) => setEditForm({ ...editForm, location_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione uma filial</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.trade_name || loc.legal_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Departamento</label>
                  <select
                    value={editForm.department_id}
                    onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione um departamento</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.description}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Setor</label>
                  <select
                    value={editForm.sector_id}
                    onChange={(e) => setEditForm({ ...editForm, sector_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione um setor</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.description}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Area</label>
                  <select
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione uma area</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.description}>{a.description}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Superior Imediato</label>
                  <select
                    value={editForm.supervisor_id}
                    onChange={(e) => setEditForm({ ...editForm, supervisor_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione o superior imediato</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Cargo</label>
                  <select
                    value={editForm.position_id}
                    onChange={(e) => setEditForm({ ...editForm, position_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione um cargo</option>
                    {positions.map((pos) => (
                      <option key={pos.id} value={pos.id}>{pos.description}</option>
                    ))}
                  </select>
                </div>

                {editForm.user_type_id !== 4 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Equipe</label>
                    <select
                      value={editForm.team_id}
                      onChange={(e) => setEditForm({ ...editForm, team_id: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    >
                      <option value="">Selecione uma equipe</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Turno 1</label>
                  <select
                    value={editForm.shift_id}
                    onChange={(e) => setEditForm({ ...editForm, shift_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione um turno</option>
                    {shiftTimes.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} {shift.start_time && shift.end_time ? `(${shift.start_time} - ${shift.end_time})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Turno 2</label>
                  <select
                    value={editForm.shift_id_2}
                    onChange={(e) => setEditForm({ ...editForm, shift_id_2: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione um turno</option>
                    {shiftTimes.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} {shift.start_time && shift.end_time ? `(${shift.start_time} - ${shift.end_time})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    required
                  >
                    <option value={EmployeeStatus.ACTIVE}>Ativo</option>
                    <option value={EmployeeStatus.VACATION}>Férias</option>
                    <option value={EmployeeStatus.SUSPENDED}>Suspenso</option>
                    <option value={EmployeeStatus.AWAY}>Afastado</option>
                    <option value={EmployeeStatus.TERMINATED}>Desligado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de Acesso *</label>
                  <select
                    value={editForm.user_type_id}
                    onChange={(e) => setEditForm({ ...editForm, user_type_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    required
                  >
                    {userTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Endereco</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  rows={3}
                />
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  Ferias e Folgas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Data de Admissao</label>
                    <input
                      type="date"
                      value={editForm.hire_date}
                      onChange={(e) => setEditForm({ ...editForm, hire_date: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Coffee className="w-4 h-4" />
                      Próxima Folga
                    </label>
                    <input
                      type="date"
                      value={editForm.next_dayoff_date}
                      onChange={(e) => setEditForm({ ...editForm, next_dayoff_date: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Frequencia de Folga (dias)</label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.dayoff_frequency_days}
                      onChange={(e) => setEditForm({ ...editForm, dayoff_frequency_days: parseInt(e.target.value) || 7 })}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">Ex: 7 para folga semanal</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Umbrella className="w-4 h-4" />
                      Proximas Ferias
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Inicio</label>
                        <input
                          type="date"
                          value={editForm.next_vacation_start}
                          onChange={(e) => setEditForm({ ...editForm, next_vacation_start: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Fim</label>
                        <input
                          type="date"
                          value={editForm.next_vacation_end}
                          onChange={(e) => setEditForm({ ...editForm, next_vacation_end: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  setRgDocumentFile(null);
                  setRgDocumentPreview(null);
                }}
                className="px-6 py-2 border-2 border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-medium hover:from-slate-800 hover:to-slate-900 transition-all shadow-md hover:shadow-lg"
              >
                Salvar Alteracoes
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowAddModal(false);
            setPhotoFile(null);
            setPhotoPreview(null);
            setRgDocumentFile(null);
            setRgDocumentPreview(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-800">Novo Funcionário</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Foto do Funcionário</label>
                <div className="relative group">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover ring-4 ring-slate-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold text-3xl ring-4 ring-slate-200">
                      {getInitials(editForm.name || 'FU')}
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-40 rounded-full cursor-pointer transition-all group-hover:opacity-100 opacity-0">
                    <Camera className="w-8 h-8 text-white drop-shadow-lg" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-2">Clique na foto para adicionar</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">CPF *</label>
                  <input
                    type="text"
                    value={editForm.cpf}
                    onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">RG</label>
                  <input
                    type="text"
                    value={editForm.rg}
                    onChange={(e) => setEditForm({ ...editForm, rg: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">CTPS</label>
                  <input
                    type="text"
                    value={editForm.ctps}
                    onChange={(e) => setEditForm({ ...editForm, ctps: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    placeholder="Ex: 1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Matrícula</label>
                  <input
                    type="text"
                    value={editForm.registration_number}
                    onChange={(e) => setEditForm({ ...editForm, registration_number: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    placeholder="Ex: EMP001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Senha de Acesso *
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Digite a senha"
                      className="w-full px-4 py-2 pr-12 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Data de Nascimento</label>
                  <input
                    type="date"
                    value={editForm.birth_date}
                    onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documento RG/CPF
                    </span>
                  </label>
                  <div className="space-y-2">
                    {rgDocumentPreview ? (
                      <div className="relative">
                        {rgDocumentFile?.type.includes('pdf') ? (
                          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <FileText className="w-8 h-8 text-slate-600" />
                            <span className="text-sm text-slate-700">{rgDocumentFile.name}</span>
                          </div>
                        ) : (
                          <img
                            src={rgDocumentPreview}
                            alt="RG Preview"
                            className="w-full h-32 object-cover rounded-lg border-2 border-slate-200"
                          />
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveRgDocument}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          id="rgDocumentInput"
                          accept="image/*,application/pdf"
                          onChange={handleRgDocumentChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="rgDocumentInput"
                          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all"
                        >
                          <Upload className="w-5 h-5 text-slate-500" />
                          <span className="text-sm text-slate-600">Anexar documento (imagem ou PDF)</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone 2</label>
                  <input
                    type="text"
                    value={editForm.phone2}
                    onChange={(e) => setEditForm({ ...editForm, phone2: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Filial</label>
                  <select
                    value={editForm.location_id}
                    onChange={(e) => setEditForm({ ...editForm, location_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione uma filial</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.trade_name || loc.legal_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Departamento</label>
                  <select
                    value={editForm.department_id}
                    onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione um departamento</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.description}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Setor</label>
                  <select
                    value={editForm.sector_id}
                    onChange={(e) => setEditForm({ ...editForm, sector_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione um setor</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.description}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Area</label>
                  <select
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione uma area</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.description}>{a.description}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Superior Imediato</label>
                  <select
                    value={editForm.supervisor_id}
                    onChange={(e) => setEditForm({ ...editForm, supervisor_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione o superior imediato</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Cargo</label>
                  <select
                    value={editForm.position_id}
                    onChange={(e) => setEditForm({ ...editForm, position_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione um cargo</option>
                    {positions.map((pos) => (
                      <option key={pos.id} value={pos.id}>{pos.description}</option>
                    ))}
                  </select>
                </div>

                {editForm.user_type_id !== 4 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Equipe</label>
                    <select
                      value={editForm.team_id}
                      onChange={(e) => setEditForm({ ...editForm, team_id: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    >
                      <option value="">Selecione uma equipe</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Turno 1</label>
                  <select
                    value={editForm.shift_id}
                    onChange={(e) => setEditForm({ ...editForm, shift_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione um turno</option>
                    {shiftTimes.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} {shift.start_time && shift.end_time ? `(${shift.start_time} - ${shift.end_time})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Turno 2</label>
                  <select
                    value={editForm.shift_id_2}
                    onChange={(e) => setEditForm({ ...editForm, shift_id_2: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  >
                    <option value="">Selecione um turno</option>
                    {shiftTimes.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} {shift.start_time && shift.end_time ? `(${shift.start_time} - ${shift.end_time})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de Acesso *</label>
                  <select
                    value={editForm.user_type_id}
                    onChange={(e) => setEditForm({ ...editForm, user_type_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    required
                  >
                    {userTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    required
                  >
                    <option value={EmployeeStatus.ACTIVE}>Ativo</option>
                    <option value={EmployeeStatus.VACATION}>Férias</option>
                    <option value={EmployeeStatus.SUSPENDED}>Suspenso</option>
                    <option value={EmployeeStatus.AWAY}>Afastado</option>
                    <option value={EmployeeStatus.TERMINATED}>Desligado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Endereco</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  rows={3}
                />
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  Ferias e Folgas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Data de Admissao</label>
                    <input
                      type="date"
                      value={editForm.hire_date}
                      onChange={(e) => setEditForm({ ...editForm, hire_date: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Coffee className="w-4 h-4" />
                      Próxima Folga
                    </label>
                    <input
                      type="date"
                      value={editForm.next_dayoff_date}
                      onChange={(e) => setEditForm({ ...editForm, next_dayoff_date: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Frequencia de Folga (dias)</label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.dayoff_frequency_days}
                      onChange={(e) => setEditForm({ ...editForm, dayoff_frequency_days: parseInt(e.target.value) || 7 })}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">Ex: 7 para folga semanal</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Umbrella className="w-4 h-4" />
                      Proximas Ferias
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Inicio</label>
                        <input
                          type="date"
                          value={editForm.next_vacation_start}
                          onChange={(e) => setEditForm({ ...editForm, next_vacation_start: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Fim</label>
                        <input
                          type="date"
                          value={editForm.next_vacation_end}
                          onChange={(e) => setEditForm({ ...editForm, next_vacation_end: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className="px-6 py-2 border-2 border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAdd}
                className="px-6 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-medium hover:from-slate-800 hover:to-slate-900 transition-all shadow-md hover:shadow-lg"
              >
                Cadastrar Funcionario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
