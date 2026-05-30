import { useState, useEffect } from 'react';
import { Bell, FileText, MessageSquare, Eye, Check, CheckCheck, X, Calendar, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface EmployeeNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
}

interface EmployeeNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}

export function EmployeeNotificationPanel({ isOpen, onClose, onNavigate }: EmployeeNotificationPanelProps) {
  const { employeeProfile } = useAuth();
  const [notifications, setNotifications] = useState<EmployeeNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && employeeProfile?.id) {
      loadNotifications();
    }
  }, [isOpen, employeeProfile?.id]);

  async function loadNotifications() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('employee_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading employee notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await supabase
        .from('employee_notifications')
        .update({ is_read: true })
        .eq('id', id);

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      await supabase
        .from('employee_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  function handleNotificationClick(notification: EmployeeNotification) {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    let targetView = '';
    switch (notification.type) {
      case 'submission':
        targetView = 'documents';
        break;
      case 'suggestion':
      case 'suggestion_response':
        targetView = 'suggestions';
        break;
      case 'notice_view':
        targetView = 'dashboard';
        break;
      case 'document_read':
        targetView = 'documents';
        break;
      case 'signature':
        targetView = 'payroll';
        break;
      default:
        targetView = 'dashboard';
    }

    onClose();
    if (onNavigate && targetView) {
      onNavigate(targetView);
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case 'submission':
        return <FileText className="w-5 h-5" />;
      case 'suggestion':
        return <MessageSquare className="w-5 h-5" />;
      case 'suggestion_response':
        return <MessageCircle className="w-5 h-5" />;
      case 'notice_view':
      case 'document_read':
        return <Eye className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  }

  function getIconColor(type: string) {
    switch (type) {
      case 'submission':
        return 'from-blue-500 to-blue-600';
      case 'suggestion':
        return 'from-emerald-500 to-emerald-600';
      case 'suggestion_response':
        return 'from-teal-500 to-teal-600';
      case 'notice_view':
        return 'from-orange-500 to-orange-600';
      case 'document_read':
        return 'from-cyan-500 to-cyan-600';
      case 'signature':
        return 'from-rose-500 to-rose-600';
      default:
        return 'from-slate-500 to-slate-600';
    }
  }

  function getBgColor(type: string, isRead: boolean) {
    if (isRead) return 'bg-slate-50';
    switch (type) {
      case 'submission':
        return 'bg-blue-50 border-l-4 border-blue-500';
      case 'suggestion':
        return 'bg-emerald-50 border-l-4 border-emerald-500';
      case 'suggestion_response':
        return 'bg-teal-50 border-l-4 border-teal-500';
      case 'notice_view':
        return 'bg-orange-50 border-l-4 border-orange-500';
      case 'document_read':
        return 'bg-cyan-50 border-l-4 border-cyan-500';
      case 'signature':
        return 'bg-rose-50 border-l-4 border-rose-500';
      default:
        return 'bg-slate-50';
    }
  }

  function formatTimeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atras`;
    if (diffHours < 24) return `${diffHours}h atras`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atras`;
    return date.toLocaleDateString('pt-BR');
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-slate-700 to-slate-800">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-lg font-bold text-white">Minhas Notificacoes</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-300">{unreadCount} nao lida{unreadCount !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <Bell className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-center font-medium">Nenhuma notificacao</p>
              <p className="text-sm text-center mt-1">
                Suas atividades como envio de documentos, sugestoes e visualizacoes aparecerao aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-slate-100 transition-colors cursor-pointer ${getBgColor(notification.type, notification.is_read)}`}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getIconColor(notification.type)} flex items-center justify-center text-white flex-shrink-0`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-semibold text-sm ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors flex-shrink-0"
                            title="Marcar como lida"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTimeAgo(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
