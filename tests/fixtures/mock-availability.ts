export interface TimeSlot {
  start: string;
  end: string;
}

export interface DayAvailability {
  day: number;
  isActive: boolean;
  slots: TimeSlot[];
}

export const defaultAvailability: DayAvailability[] = [
  { day: 1, isActive: true, slots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  { day: 2, isActive: true, slots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  { day: 3, isActive: true, slots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  { day: 4, isActive: true, slots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  { day: 5, isActive: true, slots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  { day: 6, isActive: true, slots: [{ start: '09:00', end: '12:00' }] },
  { day: 0, isActive: false, slots: [] },
];

export const weekendAvailability: DayAvailability[] = [
  { day: 1, isActive: false, slots: [] },
  { day: 2, isActive: false, slots: [] },
  { day: 3, isActive: false, slots: [] },
  { day: 4, isActive: false, slots: [] },
  { day: 5, isActive: false, slots: [] },
  { day: 6, isActive: true, slots: [{ start: '10:00', end: '18:00' }] },
  { day: 0, isActive: true, slots: [{ start: '10:00', end: '18:00' }] },
];

export const fullTimeAvailability: DayAvailability[] = [
  { day: 1, isActive: true, slots: [{ start: '08:00', end: '20:00' }] },
  { day: 2, isActive: true, slots: [{ start: '08:00', end: '20:00' }] },
  { day: 3, isActive: true, slots: [{ start: '08:00', end: '20:00' }] },
  { day: 4, isActive: true, slots: [{ start: '08:00', end: '20:00' }] },
  { day: 5, isActive: true, slots: [{ start: '08:00', end: '20:00' }] },
  { day: 6, isActive: true, slots: [{ start: '08:00', end: '20:00' }] },
  { day: 0, isActive: true, slots: [{ start: '08:00', end: '20:00' }] },
];

export const mockService = {
  name: 'Coupe Homme',
  duration: 30,
  price: 25,
  description: 'Coupe classique homme',
  category: 'coiffure',
};

export const mockServices = [
  { name: 'Coupe Homme', duration: 30, price: 25, description: 'Coupe classique' },
  { name: 'Coupe Femme', duration: 45, price: 45, description: 'Coupe et brushing' },
  { name: 'Coloration', duration: 90, price: 65, description: 'Coloration complète' },
  { name: 'Barbe', duration: 15, price: 15, description: 'Taille de barbe' },
];
