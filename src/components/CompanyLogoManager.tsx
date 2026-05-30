import React, { useState, useEffect } from 'react';
import { Building2, Upload, X, Loader2 } from 'lucide-react';
import { getSystemSettings, uploadCompanyLogo, deleteOldLogo, SystemSettings } from '../services/systemSettingsService';
import { useAuth } from '../contexts/AuthContext';

export default function CompanyLogoManager() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSystemSettings();
      setSettings(data);
      if (data?.company_logo_url) {
        setPreviewUrl(data.company_logo_url);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, selecione uma imagem válida (JPEG, PNG, WebP ou SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    try {
      setUploading(true);

      const oldLogoUrl = settings?.company_logo_url;

      const publicUrl = await uploadCompanyLogo(file, user.id);

      if (oldLogoUrl) {
        await deleteOldLogo(oldLogoUrl);
      }

      setPreviewUrl(publicUrl);
      await loadSettings();
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Erro ao fazer upload da logo. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Logo da Empresa</h3>
            <p className="text-sm text-gray-600">Personalize a logo que aparece na tela de login</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-48 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Company Logo"
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <div className="text-center p-4">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma logo definida</p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center space-y-2">
            <label className="relative cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>{previewUrl ? 'Trocar Logo' : 'Fazer Upload'}</span>
                  </>
                )}
              </div>
            </label>
            <p className="text-xs text-gray-500 text-center">
              Formatos aceitos: JPEG, PNG, WebP, SVG<br />
              Tamanho máximo: 5MB
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Dica:</strong> A logo será exibida na tela de login do sistema.
            Recomendamos usar uma imagem com fundo transparente (PNG) para melhor resultado.
          </p>
        </div>
      </div>
    </div>
  );
}
