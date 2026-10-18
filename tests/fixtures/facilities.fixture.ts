export const mockFacilities = {
  kelas: {
    id: 'fac-uuid-1',
    nama: 'Kelas TULT 0801',
    lokasi: 'Gedung TULT Lt. 8',
    kategori: 'KELAS' as const,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  lab: {
    id: 'fac-uuid-2',
    nama: 'Lab Komputer IF.01',
    lokasi: 'Gedung Tokong Nanas Lt. 2',
    kategori: 'LABORATORIUM' as const,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  toilet: {
    id: 'fac-uuid-3',
    nama: 'Toilet Pria Utama',
    lokasi: 'Gedung C Lt. 1',
    kategori: 'TOILET' as const,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
};
