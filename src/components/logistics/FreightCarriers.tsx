import { useState, useEffect } from 'react';
import { Building2, PlusCircle, Pencil, X, Save, Phone, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Carrier {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  contact_person: string;
  city: string;
  state: string;
  is_active: boolean;
  created_at: string;
}

export function FreightCarriers() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    contact_person: '',
    city: '',
    state: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    try {
      const { data, error } = await supabase
        .from('freight_carriers')
        .select('*')
        .order('name');
      if (error) throw error;
      setCarriers(data || []);
    } catch (error) {
      console.error('Error loading carriers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('freight_carriers')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('freight_carriers')
          .insert(form);
        if (error) throw error;
      }

      setForm({ name: '', cnpj: '', phone: '', email: '', contact_person: '', city: '', state: '' });
      setShowForm(false);
      setEditingId(null);
      loadCarriers();
    } catch (error) {
      console.error('Error saving carrier:', error);
      alert('Erro ao salvar transportadora');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (carrier: Carrier) => {
    setForm({
      name: carrier.name || '',
      cnpj: carrier.cnpj || '',
      phone: carrier.phone || '',
      email: carrier.email || '',
      contact_person: carrier.contact_person || '',
      city: carrier.city || '',
      state: carrier.state || '',
    });
    setEditingId(carrier.id);
    setShowForm(true);
  };

  const handleToggleActive = async (carrier: Carrier) => {
    try {
      const { error } = await supabase
        .from('freight_carriers')
        .update({ is_active: !carrier.is_active, updated_at: new Date().toISOString() })
        .eq('id', carrier.id);
      if (error) throw error;
      loadCarriers();
    } catch (error) {
      console.error('Error toggling carrier:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800">Transportadoras</h2>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', cnpj: '', phone: '', email: '', contact_person: '', city: '', state: '' }); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Nova Transportadora
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">
              {editingId ? 'Editar Transportadora' : 'Nova Transportadora'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">CNPJ</label>
              <input
                type="text"
                value={form.cnpj}
                onChange={(e) => setForm(prev => ({ ...prev, cnpj: e.target.value }))}
                placeholder="00.000.000/0000-00"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contato</label>
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) => setForm(prev => ({ ...prev, contact_person: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">UF</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))}
                maxLength={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {carriers.map(carrier => (
          <div
            key={carrier.id}
            className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${
              carrier.is_active ? 'border-slate-100 hover:shadow-md' : 'border-slate-100 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{carrier.name}</h4>
                  {carrier.cnpj && <p className="text-[10px] text-slate-400">{carrier.cnpj}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(carrier)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleToggleActive(carrier)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    carrier.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {carrier.is_active ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            </div>
            <div className="space-y-1 mt-3">
              {carrier.contact_person && (
                <p className="text-xs text-slate-500">Contato: {carrier.contact_person}</p>
              )}
              {carrier.phone && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {carrier.phone}
                </p>
              )}
              {carrier.email && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {carrier.email}
                </p>
              )}
              {carrier.city && (
                <p className="text-xs text-slate-400">{carrier.city}{carrier.state ? `/${carrier.state}` : ''}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {carriers.length === 0 && !showForm && (
        <div className="text-center py-8">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Nenhuma transportadora cadastrada</p>
        </div>
      )}
    </div>
  );
}
