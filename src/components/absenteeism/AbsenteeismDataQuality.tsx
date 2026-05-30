import { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  AlertOctagon,
  Info,
} from 'lucide-react';
import type { ParseResult } from '../../types/absenteeism';
import { getParsePreview } from '../../utils/absenteeismParser';

interface AbsenteeismDataQualityProps {
  parseResult: ParseResult;
}

export function AbsenteeismDataQuality({ parseResult }: AbsenteeismDataQualityProps) {
  const preview = useMemo(() => getParsePreview(parseResult), [parseResult]);

  const qualityScore = useMemo(() => {
    const totalItems = preview.totalRecords + parseResult.unparsedLines.length + parseResult.errors.length;
    if (totalItems === 0) return 100;
    return Math.round((preview.totalRecords / totalItems) * 100);
  }, [preview, parseResult]);

  const unknownReasons = useMemo(() => {
    const unknown = new Set<string>();
    for (const employee of parseResult.employees) {
      for (const record of employee.records) {
        if (record.absenceType === 'outros' && record.reason) {
          unknown.add(record.reason);
        }
      }
    }
    return Array.from(unknown);
  }, [parseResult]);

  const missingFields = useMemo(() => {
    const missing: Array<{ employee: string; fields: string[] }> = [];
    for (const employee of parseResult.employees) {
      const fields: string[] = [];
      if (!employee.info.registration) fields.push('Matricula');
      if (!employee.info.team) fields.push('Equipe');
      if (!employee.info.position) fields.push('Cargo');
      if (!employee.info.sector) fields.push('Setor');
      if (fields.length > 0) {
        missing.push({ employee: employee.info.name, fields });
      }
    }
    return missing;
  }, [parseResult]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Score de Qualidade</p>
              <p className="text-3xl font-bold mt-1">
                <span
                  className={
                    qualityScore >= 90
                      ? 'text-green-600'
                      : qualityScore >= 70
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }
                >
                  {qualityScore}%
                </span>
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                qualityScore >= 90
                  ? 'bg-green-100'
                  : qualityScore >= 70
                  ? 'bg-amber-100'
                  : 'bg-red-100'
              }`}
            >
              {qualityScore >= 90 ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : qualityScore >= 70 ? (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Registros Extraidos</p>
              <p className="text-3xl font-bold mt-1 text-green-600">{preview.totalRecords}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Linhas Nao Parseadas</p>
              <p className="text-3xl font-bold mt-1 text-amber-600">
                {parseResult.unparsedLines.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Erros Criticos</p>
              <p className="text-3xl font-bold mt-1 text-red-600">{parseResult.errors.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {parseResult.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Erros Criticos de Processamento</h3>
          </div>
          <div className="space-y-3">
            {parseResult.errors.map((error, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-red-100">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-medium">
                      {error.page > 0 ? `Pagina ${error.page}` : 'Geral'}
                      {error.line ? `, Linha ${error.line}` : ''}
                    </p>
                    <p className="text-red-600 text-sm mt-1">{error.message}</p>
                    {error.rawText && (
                      <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                        {error.rawText}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {parseResult.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">Avisos</h3>
          </div>
          <ul className="space-y-2">
            {parseResult.warnings.map((warning, idx) => (
              <li key={idx} className="flex items-start gap-2 text-amber-700">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {parseResult.unparsedLines.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Linhas Nao Parseadas</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Estas linhas foram identificadas como possiveis registros mas nao puderam ser parseadas
            corretamente. Verifique se o formato do PDF esta correto.
          </p>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-700 w-24">Pagina</th>
                  <th className="text-left p-3 font-semibold text-gray-700 w-24">Linha</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Texto</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {parseResult.unparsedLines.slice(0, 50).map((line, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-gray-50' : ''}`}>
                    <td className="p-3 text-gray-600">{line.page}</td>
                    <td className="p-3 text-gray-600">{line.lineNumber}</td>
                    <td className="p-3">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800 break-all">
                        {line.text}
                      </code>
                    </td>
                    <td className="p-3 text-gray-600 text-sm">{line.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parseResult.unparsedLines.length > 50 && (
              <div className="text-center py-4 text-sm text-gray-500">
                Mostrando 50 de {parseResult.unparsedLines.length} linhas
              </div>
            )}
          </div>
        </div>
      )}

      {unknownReasons.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Motivos Nao Classificados</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Os seguintes motivos foram encontrados mas nao foram automaticamente classificados.
            Eles estao marcados como "Outros" e computados como absenteismo.
          </p>
          <div className="flex flex-wrap gap-2">
            {unknownReasons.map((reason, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-700"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {missingFields.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Campos Ausentes</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Alguns colaboradores tem campos importantes ausentes. Isso pode afetar a analise por equipe/cargo.
          </p>
          <div className="overflow-x-auto max-h-60">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-700">Colaborador</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Campos Ausentes</th>
                </tr>
              </thead>
              <tbody>
                {missingFields.slice(0, 30).map((item, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-gray-50' : ''}`}>
                    <td className="p-3 font-medium text-gray-900">{item.employee}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {item.fields.map(field => (
                          <span
                            key={field}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {missingFields.length > 30 && (
              <div className="text-center py-4 text-sm text-gray-500">
                Mostrando 30 de {missingFields.length} colaboradores
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">Sobre o Parser Pontomais</h3>
        </div>
        <div className="prose prose-sm text-blue-700">
          <p>O parser tenta extrair os seguintes dados de cada pagina do PDF:</p>
          <ul className="mt-2 space-y-1">
            <li>Nome, CPF, Matricula, Cargo e Equipe do colaborador</li>
            <li>Periodo do espelho (data inicio e fim)</li>
            <li>Registros diarios com: data, horas previstas, horas trabalhadas, horas faltantes</li>
            <li>Motivo/justificativa de ausencias</li>
          </ul>
          <p className="mt-3">
            <strong>Classificacao automatica de motivos:</strong>
          </p>
          <ul className="mt-1 space-y-1">
            <li><span className="font-medium text-green-700">Saude:</span> Atestado, declaracao medica, consulta, doenca, licenca medica</li>
            <li><span className="font-medium text-red-700">Injustificada:</span> Falta sem justificativa, ausencia</li>
            <li><span className="font-medium text-amber-700">Atraso:</span> Atraso, chegada tardia</li>
            <li><span className="font-medium text-gray-500">Nao computavel:</span> Ferias, folga, feriado, compensacao</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
