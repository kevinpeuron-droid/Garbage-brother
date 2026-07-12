export type BinStatus = 'to_install' | 'installed' | 'overflowing' | 'to_remove' | 'removed' | 'missing';

export type BinType = string;

export interface BinCategoryConfig {
  id: string;
  label: string;
  color: string;
}

export const defaultBinCategories: BinCategoryConfig[] = [
  { id: 'cat-omr', label: 'OMR', color: '#3C413A' },
  { id: 'cat-tri', label: 'Tri Sélectif', color: '#FBBF24' },
  { id: 'cat-verre', label: 'Verre', color: '#34D399' },
  { id: 'cat-carton', label: 'Carton', color: '#3B82F6' },
  { id: 'cat-default', label: 'Autre', color: '#916738' },
];

export interface BinTypeConfig {
  id: BinType;
  label: string;
  categoryId?: string;
  color?: string; // Legacy
}

export const defaultBinTypes: BinTypeConfig[] = [
  { id: '4_roues', label: '4 roues', categoryId: 'cat-default', color: '#60A5FA' },
  { id: '2_roues_300l', label: '2 roues 300L', categoryId: 'cat-default', color: '#34D399' },
  { id: '2_roues_150l', label: '2 roues 150L', categoryId: 'cat-default', color: '#FB923C' },
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
  color?: string;
  urgentPlacement?: boolean;
  urgentRemoval?: boolean;
  maintenanceRequired?: boolean;
}

export interface EquipmentConfig {
  id: string;
  label: string;
  hourlyRate: number;
}

export const defaultEquipmentConfigs: EquipmentConfig[] = [
  { id: 'deutz', label: 'Deutz', hourlyRate: 50 },
  { id: 'john_deere', label: 'John Deere', hourlyRate: 55 },
  { id: 'tracteur_charrue', label: 'Tracteur Charrue', hourlyRate: 60 },
  { id: 'telesco_charrue', label: 'Télesco Charrue', hourlyRate: 70 },
];

export interface SecondaryMission {
  equipmentId: string;
  startTime: string;
  endTime: string;
  mission?: string;
}

export interface WorkSession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakMinutes?: number; // Pause duration in minutes
  equipmentId: string; // references EquipmentConfig.id
  mission?: string;
  secondaryMission?: SecondaryMission;
}


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

