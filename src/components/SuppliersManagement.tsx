import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Search, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Supplier {
  id: string;
  name: string;
  trade_name: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  status: number;
  created_at: string;
}

const emptyForm = {
  id: '',
  name: '',
  trade_name: '',
  cnpj: '',
  phone: '',
  email: '',
  contact_person: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  notes: '',
  status: 0,
};

export function SuppliersManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    if (!error && data) setSuppliers(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Razao Social e obrigatorio');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      trade_name: formData.trade_name.trim() || null,
      cnpj: formData.cnpj.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      contact_person: formData.contact_person.trim() || null,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      state: formData.state.trim() || null,
      zip_code: formData.zip_code.trim() || null,
      notes: formData.notes.trim() || null,
      status: formData.status,
    };

    if (formData.id) {
      const { error } = await supabase
        .from('suppliers')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', formData.id);
      if (error) { alert('Erro ao atualizar fornecedor'); return; }
    } else {
      const { error } = await supabase
        .from('suppliers')
        .insert(payload);
      if (error) { alert('Erro ao cadastrar fornecedor'); return; }
    }

    setFormData(emptyForm);
    setIsFormVisible(false);
    loadSuppliers();
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData({
      id: supplier.id,
      name: supplier.name,
      trade_name: supplier.trade_name || '',
      cnpj: supplier.cnpj || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      contact_person: supplier.contact_person || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      zip_code: supplier.zip_code || '',
      notes: supplier.notes || '',
      status: supplier.status,
    });
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este fornecedor?')) return;
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) { alert('Erro ao excluir fornecedor'); return; }
    loadSuppliers();
  };

  const filtered = suppliers.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      (s.trade_name || '').toLowerCase().includes(term) ||
      (s.cnpj || '').includes(term) ||
      (s.city || '').toLowerCase().includes(term)
    );
  });

  const states = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Fornecedores</h2>
          <span className="text-sm text-gray-500">({filtered.length})</span>
        </div>
        <button
          onClick={() => { setFormData(emptyForm); setIsFormVisible(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Adicionar Fornecedor
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, CNPJ ou cidade..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {isFormVisible && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {formData.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Razao Social *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={formData.trade_name}
                  onChange={e => setFormData(p => ({ ...p, trade_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={e => setFormData(p => ({ ...p, cnpj: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pessoa de Contato</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={e => setFormData(p => ({ ...p, contact_person: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Endereco</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                <select
                  value={formData.state}
                  onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  {states.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CEP</label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={e => setFormData(p => ({ ...p, zip_code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(p => ({ ...p, status: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Ativo</option>
                  <option value={1}>Inativo</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Observacoes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setIsFormVisible(false); setFormData(emptyForm); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {formData.id ? 'Salvar Alteracoes' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhum fornecedor encontrado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Razao Social</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Nome Fantasia</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">CNPJ</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Cidade/UF</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Contato</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(supplier => (
                <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3 text-gray-900 font-medium">{supplier.name}</td>
                  <td className="py-3 px-3 text-gray-600">{supplier.trade_name || '-'}</td>
                  <td className="py-3 px-3 text-gray-600">{supplier.cnpj || '-'}</td>
                  <td className="py-3 px-3 text-gray-600">
                    {supplier.city && supplier.state ? `${supplier.city}/${supplier.state}` : supplier.city || supplier.state || '-'}
                  </td>
                  <td className="py-3 px-3 text-gray-600">{supplier.contact_person || supplier.phone || '-'}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      supplier.status === 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {supplier.status === 0 ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right text-xs text-gray-500 mt-3">
            Total: {filtered.length} {filtered.length === 1 ? 'fornecedor cadastrado' : 'fornecedores cadastrados'}
          </div>
        </div>
      )}
    </div>
  );
}
