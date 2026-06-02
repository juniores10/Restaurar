import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Building2, AlertCircle } from 'lucide-react';
import { getSystemSettings } from '../services/systemSettingsService';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const { signIn } = useAuth();

  useEffect(() => {
    loadCompanyLogo();
  }, []);

  const loadCompanyLogo = async () => {
    try {
      const settings = await getSystemSettings();
      if (settings?.company_logo_url) {
        setCompanyLogo(settings.company_logo_url);
      }
    } catch (error) {
      console.error('Error loading company logo:', error);
    }
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError('E-mail ou senha inválidos. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900 px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/30 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-slate-800/50 via-transparent to-transparent"></div>

      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 sm:left-20 w-48 sm:w-72 h-48 sm:h-72 bg-sky-500/20 rounded-full blur-[100px] animate-pulse-soft"></div>
        <div className="absolute bottom-20 right-10 sm:right-20 w-56 sm:w-96 h-56 sm:h-96 bg-slate-600/20 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-5 overflow-hidden">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="Logo"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <Building2 className="w-8 h-8 text-slate-700" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
            Pion G Plus
          </h1>
          <p className="text-sm text-slate-400 font-medium">Sistema de Gestao Empresarial</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  E-mail
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm bg-slate-50 text-slate-900 placeholder-slate-400"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Senha
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm bg-slate-50 text-slate-900 placeholder-slate-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start space-x-2.5 p-3 bg-red-50 border border-red-200 rounded-lg animate-shake">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 focus:ring-2"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-xs font-medium text-slate-600">
                    Lembrar-me
                  </label>
                </div>
                <a href="#" className="text-xs text-sky-600 hover:text-sky-700 font-semibold transition-colors">
                  Esqueceu a senha?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-6 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          </div>

          <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
            <p className="text-[11px] text-center text-slate-400 font-medium">
              Pion G Plus v1.0
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg px-4 py-3 inline-block border border-white/10">
            <p className="text-xs text-slate-400 font-medium mb-1">Credenciais de acesso:</p>
            <p className="text-[11px] text-slate-500 font-mono">
              <span className="font-semibold text-sky-400">Email:</span> admin@piongplus.com<br />
              <span className="font-semibold text-sky-400">Senha:</span> PionGPlus2024!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
