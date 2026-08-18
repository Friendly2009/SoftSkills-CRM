export interface ICreateLeadDto {
  name: string;
  contact: string;
  source?: string;
  description?: string;
  user_id?: number | null;
}

export interface ILead {
  id: number;
  company_id: number;
  user_id: number | null;
  loss_reason_id: number | null;
  name: string;
  contact: string;
  status: 'new' | 'in_progress' | 'trial_scheduled' | 'trial_attended' | 'won' | 'lost';
  source: string | null;
  description: string | null;
  created_at: string;
}