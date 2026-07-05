const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

code = code.replace(
`export type BinType = string;

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
];`,
`export type BinType = string;

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
];`
);

fs.writeFileSync('src/types.ts', code);
