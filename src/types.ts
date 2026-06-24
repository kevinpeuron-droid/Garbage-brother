export type BinStatus = 'to_install' | 'installed' | 'overflowing' | 'to_remove' | 'removed';

export type BinType = '100l_peintes' | '100l_sans_roue' | '300l' | '1100l' | '1100l_point_dechet';

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
}

export interface MapShape {
  id: string;
  name: string;
  type: 'polygon' | 'rectangle';
  color: string;
  positions: [number, number][];
}

