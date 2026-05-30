/*
  # Inserir funções de exemplo

  1. Dados inseridos
    - Adiciona registros de funções (type = 4) na tabela data_types
    - Funções são diferentes de cargos - representam a atividade específica do colaborador
*/

INSERT INTO data_types (type, status, description) VALUES
  (4, 0, 'Operador de Empilhadeira'),
  (4, 0, 'Conferente'),
  (4, 0, 'Separador'),
  (4, 0, 'Embalador'),
  (4, 0, 'Motorista'),
  (4, 0, 'Auxiliar Administrativo'),
  (4, 0, 'Recepcionista'),
  (4, 0, 'Analista'),
  (4, 0, 'Coordenador'),
  (4, 0, 'Supervisor')
ON CONFLICT DO NOTHING;