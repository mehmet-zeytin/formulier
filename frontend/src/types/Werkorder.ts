export interface Materiaal {
  tip: 'klant' | 'bedrijf' | 'verkoop';
  naam: string;
  aantal: number;
  eenheid?: string;
}

export interface WerkorderFormData {
  werkorder_id: string;
  aankomsttijd: string;
  eindtijd: string;
  datum: string;
  uitgevoerde_werkzaamheden: string;
  status: 'Voltooid' | 'Niet Voltooid' | 'In Afwachting' | '';
}