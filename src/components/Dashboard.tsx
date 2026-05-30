import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Users, Calendar, Shield, MapPin, Briefcase, Clock, CalendarDays, Home } from 'lucide-react';
import { EmployeeManagement } from './EmployeeManagement';
import { employeeService } from '../services/employeeService';
import type { Employee } from '../types/database';

type ActiveModule = 'home' | 'employees' | 'locations' | 'departments' | 'timebank' | 'schedules';

export function Dashboard() {
  const { signOut } = useAuth();
  const [activeModule, setActiveModule] = useState<ActiveModule>('home');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onVacation: 0,
    away: 0
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      const data = await employeeService.getAll();
      setEmployees(data);

      setStats({
        total: data.length,
        active: data.filter(e => e.status === 0).length,
        onVacation: data.filter(e => e.status === 1).length,
        away: data.filter(e => e.status === 3).length
      });
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  const menuItems = [
    { id: 'home' as ActiveModule, label: 'Dashboard', icon: Home },
    { id: 'employees' as ActiveModule, label: 'Funcionários', icon: Users },
    { id: 'locations' as ActiveModule, label: 'Locais', icon: MapPin },
    { id: 'departments' as ActiveModule, label: 'Setores & Cargos', icon: Briefcase },
    { id: 'timebank' as ActiveModule, label: 'Banco de Horas', icon: Clock },
    { id: 'schedules' as ActiveModule, label: 'Escalas', icon: CalendarDays }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex">
      <aside className="w-64 bg-white shadow-lg border-r border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-2.5 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Pion G Plus
              </h1>
              <p className="text-xs text-slate-600">Sistema de Gestão</p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                activeModule === item.id
                  ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-slate-200">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-md"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {activeModule === 'home' && (
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Total de Funcionários</p>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Ativos</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Em Férias</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.onVacation}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Afastados</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{stats.away}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Bem-vindo ao Sistema PegaNet</h3>
              <p className="text-slate-600">
                Sistema completo de gerenciamento de recursos humanos. Use o menu lateral para navegar entre as funcionalidades.
              </p>
            </div>
          </div>
        )}

        {activeModule === 'employees' && <EmployeeManagement />}

        {activeModule === 'locations' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Gerenciamento de Locais
            </h2>
            <p className="text-slate-600">Módulo em desenvolvimento...</p>
          </div>
        )}

        {activeModule === 'departments' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-6 h-6" />
              Setores, Cargos e Funções
            </h2>
            <p className="text-slate-600">Módulo em desenvolvimento...</p>
          </div>
        )}

        {activeModule === 'timebank' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Banco de Horas
            </h2>
            <p className="text-slate-600">Módulo em desenvolvimento...</p>
          </div>
        )}

        {activeModule === 'schedules' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarDays className="w-6 h-6" />
              Escalas de Trabalho
            </h2>
            <p className="text-slate-600">Módulo em desenvolvimento...</p>
          </div>
        )}
      </main>
    </div>
  );
}
