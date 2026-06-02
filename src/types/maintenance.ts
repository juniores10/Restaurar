export type FaultType = string;

export type MaintenanceType = 'Corretiva' | 'Preventiva' | 'Preditiva' | 'Predial';

export const MAINTENANCE_TYPES: MaintenanceType[] = ['Corretiva', 'Preventiva', 'Preditiva', 'Predial'];

export type ProblemOrigin =
  | 'Operação (erro humano/procedimento)'
  | 'Manutenção (execução/instalação)'
  | 'Projeto/Equipamento (defeito/desgaste)';

export type OrderPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type OrderStatus = 'Aberto' | 'Agendado' | 'Em Andamento' | 'Aguardando Peça' | 'Concluído' | 'Cancelado';

export interface MaintenanceOrder {
  id: string;
  order_number: string;
  title: string;
  description: string;
  maintenance_type: MaintenanceType;
  fault_type: FaultType;
  problem_origin: ProblemOrigin;
  priority: OrderPriority;
  status: OrderStatus;
  location: string;
  equipment: string;
  requested_by: string;
  assigned_to: string;
  estimated_downtime_hours: number;
  actual_downtime_hours: number;
  estimated_cost: number;
  actual_cost: number;
  started_at: string | null;
  completed_at: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  scheduled_materials: string[] | null;
  resolution_notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  approval_status: 'pending' | 'approved' | 'rejected' | null;
  approval_action_by: string | null;
  rejection_reason: string | null;
  service_order_data: Record<string, any> | null;
}

export interface MaintenanceComment {
  id: string;
  order_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}


export const PROBLEM_ORIGINS: ProblemOrigin[] = [
  'Operação (erro humano/procedimento)',
  'Manutenção (execução/instalação)',
  'Projeto/Equipamento (defeito/desgaste)',
];

export const ORDER_PRIORITIES: OrderPriority[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

export const ORDER_STATUSES: OrderStatus[] = [
  'Aberto',
  'Agendado',
  'Em Andamento',
  'Aguardando Peça',
  'Concluído',
  'Cancelado',
];
