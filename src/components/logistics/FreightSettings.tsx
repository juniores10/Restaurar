import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function FreightSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    id: '',
    default_sla_days: 3,
    freight_percentage_target: 5.0,
    alert_delay_days: 2,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('freight_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          id: data.id,
          default_sla_days: data.default_sla_days,
          freight_percentage_target: data.freight_percentage_target,
          alert_delay_days: data.alert_delay_days,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (settings.id) {
        const { error } = await supabase
          .from('freight_settings')
          .update({
            default_sla_days: settings.default_sla_days,
            freight_percentage_target: settings.freight_percentage_target,
            alert_delay_days: settings.alert_delay_days,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('freight_settings')
          .insert({
            default_sla_days: settings.default_sla_days,
            freight_percentage_target: settings.freight_percentage_target,
            alert_delay_days: settings.alert_delay_days,
            updated_by: user?.id,
          });
        if (error) throw error;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configuracoes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base sm:text-lg font-semibold text-slate-800">Configuracoes do Modulo</h2>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          Configuracoes salvas com sucesso!
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-800">Parametros Gerais</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                SLA Padrao (dias uteis)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.default_sla_days}
                onChange={(e) => setSettings(prev => ({ ...prev, default_sla_days: parseInt(e.target.value) || 3 }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className="text-[10px] text-slate-400 mt-1">Prazo padrao para entregas em dias</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Meta % Frete / NF
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.freight_percentage_target}
                  onChange={(e) => setSettings(prev => ({ ...prev, freight_percentage_target: parseFloat(e.target.value) || 5 }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Percentual maximo aceitavel de frete sobre NF</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Alerta de Atraso (dias)
              </label>
              <input
                type="number"
                min="1"
                max="15"
                value={settings.alert_delay_days}
                onChange={(e) => setSettings(prev => ({ ...prev, alert_delay_days: parseInt(e.target.value) || 2 }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className="text-[10px] text-slate-400 mt-1">Gerar alerta apos X dias sem entrega</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Salvar Configuracoes'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Status Disponiveis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-slate-700">Em Transporte</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-slate-700">Entregue no Prazo</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs text-slate-700">Entregue com Atraso</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-slate-700">Atrasado</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
            <span className="text-xs text-slate-700">Cancelado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
