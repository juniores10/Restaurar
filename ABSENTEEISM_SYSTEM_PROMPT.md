# SISTEMA DE ANÁLISE DE ABSENTEÍSMO - ESPECIFICAÇÃO COMPLETA

## VISÃO GERAL

Sistema completo de análise de absenteísmo que permite:
- Upload de arquivos PDF (espelhos de ponto)
- Parsing automático e inteligente dos dados
- Análise detalhada com múltiplas métricas
- Dashboards executivos e analíticos
- Filtros avançados e visualizações interativas
- Detecção de alertas e padrões

## 1. ESTRUTURA DO BANCO DE DADOS

### Migration SQL

```sql
/*
  # Create Absenteeism Tracking System

  1. New Tables
    - `absenteeism_uploads` - Tracks uploaded files for absenteeism analysis
      - `id` (uuid, primary key)
      - `uploaded_by` (uuid, references employees)
      - `file_name` (text)
      - `period_start` (date)
      - `period_end` (date)
      - `status` (text)
      - `records_count` (integer)
      - `created_at` (timestamptz)

    - `absenteeism_records` - Individual absence records
      - `id` (uuid, primary key)
      - `upload_id` (uuid, references absenteeism_uploads)
      - `employee_name` (text)
      - `employee_id_external` (text)
      - `sector` (text)
      - `unit` (text)
      - `position` (text)
      - `team` (text)
      - `shift` (text)
      - `record_date` (date)
      - `absence_type` (text) - saude, injustificada, atraso, saida_antecipada, licenca, ferias, folga, feriado, compensacao
      - `status` (text) - computavel, nao_computavel
      - `expected_hours` (numeric)
      - `absent_hours` (numeric)
      - `worked_hours` (numeric)
      - `overtime_hours` (numeric)
      - `reason` (text)
      - `hourly_cost` (numeric)
      - `raw_data` (jsonb)
      - `created_at` (timestamptz)

    - `absenteeism_settings` - Configuration for absenteeism analysis
      - `id` (uuid, primary key)
      - `setting_key` (text, unique)
      - `setting_value` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated admin/manager access
*/

-- Create absenteeism_uploads table
CREATE TABLE IF NOT EXISTS absenteeism_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  period_start date,
  period_end date,
  status text DEFAULT 'processing',
  records_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create absenteeism_records table
CREATE TABLE IF NOT EXISTS absenteeism_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid REFERENCES absenteeism_uploads(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  employee_id_external text,
  sector text,
  unit text,
  position text,
  team text,
  shift text,
  record_date date NOT NULL,
  absence_type text NOT NULL,
  status text DEFAULT 'nao_justificada',
  expected_hours numeric(10,2) DEFAULT 0,
  absent_hours numeric(10,2) DEFAULT 0,
  worked_hours numeric(10,2) DEFAULT 0,
  overtime_hours numeric(10,2) DEFAULT 0,
  reason text,
  hourly_cost numeric(10,2),
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create absenteeism_settings table
CREATE TABLE IF NOT EXISTS absenteeism_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_absenteeism_records_upload_id ON absenteeism_records(upload_id);
CREATE INDEX IF NOT EXISTS idx_absenteeism_records_date ON absenteeism_records(record_date);
CREATE INDEX IF NOT EXISTS idx_absenteeism_records_employee ON absenteeism_records(employee_name);
CREATE INDEX IF NOT EXISTS idx_absenteeism_records_type ON absenteeism_records(absence_type);
CREATE INDEX IF NOT EXISTS idx_absenteeism_records_sector ON absenteeism_records(sector);
CREATE INDEX IF NOT EXISTS idx_absenteeism_records_unit ON absenteeism_records(unit);

-- Enable RLS
ALTER TABLE absenteeism_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE absenteeism_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE absenteeism_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for absenteeism_uploads
CREATE POLICY "Admins and managers can view absenteeism uploads"
  ON absenteeism_uploads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "Admins and managers can insert absenteeism uploads"
  ON absenteeism_uploads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "Admins and managers can update absenteeism uploads"
  ON absenteeism_uploads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "Admins and managers can delete absenteeism uploads"
  ON absenteeism_uploads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

-- RLS Policies for absenteeism_records
CREATE POLICY "Admins and managers can view absenteeism records"
  ON absenteeism_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "Admins and managers can insert absenteeism records"
  ON absenteeism_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "Admins and managers can update absenteeism records"
  ON absenteeism_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "Admins and managers can delete absenteeism records"
  ON absenteeism_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

-- RLS Policies for absenteeism_settings
CREATE POLICY "Admins can view absenteeism settings"
  ON absenteeism_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
  );

CREATE POLICY "Admins can manage absenteeism settings"
  ON absenteeism_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
  );

-- Insert default settings
INSERT INTO absenteeism_settings (setting_key, setting_value) VALUES
  ('recurrence_threshold', '{"value": 3, "period_days": 30}'),
  ('target_absenteeism_rate', '{"value": 3.0}'),
  ('default_hourly_cost', '{"value": 25.0}'),
  ('absence_types', '{"types": ["falta", "atestado", "atraso", "saida_antecipada", "licenca", "ferias", "folga", "feriado", "compensacao"]}')
ON CONFLICT (setting_key) DO NOTHING;
```

## 2. TIPOS TYPESCRIPT

Criar arquivo `src/types/absenteeism.ts`:

```typescript
export interface EmployeeInfo {
  name: string;
  cpf?: string;
  registration?: string;
  position?: string;
  team?: string;
  sector?: string;
  unit?: string;
  shift?: string;
}

export interface DailyRecord {
  date: Date;
  dayOfWeek: string;
  expectedHours: number;
  workedHours: number;
  absentHours: number;
  normalHours: number;
  overtimeHours: number;
  reason?: string;
  observation?: string;
  absenceType: AbsenceType;
  isComputable: boolean;
}

export type AbsenceType =
  | 'saude'
  | 'injustificada'
  | 'atraso'
  | 'ferias'
  | 'folga'
  | 'feriado'
  | 'compensacao'
  | 'licenca'
  | 'normal'
  | 'outros';

export interface ParsedEmployee {
  info: EmployeeInfo;
  periodStart: Date;
  periodEnd: Date;
  records: DailyRecord[];
}

export interface ParseResult {
  success: boolean;
  employees: ParsedEmployee[];
  errors: ParseError[];
  warnings: string[];
  unparsedLines: UnparsedLine[];
}

export interface ParseError {
  page: number;
  line?: number;
  message: string;
  rawText?: string;
}

export interface UnparsedLine {
  page: number;
  lineNumber: number;
  text: string;
  reason: string;
}

export interface AbsenteeismMetrics {
  totalAbsentHours: number;
  totalExpectedHours: number;
  absenteeismRate: number;
  frequency: number;
  severity: number;
  byType: Record<AbsenceType, { hours: number; count: number }>;
  injustifiedPercentage: number;
  healthPercentage: number;
  delayPercentage: number;
  computableHours: number;
  nonComputableHours: number;
}

export interface TeamMetrics {
  team: string;
  metrics: AbsenteeismMetrics;
  employeeCount: number;
}

export interface EmployeeMetrics {
  employee: EmployeeInfo;
  metrics: AbsenteeismMetrics;
  eventCount: number;
  isRecurrent: boolean;
}

export interface TrendData {
  period: string;
  absenteeismRate: number;
  absentHours: number;
  frequency: number;
}

export interface HeatmapData {
  team: string;
  dayOfWeek: number;
  value: number;
}

export interface AbsenteeismFilter {
  dateStart?: Date;
  dateEnd?: Date;
  teams?: string[];
  positions?: string[];
  employees?: string[];
  absenceTypes?: AbsenceType[];
  isComputable?: boolean;
  sectors?: string[];
  units?: string[];
}

export interface AbsenteeismUpload {
  id: string;
  uploaded_by: string;
  file_name: string;
  period_start: string;
  period_end: string;
  status: string;
  records_count: number;
  error_message?: string;
  created_at: string;
}

export interface AbsenteeismRecord {
  id: string;
  upload_id: string;
  employee_name: string;
  employee_id_external?: string;
  sector?: string;
  unit?: string;
  position?: string;
  team?: string;
  shift?: string;
  record_date: string;
  absence_type: string;
  status: string;
  expected_hours: number;
  absent_hours: number;
  worked_hours: number;
  overtime_hours: number;
  reason?: string;
  hourly_cost?: number;
  raw_data?: Record<string, unknown>;
  created_at: string;
}
```

## 3. CARACTERÍSTICAS PRINCIPAIS

### Parser Inteligente de PDF
- Extração automática de texto de PDFs de espelhos de ponto
- Reconhecimento de múltiplos formatos
- Identificação automática de colaboradores e períodos
- Classificação inteligente de motivos de ausência
- Mapeamento automático de tipos (atestado → saúde, falta → injustificada, etc.)
- Detecção de horas normais, extras, faltantes e ausentes
- Tratamento de múltiplos colaboradores em um único PDF

### Sistema de Classificação
**Tipos de Ausência:**
- `saude` - Atestados, declarações médicas, consultas
- `injustificada` - Faltas sem justificativa
- `atraso` - Chegadas tardias
- `ferias` - Período de férias
- `folga` - DSR, folgas
- `feriado` - Feriados nacionais/locais
- `compensacao` - Banco de horas, abonos
- `licenca` - Licenças diversas (paternidade, maternidade, etc.)
- `normal` - Dia normal de trabalho
- `outros` - Outros motivos não classificados

**Computabilidade:**
- Ausências computáveis: contam para o índice de absenteísmo (saúde, injustificada, atraso, licença, outros)
- Ausências não computáveis: não contam para o índice (férias, folga, feriado, compensação)

### Métricas Calculadas

**Métricas Gerais:**
- Taxa de absenteísmo (%)
- Total de horas ausentes
- Total de horas previstas
- Frequência de eventos
- Gravidade média por evento
- Horas computáveis vs não computáveis

**Análises por Tipo:**
- Percentual de faltas injustificadas
- Percentual de ausências por saúde
- Percentual de atrasos
- Distribuição de horas por tipo

**Análises por Equipe:**
- Taxa de absenteísmo por equipe
- Ranking de equipes
- Comparação com média geral
- Número de colaboradores por equipe

**Análises por Colaborador:**
- Taxa individual de absenteísmo
- Identificação de recorrência
- Histórico de ausências
- Comparação com média da equipe

**Análises Temporais:**
- Tendências semanais/mensais
- Padrões por dia da semana
- Evolução ao longo do tempo
- Sazonalidade

### Sistema de Alertas Inteligentes
- Taxa acima da meta configurada
- Equipes com taxa muito acima da média
- Alto percentual de faltas injustificadas
- Alta gravidade média (ausências prolongadas)
- Aumentos súbitos na última semana
- Mudanças significativas vs período anterior
- Equipes que necessitam atenção urgente
- Predominância de ausências por saúde (> 60%)

### Filtros Avançados
**Filtros Básicos:**
- Colaborador específico
- Equipe
- Setor

**Filtros Avançados:**
- Cargo
- Data início/fim
- Computabilidade
- Unidade

**Filtros Rápidos por Motivo:**
- Faltas
- Atestados
- Atrasos
- Licenças
- Outros

### Visualizações
1. **Visão Executiva:**
   - Cards com métricas principais
   - Gráfico de tendência temporal
   - Ranking de equipes
   - Top colaboradores com mais ausências
   - Distribuição por tipo de ausência (Pareto)
   - Alertas críticos

2. **Análise Detalhada:**
   - Mapa de calor (equipe x dia da semana)
   - Tabela detalhada de colaboradores
   - Drill-down em dados individuais
   - Exportação para CSV
   - Análise de recorrência

## 4. DEPENDÊNCIAS NECESSÁRIAS

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",
    "pdfjs-dist": "^5.4.624",
    "recharts": "^3.7.0",
    "lucide-react": "^0.344.0"
  }
}
```

## 5. INSTRUÇÕES DE IMPLEMENTAÇÃO

### Passo 1: Database
1. Aplique a migration SQL no Supabase
2. Verifique se as policies RLS foram criadas corretamente
3. Confirme os índices para performance

### Passo 2: Types
1. Crie o arquivo de tipos TypeScript
2. Importe nos componentes que precisam

### Passo 3: Utils
1. Crie `src/utils/absenteeismParser.ts` com a lógica de parsing de PDF
2. Crie `src/utils/absenteeismMetrics.ts` com as funções de cálculo de métricas

### Passo 4: Componentes
1. `AbsenteeismDashboard.tsx` - Componente principal com filtros e tabs
2. `AbsenteeismExecutive.tsx` - Visão executiva com cards e gráficos
3. `AbsenteeismAnalysis.tsx` - Análise detalhada com tabelas
4. `FilterDropdown.tsx` - Dropdown multi-select para filtros
5. `AbsenteeismDataQuality.tsx` - Tela de upload e qualidade de dados

### Passo 5: Integração
1. Adicione rota no sistema principal
2. Configure permissões (apenas Admin/Gerente)
3. Teste upload de PDFs
4. Valide cálculos de métricas

## 6. FUNCIONALIDADES ADICIONAIS RECOMENDADAS

### Exportação de Relatórios
- Exportar dados filtrados para CSV
- Gerar relatórios em PDF
- Enviar relatórios por email

### Configurações
- Meta de absenteísmo por equipe
- Custo horário por cargo
- Threshold de recorrência
- Tipos personalizados de ausência

### Notificações
- Alertas quando taxa ultrapassar meta
- Notificação de colaboradores recorrentes
- Relatórios automáticos semanais/mensais

### Integrações
- Importação automática de sistemas de ponto
- Sincronização com folha de pagamento
- API para outros sistemas

## 7. CARACTERÍSTICAS TÉCNICAS

### Performance
- Índices otimizados para queries frequentes
- Caching de métricas calculadas
- Lazy loading de dados grandes
- Virtualização de listas longas

### Segurança
- RLS rigoroso (apenas Admin/Gerente)
- Validação de dados no backend
- Sanitização de inputs
- Proteção contra SQL injection

### UX/UI
- Filtros intuitivos com tags visuais
- Feedback visual de ações
- Loading states apropriados
- Responsivo (mobile-first)
- Cores consistentes por tipo de ausência
- Tooltips explicativos

### Escalabilidade
- Estrutura preparada para milhares de registros
- Paginação automática
- Agregações eficientes no banco
- Cache de queries pesadas

## 8. FÓRMULAS DE CÁLCULO

### Taxa de Absenteísmo
```
Taxa (%) = (Horas Computáveis Ausentes / Horas Totais Previstas) × 100
```

### Frequência
```
Frequência = Número de eventos computáveis no período
```

### Gravidade
```
Gravidade = Horas Computáveis Ausentes / Frequência
```

### Percentual por Tipo
```
% Tipo = (Eventos do Tipo / Total de Eventos Computáveis) × 100
```

## 9. BOAS PRÁTICAS

1. **Sempre use filtros para análises específicas** - O sistema foi projetado para análises focadas
2. **Compare períodos similares** - Evite comparar períodos muito diferentes (ex: 1 semana vs 1 mês)
3. **Atenção à computabilidade** - Nem toda ausência conta para o absenteísmo
4. **Analise tendências, não pontos isolados** - Um dia ruim não é padrão
5. **Combine métricas** - Taxa alta + frequência baixa = poucos eventos graves
6. **Use alertas como guia** - O sistema detecta padrões anormais automaticamente
7. **Valide dados importados** - Sempre revise a qualidade dos dados após importação

## 10. TROUBLESHOOTING

### PDFs não são parseados corretamente
- Verifique o formato do PDF (deve ser texto, não imagem)
- Confirme se o layout é similar aos esperados
- Ajuste os regex de extração no parser

### Métricas incorretas
- Valide dados na tabela `absenteeism_records`
- Confirme classificação dos tipos
- Verifique se `isComputable` está correto

### Performance lenta
- Adicione índices nas colunas filtradas
- Use filtros de data para reduzir dataset
- Considere agregações pre-calculadas

### Permissões negadas
- Confirme RLS policies
- Verifique se usuário é Admin/Gerente
- Teste com usuário diferente

---

## PROMPT PARA IA

"Crie um sistema completo de análise de absenteísmo com as seguintes características:

1. **Database**: 3 tabelas (absenteeism_uploads, absenteeism_records, absenteeism_settings) com RLS policies restritivas para Admin/Gerente

2. **Parser Inteligente de PDF**: Extrai dados de espelhos de ponto, identifica colaboradores, datas, horas trabalhadas/ausentes, motivos de ausência. Classifica automaticamente em 10 tipos (saúde, injustificada, atraso, férias, folga, feriado, compensação, licença, normal, outros).

3. **Sistema de Computabilidade**: Apenas saúde, injustificada, atraso, licença e outros contam para índice de absenteísmo. Férias, folgas e feriados não contam.

4. **Métricas Completas**:
   - Taxa de absenteísmo (%)
   - Frequência e gravidade
   - Análises por equipe, colaborador, tipo
   - Tendências temporais
   - Percentuais por categoria

5. **Sistema de Alertas**: Detecta automaticamente:
   - Taxa acima da meta
   - Equipes críticas
   - Faltas injustificadas em excesso
   - Aumentos súbitos
   - Padrões anormais

6. **Filtros Avançados**:
   - Básicos: colaborador, equipe, setor
   - Avançados: cargo, datas, computabilidade
   - Rápidos: por tipo de ausência com botões coloridos

7. **Dashboards**:
   - Visão Executiva: cards de KPIs, gráficos de tendência, ranking de equipes, Pareto de motivos
   - Análise Detalhada: heatmap dia/equipe, tabela de colaboradores, drill-down, exportação CSV

8. **UX Premium**:
   - Design limpo e profissional
   - Cores consistentes por tipo
   - Tags visuais de filtros ativos
   - Feedback em todas as ações
   - Responsivo

Implemente com TypeScript, React, Tailwind CSS, Recharts para gráficos, pdfjs-dist para parsing, e Supabase para backend."
