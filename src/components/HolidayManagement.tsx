import { useState, useEffect } from 'react';
import { Plus, Save, X, Calendar, Trash2, Edit2, Download, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: number;
  status: number;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isImporting, setIsImporting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    date: ''
  });

  useEffect(() => {
    loadHolidays();
  }, [selectedYear]);

  const loadHolidays = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('holidays')
        .select('*')
        .eq('status', 0)
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`)
        .order('date');

      setHolidays(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingHoliday(null);
    setFormData({
      name: '',
      date: ''
    });
    setShowForm(true);
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.date) {
      alert('Preencha o nome e a data do feriado');
      return;
    }

    try {
      const { data: userData } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (editingHoliday) {
        const { error } = await supabase
          .from('holidays')
          .update({
            name: formData.name,
            date: formData.date,
            type: 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingHoliday.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('holidays')
          .insert({
            name: formData.name,
            date: formData.date,
            type: 1,
            created_by: userData?.id || null
          });

        if (error) {
          if (error.code === '23505') {
            alert('Ja existe um feriado cadastrado nesta data');
            return;
          }
          throw error;
        }
      }

      await loadHolidays();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving holiday:', error);
      alert('Erro ao salvar feriado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este feriado?')) return;

    try {
      const { error } = await supabase
        .from('holidays')
        .update({ status: 1, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deleting holiday:', error);
        alert(`Erro ao excluir feriado: ${error.message}`);
        return;
      }

      await loadHolidays();
    } catch (error: any) {
      console.error('Error deleting holiday:', error);
      alert(`Erro ao excluir feriado: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const importNationalHolidays = async () => {
    setIsImporting(true);
    try {
      const nationalHolidays = calculateNationalHolidays(selectedYear);

      const { data: userData } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      for (const holiday of nationalHolidays) {
        await supabase
          .from('holidays')
          .upsert({
            name: holiday.name,
            date: holiday.date,
            type: 0,
            status: 0,
            created_by: userData?.id || null
          }, { onConflict: 'date' });
      }

      await loadHolidays();
      alert(`Feriados nacionais de ${selectedYear} importados com sucesso!`);
    } catch (error) {
      console.error('Error importing holidays:', error);
      alert('Erro ao importar feriados');
    } finally {
      setIsImporting(false);
    }
  };

  const calculateNationalHolidays = (year: number) => {
    const easter = calculateEaster(year);
    const easterDate = new Date(year, easter.month - 1, easter.day);

    const carnival = new Date(easterDate);
    carnival.setDate(carnival.getDate() - 47);

    const carnivalTuesday = new Date(easterDate);
    carnivalTuesday.setDate(carnivalTuesday.getDate() - 47);

    const ashWednesday = new Date(easterDate);
    ashWednesday.setDate(ashWednesday.getDate() - 46);

    const goodFriday = new Date(easterDate);
    goodFriday.setDate(goodFriday.getDate() - 2);

    const corpusChristi = new Date(easterDate);
    corpusChristi.setDate(corpusChristi.getDate() + 60);

    const formatDate = (d: Date) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    return [
      { name: 'Confraternizacao Universal', date: `${year}-01-01` },
      { name: 'Carnaval', date: formatDate(carnival) },
      { name: 'Carnaval', date: formatDate(carnivalTuesday) },
      { name: 'Quarta-feira de Cinzas', date: formatDate(ashWednesday) },
      { name: 'Sexta-feira Santa', date: formatDate(goodFriday) },
      { name: 'Pascoa', date: formatDate(easterDate) },
      { name: 'Tiradentes', date: `${year}-04-21` },
      { name: 'Dia do Trabalho', date: `${year}-05-01` },
      { name: 'Corpus Christi', date: formatDate(corpusChristi) },
      { name: 'Independencia do Brasil', date: `${year}-09-07` },
      { name: 'Nossa Senhora Aparecida', date: `${year}-10-12` },
      { name: 'Finados', date: `${year}-11-02` },
      { name: 'Proclamacao da Republica', date: `${year}-11-15` },
      { name: 'Natal', date: `${year}-12-25` }
    ];
  };

  const calculateEaster = (year: number) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return { month, day };
  };

  const formatDateDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getMonthHolidays = (month: number) => {
    return holidays.filter(h => {
      const holidayMonth = parseInt(h.date.split('-')[1]);
      return holidayMonth === month;
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-wrap justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Feriados</h2>
          <p className="text-gray-600">Gerencie os feriados nacionais e personalizados</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={importNationalHolidays}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {isImporting ? 'Importando...' : 'Importar Feriados Nacionais'}
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Feriado
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-800 font-medium">Dica</p>
          <p className="text-amber-700 text-sm">
            Clique em "Importar Feriados Nacionais" para adicionar automaticamente todos os feriados nacionais do ano selecionado.
            Os feriados moveis (Carnaval, Pascoa, Corpus Christi) sao calculados automaticamente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MONTHS.map((monthName, index) => {
          const monthHolidays = getMonthHolidays(index + 1);
          return (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-800 text-white px-4 py-2">
                <h3 className="font-semibold">{monthName}</h3>
              </div>
              <div className="p-4">
                {monthHolidays.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Nenhum feriado</p>
                ) : (
                  <div className="space-y-2">
                    {monthHolidays.map(holiday => (
                      <div
                        key={holiday.id}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          holiday.type === 0 ? 'bg-red-50' : 'bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            holiday.type === 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {holiday.date.split('-')[2]}
                          </span>
                          <span className="text-gray-800 text-sm truncate" title={holiday.name}>
                            {holiday.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(holiday)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(holiday.id)}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-red-100 border border-red-200 rounded"></span>
          <span className="text-gray-600">Feriado Nacional</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></span>
          <span className="text-gray-600">Feriado Personalizado</span>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingHoliday ? 'Editar Feriado' : 'Novo Feriado'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Feriado *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Aniversario da Cidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
