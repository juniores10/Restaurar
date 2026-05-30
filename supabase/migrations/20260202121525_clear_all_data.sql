/*
  # Limpar Todos os Dados Cadastrados
  
  Esta migração remove todos os dados cadastrados do sistema, mantendo:
  - Estrutura das tabelas (schema)
  - Configurações do sistema (system_settings)
  - Tipos de usuário (user_types)
  - Turnos de trabalho (shift_times)
  - Opções de dia (day_options)
  
  Dados removidos em ordem respeitando foreign keys:
  1. Visualizações e leituras (notice_views, document_reads, document_recipients)
  2. Envios de funcionários (employee_submissions)
  3. Escalas (schedule_entries, schedule_employees, monthly_schedules)
  4. Registros de ponto (time_tracking_uploads, time_records)
  5. Agendamentos (calendar)
  6. Documentos (documents, shared_documents)
  7. Avisos (notices)
  8. Banco de horas e escalas (time_bank, schedules)
  9. Produção e frota (production, fleet)
  10. Sugestões (suggestions)
  11. Feriados (holidays)
  12. Funcionários (employees)
  13. Relatórios e perfis (reports, user_profiles)
  14. Assuntos e tipos de documento (subjects, document_types)
  15. Tipos de dados (data_types)
  16. Localizações e empresas (locations, companies)
  17. Departamentos (departments)
  18. Usuários do auth (auth.users)
*/

-- 1. Limpar visualizações e leituras
DELETE FROM notice_views;
DELETE FROM document_reads;
DELETE FROM document_recipients;

-- 2. Limpar envios de funcionários
DELETE FROM employee_submissions;

-- 3. Limpar escalas
DELETE FROM schedule_entries;
DELETE FROM schedule_employees;
DELETE FROM monthly_schedules;

-- 4. Limpar registros de ponto
DELETE FROM time_records;
DELETE FROM time_tracking_uploads;

-- 5. Limpar agendamentos
DELETE FROM calendar;

-- 6. Limpar documentos
DELETE FROM documents;
DELETE FROM shared_documents;

-- 7. Limpar avisos
DELETE FROM notices;

-- 8. Limpar banco de horas e agendamentos
DELETE FROM time_bank;
DELETE FROM schedules;

-- 9. Limpar produção e frota
DELETE FROM production;
DELETE FROM fleet;

-- 10. Limpar sugestões
DELETE FROM suggestions;

-- 11. Limpar feriados
DELETE FROM holidays;

-- 12. Limpar funcionários
DELETE FROM employees;

-- 13. Limpar relatórios e perfis
DELETE FROM reports;
DELETE FROM user_profiles;

-- 14. Limpar assuntos e tipos de documento
DELETE FROM subjects;
DELETE FROM document_types;

-- 15. Limpar tipos de dados
DELETE FROM data_types;

-- 16. Limpar localizações e empresas
DELETE FROM locations;
DELETE FROM companies;

-- 17. Limpar departamentos
DELETE FROM departments;

-- 18. Limpar usuários do sistema de autenticação
-- IMPORTANTE: Isso remove TODOS os usuários, incluindo administradores
DELETE FROM auth.users;

-- Resetar configurações do sistema (opcional - mantém a tabela mas limpa dados customizados)
-- DELETE FROM system_settings;

-- NOTA: As seguintes tabelas de referência NÃO são limpas pois contêm configurações do sistema:
-- - user_types (tipos de usuário: admin, funcionário, etc)
-- - shift_times (turnos de trabalho)
-- - day_options (opções de dia para escalas)
-- - system_settings (configurações do sistema como logo)
