export type WerkorderStatus =
  | 'Voltooid'
  | 'Niet Voltooid'
  | 'In Afwachting';

export interface Werkorder {
  id?: number;

  werkorder_id: string;

  aankomsttijd?:
    | string
    | null;

  eindtijd?:
    | string
    | null;

  datum: string;

  uitgevoerde_werkzaamheden?:
    | string
    | null;

  status?:
    | WerkorderStatus
    | null;

  is_voltooid?: boolean;

  created_by?:
    | number
    | null;

  assigned_to?:
    | number
    | null;

  created_at?: string;
  updated_at?: string;
}

export interface Materiaal {
  id?: number;

  werkorder_id: number;

  tip:
    | 'klant'
    | 'bedrijf'
    | 'verkoop';

  naam: string;

  aantal: number;

  eenheid?: string;
}

export interface Foto {
  id?: number;

  werkorder_id: number;

  beschrijving?:
    | string
    | null;

  bestandspad: string;

  genomen_op: string;

  created_at?: string;
}

export interface AssignmentHistoryItem {
  id: number;

  werkorder_id: number;

  from_user_id:
    | number
    | null;

  from_user_email:
    | string
    | null;

  to_user_id:
    | number
    | null;

  to_user_email: string;

  changed_by:
    | number
    | null;

  changed_by_email:
    | string
    | null;

  reason: string;

  created_at: string;
}