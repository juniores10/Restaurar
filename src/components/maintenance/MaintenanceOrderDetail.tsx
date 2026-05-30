import { useState, useEffect } from 'react';
import { X, Send, Trash2, Clock, MapPin, Wrench as WrenchIcon, User, DollarSign, AlertTriangle, MessageCircle } from 'lucide-react';
import { maintenanceService } from '../../services/maintenanceService';
import { useAuth } from '../../contexts/AuthContext';
import type { MaintenanceOrder, MaintenanceComment } from '../../types/maintenance';

interface Props {
  order: MaintenanceOrder;
  onClose: () => void;
  onEdit: () => void;
}

const priorityConfig: Record<string, { bg: string; text: string }> = {
  'Baixa': { bg: 'bg-sky-100', text: 'text-sky-700' },
  'Média': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Alta': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Crítica': { bg: 'bg-red-100', text: 'text-red-700' },
};

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  'Aberto': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'Em Andamento': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Aguardando Peça': { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  'Concluído': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Cancelado': { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

const faultConfig: Record<string, { bg: string; text: string }> = {
  'Elétrica': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'Operacional': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Equipamento': { bg: 'bg-rose-100', text: 'text-rose-800' },
};

export function MaintenanceOrderDetail({ order, onClose, onEdit }: Props) {
  const { canManageSystem } = useAuth();
  const isAdmin = canManageSystem();
  const [comments, setComments] = useState<MaintenanceComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    loadComments();
  }, [order.id]);

  const loadComments = async () => {
    try {
      const data = await maintenanceService.listComments(order.id);
      setComments(data);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      await maintenanceService.addComment(order.id, newComment.trim());
      setNewComment('');
      loadComments();
    } catch (err: any) {
      alert('Erro ao enviar comentario: ' + err.message);
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Excluir este comentario?')) return;
    try {
      await maintenanceService.deleteComment(id);
      loadComments();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  const formatCurrency = (v: number) => {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const sConf = statusConfig[order.status] || statusConfig['Aberto'];
  const pConf = priorityConfig[order.priority] || priorityConfig['Média'];
  const fConf = faultConfig[order.fault_type] || faultConfig['Equipamento'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-gray-500">{order.order_number}</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${sConf.bg} ${sConf.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sConf.dot}`}></span>
                {order.status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-1">{order.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${pConf.bg} ${pConf.text}`}>
              Prioridade: {order.priority}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${fConf.bg} ${fConf.text}`}>
              Falha: {order.fault_type}
            </span>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Origem do Problema</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{order.problem_origin}</p>
              </div>
            </div>
          </div>

          {order.description && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Descricao</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {order.location && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Local</p>
                  <p className="text-sm font-medium text-gray-900">{order.location}</p>
                </div>
              </div>
            )}
            {order.equipment && (
              <div className="flex items-start gap-2">
                <WrenchIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Equipamento</p>
                  <p className="text-sm font-medium text-gray-900">{order.equipment}</p>
                </div>
              </div>
            )}
            {order.requested_by && (
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Solicitante</p>
                  <p className="text-sm font-medium text-gray-900">{order.requested_by}</p>
                </div>
              </div>
            )}
            {order.assigned_to && (
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Tecnico</p>
                  <p className="text-sm font-medium text-gray-900">{order.assigned_to}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Downtime Est.</p>
              <p className="text-sm font-bold text-gray-900">{order.estimated_downtime_hours}h</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Downtime Real</p>
              <p className="text-sm font-bold text-gray-900">{order.actual_downtime_hours}h</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <DollarSign className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Custo Est.</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(order.estimated_cost)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <DollarSign className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Custo Real</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(order.actual_cost)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Abertura:</span>{' '}
              <span className="font-medium text-gray-900">{formatDate(order.created_at)}</span>
            </div>
            <div>
              <span className="text-gray-500">Inicio:</span>{' '}
              <span className="font-medium text-gray-900">{formatDate(order.started_at)}</span>
            </div>
            <div>
              <span className="text-gray-500">Conclusao:</span>{' '}
              <span className="font-medium text-gray-900">{formatDate(order.completed_at)}</span>
            </div>
          </div>

          {order.resolution_notes && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Resolucao</p>
              <p className="text-sm text-emerald-900 whitespace-pre-wrap">{order.resolution_notes}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-bold text-gray-700">Comentarios ({comments.length})</h3>
            </div>

            {comments.length > 0 && (
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {comments.map(c => (
                  <div key={c.id} className="bg-gray-50 rounded-xl p-3 group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">{formatDate(c.created_at)}</span>
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-800">{c.comment}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendComment()}
                placeholder="Adicionar comentario..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                onClick={handleSendComment}
                disabled={sendingComment || !newComment.trim()}
                className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
          >
            Fechar
          </button>
          {isAdmin && (
            <button
              onClick={onEdit}
              className="px-5 py-2.5 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-medium transition-colors"
            >
              Editar Chamado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
