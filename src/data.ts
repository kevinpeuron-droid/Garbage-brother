import { TrashBin } from './types';

export const mockBins: TrashBin[] = [
  { id: 'bin-1', name: 'Poubelle Scène Glenmor A', lat: 48.2710, lng: -3.5550, status: 'installed', type: '1100l', lastEmptied: new Date().toISOString(), zone: 'Glenmor', count: 1 },
  { id: 'bin-2', name: 'Poubelle Scène Glenmor B', lat: 48.2715, lng: -3.5540, status: 'to_install', type: '1100l', lastEmptied: new Date().toISOString(), zone: 'Glenmor', count: 1 },
  { id: 'bin-3', name: 'Poubelle Food Court 1', lat: 48.2720, lng: -3.5560, status: 'installed', type: '100l_peintes', lastEmptied: new Date(Date.now() - 3600000).toISOString(), zone: 'Restauration', count: 1 },
  { id: 'bin-4', name: 'Poubelle Food Court 2', lat: 48.2722, lng: -3.5565, status: 'overflowing', type: '100l_sans_roue', lastEmptied: new Date(Date.now() - 7200000).toISOString(), zone: 'Restauration', count: 1 },
  { id: 'bin-5', name: 'Poubelle Camping A', lat: 48.2680, lng: -3.5600, status: 'to_remove', type: '300l', lastEmptied: new Date().toISOString(), zone: 'Camping', count: 1 },
  { id: 'bin-6', name: 'Poubelle Camping B', lat: 48.2675, lng: -3.5610, status: 'removed', type: '300l', lastEmptied: new Date(Date.now() - 86400000).toISOString(), zone: 'Camping', count: 1 },
  { id: 'bin-7', name: 'Poubelle Scène Kerouac A', lat: 48.2730, lng: -3.5520, status: 'installed', type: '1100l_point_dechet', lastEmptied: new Date(Date.now() - 1800000).toISOString(), zone: 'Kerouac', count: 1 },
  { id: 'bin-8', name: 'Poubelle VIP', lat: 48.2700, lng: -3.5530, status: 'to_install', type: '100l_peintes', lastEmptied: new Date().toISOString(), zone: 'VIP', count: 1 }
];
