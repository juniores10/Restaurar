import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  description: string;
  data: any;
  created_at: string;
  created_by: string;
}

interface ReportFormProps {
  report?: Report;
  departmentId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export function ReportForm({ report, departmentId, onSuccess, onCancel, initialData }: ReportFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(report?.title || '');
  const [description, setDescription] = useState(report?.description || '');
  const [data, setData] = useState(JSON.stringify(initialData || report?.data || {}, null, 2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let parsedData = {};
      try {
        parsedData = data ? JSON.parse(data) : {};
      } catch {
        throw new Error('Dados JSON inválidos');
      }

      if (report?.id) {
        const { error: updateError } = await supabase
          .from('reports')
          .update({
            title,
            description,
            data: parsedData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', report.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('reports').insert({
          title,
          description,
          data: parsedData,
          department_id: departmentId,
          created_by: user?.id,
        });

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar relatório');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {report ? 'Editar Relatório' : 'Criar Novo Relatório'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Título do relatório"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                placeholder="Descrição do relatório"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dados (JSON)
              </label>
              <textarea
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm h-64"
                placeholder='{"campo": "valor"}'
              />
              <p className="text-xs text-gray-500 mt-1">Insira os dados em formato JSON</p>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading
                  ? report
                    ? 'Atualizando...'
                    : 'Criando...'
                  : report
                    ? 'Atualizar Relatório'
                    : 'Criar Relatório'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2 px-4 bg-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
