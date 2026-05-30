import React, { useState } from 'react';
import { fetchExternalAPI } from '../services/apiService';
import { X } from 'lucide-react';

interface ImportAPIModalProps {
  onClose: () => void;
  onImport: (data: any) => void;
}

export function ImportAPIModal({ onClose, onImport }: ImportAPIModalProps) {
  const [apiUrl, setApiUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFetch() {
    setError('');
    setLoading(true);

    try {
      let parsedHeaders = {};
      let parsedBody = {};

      try {
        parsedHeaders = JSON.parse(headers);
        parsedBody = JSON.parse(body);
      } catch {
        throw new Error('Headers ou Body JSON inválidos');
      }

      const result = await fetchExternalAPI({
        apiUrl,
        method,
        headers: parsedHeaders,
        body: parsedBody,
      });

      onImport(result.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados da API');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Importar dados de API</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL da API</label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.example.com/data"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método HTTP</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Headers (JSON)</label>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm h-20"
              placeholder='{"Authorization": "Bearer token"}'
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Body (JSON)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm h-20"
              placeholder='{}'
            />
          </div>

          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleFetch}
              disabled={loading || !apiUrl}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Buscando...' : 'Buscar dados'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-400 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
