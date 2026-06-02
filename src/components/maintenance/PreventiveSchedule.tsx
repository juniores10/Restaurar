import { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Wrench, Clock, MapPin, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MaintenanceOrderForm } from './MaintenanceOrderForm';

interface PreventiveOrder {
  id: string;
  order_number: string;
  title: string;
  equipment: string;
  location: string;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  assigned_to: string;
  priority: string;
}

export function PreventiveSchedule() {
  const [orders, setOrders] = useState<PreventiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadPreventiveOrders();
  }, []);

  const loadPreventiveOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('maintenance_orders')
      .select('id, order_number, title, equipment, location, status, scheduled_start, scheduled_end, assigned_to, priority')
      .eq('maintenance_type', 'Preventiva')
      .not('scheduled_start', 'is', null)
      .order('scheduled_start', { ascending: true });
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  const ordersByDay = useMemo(() => {
    const map: Record<number, PreventiveOrder[]> = {};
    orders.forEach(o => {
      if (!o.scheduled_start) return;
      const d = new Date(o.scheduled_start);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(o);
      }
    });
    return map;
  }, [orders, year, month]);

  const selectedDayOrders = selectedDay ? (ordersByDay[selectedDay] || []) : [];

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => { setCurrentDate(new Date()); setSelectedDay(new Date().getDate()); };

  const handleCreatePreventive = (day: number) => {
    const date = new Date(year, month, day, 8, 0, 0);
    setFormInitialDate(date.toISOString());
    setShowForm(true);
  };

  const handleFormSaved = () => {
    setShowForm(false);
    setFormInitialDate(undefined);
    loadPreventiveOrders();
  };

  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critica': return 'bg-red-500';
      case 'Alta': return 'bg-orange-500';
      case 'Media': case 'Média': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aberto': return 'bg-blue-100 text-blue-700';
      case 'Agendado': return 'bg-teal-100 text-teal-700';
      case 'Em Andamento': return 'bg-amber-100 text-amber-700';
      case 'Concluído': return 'bg-green-100 text-green-700';
      case 'Cancelado': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const totalThisMonth = Object.values(ordersByDay).reduce((sum, arr) => sum + arr.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-teal-600" />
            </div>
            Agenda de Preventivas
          </h1>
          <p className="text-gray-500 mt-1">Calendario de manutencoes preventivas agendadas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2">
            <span className="text-sm font-medium text-teal-700">{totalThisMonth} preventiva{totalThisMonth !== 1 ? 's' : ''} neste mes</span>
          </div>
          <button onClick={goToToday} className="px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors">
            Hoje
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <button onClick={goToPrevMonth} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-800">
            {monthNames[month]} {year}
          </h2>
          <button onClick={goToNextMonth} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7">
          {dayNames.map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-gray-50 bg-gray-50/30" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayOrders = ordersByDay[day] || [];
            const isSelected = selectedDay === day;
            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`min-h-[100px] border-b border-r border-gray-100 p-1.5 cursor-pointer transition-colors group relative ${
                  isSelected ? 'bg-teal-50 ring-2 ring-inset ring-teal-400' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${
                    isToday(day) ? 'bg-teal-600 text-white' : 'text-gray-700'
                  }`}>
                    {day}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCreatePreventive(day); }}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-teal-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-teal-600 shadow-sm"
                    title="Cadastrar preventiva neste dia"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {dayOrders.length > 0 && (
                  <div className="space-y-0.5">
                    {dayOrders.slice(0, 3).map(o => (
                      <div key={o.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${getPriorityColor(o.priority)} bg-opacity-15 text-gray-700`}>
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getPriorityColor(o.priority)}`} />
                        <span className="truncate">{o.equipment || o.title}</span>
                      </div>
                    ))}
                    {dayOrders.length > 3 && (
                      <div className="text-[10px] text-gray-400 font-medium pl-1">+{dayOrders.length - 3} mais</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">
              Preventivas para {selectedDay} de {monthNames[month]}
            </h3>
            <button
              onClick={() => handleCreatePreventive(selectedDay)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Cadastrar Preventiva
            </button>
          </div>
          {selectedDayOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhuma preventiva agendada para este dia.</p>
          ) : (
            <div className="space-y-3">
              {selectedDayOrders.map(o => (
                <div key={o.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:border-teal-200 transition-colors">
                  <div className={`w-2 h-full min-h-[60px] rounded-full flex-shrink-0 ${getPriorityColor(o.priority)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{o.order_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(o.status)}`}>
                        {o.status}
                      </span>
                    </div>
                    <p className="font-medium text-gray-800 text-sm">{o.title}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {o.equipment && (
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5" /> {o.equipment}
                        </span>
                      )}
                      {o.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {o.location}
                        </span>
                      )}
                      {o.scheduled_start && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(o.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {o.scheduled_end && ` - ${new Date(o.scheduled_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                      )}
                    </div>
                    {o.assigned_to && (
                      <p className="text-xs text-gray-400 mt-1">Responsavel: {o.assigned_to}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <MaintenanceOrderForm
          order={null}
          onClose={() => { setShowForm(false); setFormInitialDate(undefined); }}
          onSaved={handleFormSaved}
          initialDate={formInitialDate}
        />
      )}
    </div>
  );
}
