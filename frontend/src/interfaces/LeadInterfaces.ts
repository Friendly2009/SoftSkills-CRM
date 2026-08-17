export interface ICreateLeadDto {
  name: string;
  contact: string;
  source?: string;
  description?: string;
  user_id?: number | null;
}
