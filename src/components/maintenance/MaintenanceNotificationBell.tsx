import { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { maintenanceService } from '../../services/maintenanceService';
import { useAuth } from '../../contexts/AuthContext';
import { MaintenanceApprovalModal } from './MaintenanceApprovalModal';
import { ServiceOrderForm } from './ServiceOrderForm';
import type { MaintenanceOrder } from '../../types/maintenance';

export function MaintenanceNotificationBell({ onOrdersChanged }: { onOrdersChanged: () => void }) {
  const { user, employeeProfile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [approvedOrder, setApprovedOrder] = useState<MaintenanceOrder | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await maintenanceService.getPendingNotificationsForUser(user.id);
      setNotifications(data);
    } catch {
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleApproved = (order: MaintenanceOrder) => {
    setSelectedNotification(null);
    setApprovedOrder(order);
    loadNotifications();
    onOrdersChanged();
  };

  const handleRejected = () => {
    setSelectedNotification(null);
    setShowPanel(false);
    loadNotifications();
    onOrdersChanged();
  };

  const handleServiceOrderSaved = () => {
    setApprovedOrder(null);
    setShowPanel(false);
    onOrdersChanged();
  };

  if (notifications.length === 0 && !showPanel) return null;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowPanel(v => !v)}
          className="relative p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 hover:bg-amber-100 transition-colors"
          title="Solicitacoes aguardando aprovacao"
        >
          <Bell className="w-4 h-4" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </button>

        {showPanel && (
          <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Solicitacoes Pendentes</h3>
                <p className="text-xs text-gray-500">{notifications.length} aguardando aprovacao</p>
              </div>
              <button onClick={() => setShowPanel(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  Nenhuma solicitacao pendente
                </div>
              ) : (
                notifications.map(notif => {
                  const order: MaintenanceOrder = notif.maintenance_orders;
                  if (!order) return null;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => { setSelectedNotification(notif); setShowPanel(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-gray-400">{order.order_number}</p>
                          <p className="text-sm font-semibold text-gray-800 truncate">{order.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{order.equipment || order.location || '—'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">por {order.requested_by}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            order.priority === 'Crítica' ? 'bg-red-100 text-red-700' :
                            order.priority === 'Alta' ? 'bg-orange-100 text-orange-700' :
                            order.priority === 'Média' ? 'bg-amber-100 text-amber-700' :
                            'bg-sky-100 text-sky-700'
                          }`}>
                            {order.priority}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                  Aprovar
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-3">
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                  Rejeitar
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedNotification && (
        <MaintenanceApprovalModal
          notification={selectedNotification}
          approverName={employeeProfile?.full_name ?? 'Gestor'}
          onClose={() => setSelectedNotification(null)}
          onApproved={handleApproved}
          onRejected={handleRejected}
        />
      )}

      {approvedOrder && (
        <ServiceOrderForm
          order={approvedOrder}
          onClose={() => { setApprovedOrder(null); onOrdersChanged(); }}
          onSaved={handleServiceOrderSaved}
        />
      )}
    </>
  );
}
