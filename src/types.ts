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
  { id: '100l_peintes', label: '100L Peintes', categoryId: 'cat-default', color: '#60A5FA' },
  { id: '100l_sans_roue', label: '100L sans roue', categoryId: 'cat-default', color: '#FBBF24' },
  { id: '300l', label: '300L', categoryId: 'cat-default', color: '#34D399' },
  { id: '1100l', label: '1100L', categoryId: 'cat-default', color: '#FB923C' },
  { id: '1100l_point_dechet', label: '1100L Point Déchet', categoryId: 'cat-default', color: '#1E3A8A' },
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

