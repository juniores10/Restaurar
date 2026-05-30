import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Building2, AlertCircle, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-pion-deep-blue px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pion-cyan/20 via-transparent to-transparent animate-pulse-soft"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pion-deep-blue/30 via-transparent to-transparent"></div>

      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 sm:left-20 w-48 sm:w-72 h-48 sm:h-72 bg-pion-cyan/20 rounded-full blur-3xl animate-pulse-soft"></div>
        <div className="absolute bottom-20 right-10 sm:right-20 w-56 sm:w-96 h-56 sm:h-96 bg-pion-deep-blue/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-2xl mb-6 overflow-hidden transform hover:scale-105 transition-transform duration-300">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="Pion G Plus Logo"
                className="w-full h-full object-contain p-3"
              />
            ) : (
              <Building2 className="w-12 h-12 text-pion-deep-blue" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
            Pion G Plus
          </h1>
          <div className="flex items-center justify-center gap-2 text-pion-cyan">
            <Sparkles className="w-5 h-5" />
            <p className="text-sm sm:text-base md:text-lg font-medium">Sistema de Gestão Empresarial</p>
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="px-5 py-6 sm:px-8 sm:py-10">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-pion-dark mb-2.5">
                  E-mail
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-pion-cyan" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pion-cyan focus:border-pion-cyan transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-pion-dark mb-2.5">
                  Senha
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-pion-cyan" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pion-cyan focus:border-pion-cyan transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl animate-shake">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-pion-cyan bg-gray-100 border-gray-300 rounded focus:ring-pion-cyan focus:ring-2"
                  />
                  <label htmlFor="rememberMe" className="ml-2.5 text-sm font-medium text-gray-700">
                    Lembrar-me
                  </label>
                </div>
                <a href="#" className="text-sm text-pion-deep-blue hover:text-pion-cyan font-semibold transition-colors">
                  Esqueceu a senha?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 sm:py-4 px-6 btn-pion text-white rounded-xl font-bold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  'Entrar no Sistema'
                )}
              </button>
            </form>
          </div>

          <div className="bg-gradient-to-r from-pion-deep-blue/5 to-pion-cyan/5 px-5 sm:px-8 py-4 sm:py-5 border-t border-gray-100">
            <p className="text-xs text-center text-gray-600 font-medium">
              Pion G Plus v1.0 - Powered by Pion G Technologies
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 sm:px-6 py-3 sm:py-4 inline-block border border-white/20">
            <p className="text-sm text-white/90 font-semibold mb-2">Credenciais de acesso:</p>
            <p className="text-xs text-white/80 font-mono">
              <span className="font-bold text-pion-cyan">Email:</span> admin@piongplus.com<br />
              <span className="font-bold text-pion-cyan">Senha:</span> PionGPlus2024!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
