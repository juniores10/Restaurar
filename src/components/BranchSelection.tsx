import { useState, useEffect } from 'react';
import { Building2, MapPin, ArrowRight, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, type Branch } from '../contexts/AuthContext';

export function BranchSelection() {
  const { setSelectedBranch, signOut, employeeProfile } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (!loading && branches.length === 1) {
      setSelectedBranch(branches[0]);
    }
  }, [loading, branches]);

  async function loadBranches() {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, legal_name, trade_name')
        .eq('type', 1)
        .eq('status', 0)
        .order('trade_name');

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectBranch(branch: Branch) {
    setSelectedBranch(branch);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
          <p className="text-white mt-4 font-medium text-lg">Carregando filiais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Selecione a Filial</h1>
          <p className="text-slate-400 text-lg">
            Escolha a unidade que deseja acessar
          </p>
          {employeeProfile && (
            <p className="text-slate-500 text-sm mt-2">
              Logado como <span className="text-slate-300">{employeeProfile.full_name}</span>
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => handleSelectBranch(branch)}
              onMouseEnter={() => setHoveredId(branch.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {branch.trade_name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {branch.legal_name}
                  </p>
                </div>
                <div className={`mt-1 transition-all duration-300 ${hoveredId === branch.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                  <ArrowRight className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-300 pointer-events-none" />
            </button>
          ))}
        </div>

        {branches.length === 0 && (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Nenhuma filial encontrada</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair do sistema
          </button>
        </div>
      </div>
    </div>
  );
}