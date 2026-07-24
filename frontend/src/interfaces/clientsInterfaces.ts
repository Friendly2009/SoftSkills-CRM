export interface ClientTemplate {
  id: number;
  name: string;
  balance: number;
  skills: number;
  status: number;
  contact: string;
  group_ids: number[];
  group_names: string[];
  next_visit: string;
}
export interface MoreActionProps {
    x: number;
    y: number;
    isOpen: boolean;
    client: ClientTemplate;
    onDelete: (client: ClientTemplate) => void;
    onClose: () => void;     
}