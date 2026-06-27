export type BinStatus = 'to_install' | 'installed' | 'overflowing' | 'to_remove' | 'removed' | 'missing';

export type BinType = string;

export interface BinTypeConfig {
  id: BinType;
  label: string;
  color: string;
}

export const defaultBinTypes: BinTypeConfig[] = [
  { id: '100l_peintes', label: '100L Peintes', color: '#60A5FA' }, // Bleu clair
  { id: '100l_sans_roue', label: '100L sans roue', color: '#FBBF24' }, // Jaune
  { id: '300l', label: '300L', color: '#34D399' }, // Vert
  { id: '1100l', label: '1100L', color: '#FB923C' }, // Orange
  { id: '1100l_point_dechet', label: '1100L Point Déchet', color: '#1E3A8A' }, // Bleu foncé
];

export interface TrashBin {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  status: BinStatus;
  type?: BinType;
  lastEmptied: string; // ISO string
  zone: string;
  count?: number;
  urgentPlacement?: boolean;
  urgentRemoval?: boolean;
}

export type EquipmentType = 'tracteur_perso' | 'tracteur_charrue' | 'tracteur_erwan_plateau' | 'autre';

export interface WorkSession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakMinutes?: number; // Pause duration in minutes
  mission: string;
  equipment: EquipmentType;
  customEquipment?: string;
  hourlyRate: number;
}

export const defaultEquipmentRates: Record<EquipmentType, number> = {
  tracteur_perso: 50,
  tracteur_charrue: 60,
  tracteur_erwan_plateau: 70,
  autre: 0,
};

export interface MapShape {
  id: string;
  name: string;
  type: 'polygon' | 'rectangle';
  color: string;
  positions: [number, number][];
}

export interface OverlayImage {
  id: string;
  url: string;
  bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
  opacity: number;
  locked: boolean;
}

