import { useState, useEffect } from 'react';
import { Users, Monitor, Smartphone, Clock, Calendar, Search, RefreshCw, Circle, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SessionRecord {
  id: string;
  user_id: string;
  email: string;
  session_token: string;
  created_at: string;
  last_activity: string;
  is_active: boolean;
  browser_info: string | null;
  employee_name?: string;
  photo_url?: string | null;
}

export function UserSessionsHistory() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'online' | 'all'>('online');

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: sessionsData, error } = await supabase
        .from('user_sessions')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('last_activity', { ascending: false });

      if (error) throw error;

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(sessionsData.map(s => s.user_id))];
      const { data: employees } = await supabase
        .from('employees')
        .select('auth_user_id, name, photo_url')
        .in('auth_user_id', userIds);

      const employeeMap: Record<string, { name: string; photo_url: string | null }> = {};
      (employees || []).forEach(emp => {
        employeeMap[emp.auth_user_id] = { name: emp.name, photo_url: emp.photo_url };
      });

      const enrichedSessions = sessionsData.map(s => ({
        ...s,
        employee_name: employeeMap[s.user_id]?.name || s.email,
        photo_url: employeeMap[s.user_id]?.photo_url || null,
      }));

      setSessions(enrichedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOnline = (lastActivity: string): boolean => {
    const last = new Date(lastActivity).getTime();
    const now = Date.now();
    return now - last < 5 * 60 * 1000;
  };

  const getDeviceType = (browserInfo: string | null): 'mobile' | 'desktop' => {
    if (!browserInfo) return 'desktop';
    const lower = browserInfo.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone') || lower.includes('ipad')) {
      return 'mobile';
    }
    return 'desktop';
  };

  const getBrowserName = (browserInfo: string | null): string => {
    if (!browserInfo) return 'Desconhecido';
    if (browserInfo.includes('Chrome') && !browserInfo.includes('Edg')) return 'Chrome';
    if (browserInfo.includes('Firefox')) return 'Firefox';
    if (browserInfo.includes('Safari') && !browserInfo.includes('Chrome')) return 'Safari';
    if (browserInfo.includes('Edg')) return 'Edge';
    if (browserInfo.includes('Opera') || browserInfo.includes('OPR')) return 'Opera';
    return 'Navegador';
  };

  const formatDuration = (createdAt: string, lastActivity: string): string => {
    const start = new Date(createdAt).getTime();
    const end = new Date(lastActivity).getTime();
    const diffMs = end - start;
    if (diffMs < 0) return '0min';
    const totalMinutes = Math.floor(diffMs / 60000);
    if (totalMinutes < 60) return `${totalMinutes}min`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours < 24) return `${hours}h ${minutes}min`;
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    return `${days}d ${remainHours}h`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr).getTime();
    const now = Date.now();
    const diffMs = now - date;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atras`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atras`;
    const days = Math.floor(hours / 24);
    return `${days}d atras`;
  };

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = searchTerm === '' ||
      (s.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterMode === 'online') {
      return matchesSearch && s.is_active && isOnline(s.last_activity);
    }
    return matchesSearch;
  });

  const onlineCount = sessions.filter(s => s.is_active && isOnline(s.last_activity)).length;

  const groupedByDate = filteredSessions.reduce<Record<string, SessionRecord[]>>((acc, session) => {
    const date = formatDate(session.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium">Carregando sessoes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">Historico de Acessos</h2>
                  <p className="text-xs sm:text-sm text-slate-500">Ultimos 30 dias</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                  <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500 animate-pulse" />
                  <span className="text-sm font-semibold text-green-700">{onlineCount} online</span>
                </div>
                <button
                  onClick={loadSessions}
                  className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Atualizar"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setFilterMode('online')}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                    filterMode === 'online'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wifi className="w-4 h-4" />
                  Online
                </button>
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                    filterMode === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Todos
                </button>
              </div>
            </div>
          </div>

          {filterMode === 'online' && (
            <div className="p-4 sm:p-6">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12">
                  <WifiOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Nenhum usuario online no momento</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredSessions.map(session => (
                    <div key={session.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-green-200 hover:bg-green-50/30 transition-all">
                      <div className="relative flex-shrink-0">
                        {session.photo_url ? (
                          <img src={session.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                            {(session.employee_name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{session.employee_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {getDeviceType(session.browser_info) === 'mobile' ? (
                            <Smartphone className="w-3 h-3 text-slate-400" />
                          ) : (
                            <Monitor className="w-3 h-3 text-slate-400" />
                          )}
                          <span className="text-[11px] text-slate-400">{getBrowserName(session.browser_info)}</span>
                          <span className="text-[11px] text-slate-300">-</span>
                          <span className="text-[11px] text-green-600 font-medium">{formatRelativeTime(session.last_activity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {filterMode === 'all' && (
            <div className="divide-y divide-slate-50">
              {Object.keys(groupedByDate).length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Nenhum registro encontrado</p>
                </div>
              ) : (
                Object.entries(groupedByDate).map(([date, dateSessions]) => (
                  <div key={date}>
                    <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{date}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({dateSessions.length} {dateSessions.length === 1 ? 'sessao' : 'sessoes'})</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {dateSessions.map(session => {
                        const online = session.is_active && isOnline(session.last_activity);
                        return (
                          <div key={session.id} className="px-4 sm:px-6 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                            <div className="relative flex-shrink-0">
                              {session.photo_url ? (
                                <img src={session.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white font-bold text-xs">
                                  {(session.employee_name || 'U').charAt(0).toUpperCase()}
                                </div>
                              )}
                              {online && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-700 truncate">{session.employee_name}</p>
                                {online && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded">ONLINE</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(session.created_at)} - {formatTime(session.last_activity)}
                                </span>
                                <span className="flex items-center gap-1">
                                  {getDeviceType(session.browser_info) === 'mobile' ? (
                                    <Smartphone className="w-3 h-3" />
                                  ) : (
                                    <Monitor className="w-3 h-3" />
                                  )}
                                  {getBrowserName(session.browser_info)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-medium text-slate-600">{formatDuration(session.created_at, session.last_activity)}</p>
                              <p className={`text-[10px] mt-0.5 font-medium ${online ? 'text-green-600' : session.is_active ? 'text-amber-500' : 'text-slate-400'}`}>
                                {online ? 'Ativo' : session.is_active ? 'Inativo' : 'Encerrado'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
