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
    isOpen: boolean;
    x: number;
    y: number;
    client: ClientTemplate | null;
    onClose: () => void;
    onDelete: (client: ClientTemplate) => void;
    onTopUp?: (client: ClientTemplate) => void;
    onEdit?: (client: ClientTemplate) => void;
}

