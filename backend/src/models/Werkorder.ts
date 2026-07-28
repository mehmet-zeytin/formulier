export interface Werkorder {
  id?: number;
  werkorder_id: string;
  aankomsttijd: string;
  eindtijd: string;
  datum: string;
  uitgevoerde_werkzaamheden: string;
  status: 'Voltooid' | 'Niet Voltooid' | 'In Afwachting';
  created_at?: string;
}

export interface Materiaal {
  id?: number;
  werkorder_id: number;
  tip: 'klant' | 'bedrijf' | 'verkoop';
  naam: string;
  aantal: number;
  eenheid?: string;
}

export interface Foto {
  id?: number;
  werkorder_id: number;
  beschrijving?: string;
  bestandspad: string;
  created_at?: string;
}
