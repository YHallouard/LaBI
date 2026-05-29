// Fake data for the Héméa demo. Mirrors the lab markers used in the real app.

const HEMEA_ANALYSES = [
  {
    id: 'a1', date: '12 mars 2024', dateShort: '12/03/24', timestamp: 1710201600000,
    crp: 3.4, hemoglobine: 14.2, cholesterol: 1.85, tsh: 2.1,
    alert: false,
  },
  {
    id: 'a2', date: '08 janvier 2024', dateShort: '08/01/24', timestamp: 1704672000000,
    crp: 12.8, hemoglobine: 13.8, cholesterol: 2.41, tsh: 3.2,
    alert: true,
  },
  {
    id: 'a3', date: '14 octobre 2023', dateShort: '14/10/23', timestamp: 1697241600000,
    crp: 2.1, hemoglobine: 14.5, cholesterol: 1.92, tsh: 2.4,
    alert: false,
  },
  {
    id: 'a4', date: '20 juin 2023', dateShort: '20/06/23', timestamp: 1687219200000,
    crp: 1.5, hemoglobine: 14.7, cholesterol: 1.78, tsh: 2.0,
    alert: false,
  },
  {
    id: 'a5', date: '03 février 2023', dateShort: '03/02/23', timestamp: 1675382400000,
    crp: 4.2, hemoglobine: 14.0, cholesterol: 1.95, tsh: 1.9,
    alert: false,
  },
];

const HEMEA_CATEGORIES = [
  { id: 'hema', name: 'Hématologie',
    markers: [{ key: 'hemoglobine', label: 'Hémoglobine', unit: 'g/dL', refMin: 12.0, refMax: 16.0 }] },
  { id: 'bio', name: 'Biochimie',
    markers: [{ key: 'crp', label: 'Proteine C Réactive', unit: 'mg/L', refMin: 0, refMax: 5 }] },
  { id: 'lipids', name: 'Lipides',
    markers: [{ key: 'cholesterol', label: 'Cholestérol total', unit: 'g/L', refMin: 1.4, refMax: 2.0 }] },
  { id: 'thyro', name: 'TSH',
    markers: [{ key: 'tsh', label: 'TSH', unit: 'mUI/L', refMin: 0.4, refMax: 4.0 }] },
];

window.HEMEA_ANALYSES = HEMEA_ANALYSES;
window.HEMEA_CATEGORIES = HEMEA_CATEGORIES;
