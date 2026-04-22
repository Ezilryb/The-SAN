/**
 * js/data/mock.js
 * ─────────────────────────────────────────────────────────────────
 * Base de données simulée (Mock Data) — source unique de vérité.
 * Pour ajouter / modifier des données, éditer uniquement ce fichier.
 * ─────────────────────────────────────────────────────────────────
 */

export const MOCK = {

  /* ── Entités ───────────────────────────────────────────────────── */
  entities: [
    {
      id: 'P001', type: 'PERSON', name: 'Viktor Sorokin',
      subtitle: 'Oligarque · Citoyen RU/CY', risk: 92, status: 'SURVEILLÉ',
      lat: 51.5074, lng: -0.1278,
      props: {
        Nationalité: 'RU/CY', Âge: '58 ans', Passeports: '3 (RU, CY, MT)',
        Actifs: '$2.4 Md', 'Dernière activité': '2026-04-21', Source: 'SIGINT',
      },
    },
    {
      id: 'P002', type: 'PERSON', name: 'Élise Marchetti',
      subtitle: 'Avocate · Genève CH', risk: 45, status: 'ACTIF',
      lat: 46.2044, lng: 6.1432,
      props: {
        Nationalité: 'IT/CH', Âge: '44 ans', Barreau: 'Genève',
        'Clients enregistrés': '12', 'Dernière activité': '2026-04-22', Source: 'HUMINT',
      },
    },
    {
      id: 'P003', type: 'PERSON', name: 'Khalid Al-Rashidi',
      subtitle: 'Financier · Dubaï / Zurich', risk: 78, status: 'FLAGUÉ',
      lat: 47.3769, lng: 8.5417,
      props: {
        Nationalité: 'AE/SA', Âge: '51 ans', Institutions: '7 banques',
        Actifs: '$890 M', 'Dernière activité': '2026-04-20', Source: 'FININT',
      },
    },
    {
      id: 'P004', type: 'PERSON', name: 'Natasha Volkov',
      subtitle: 'Diplomate · Ambassade UE, Bruxelles', risk: 31, status: 'ACTIF',
      lat: 50.8503, lng: 4.3517,
      props: {
        Nationalité: 'RU', Âge: '39 ans', Accréditation: 'Bruxelles UE',
        'Dernière activité': '2026-04-22', Source: 'OSINT',
      },
    },
    {
      id: 'O001', type: 'ORG', name: 'Meridian Capital SA',
      subtitle: 'Holding financier · Genève, CH', risk: 91, status: 'ENQUÊTE',
      lat: 46.2044, lng: 6.1532,
      props: {
        Pays: 'CH', Fondée: '2019', Capital: '$340 M',
        Actionnaires: '3 anonymes', Transactions: '847', Source: 'FININT',
      },
    },
    {
      id: 'O002', type: 'ORG', name: 'Solstice Ventures BV',
      subtitle: "Fonds d'investissement · Amsterdam, NL", risk: 67, status: 'SURVEILLÉ',
      lat: 52.3676, lng: 4.9041,
      props: {
        Pays: 'NL', Fondée: '2021', Capital: '$120 M',
        Portfolio: '14 entités', Source: 'FININT',
      },
    },
    {
      id: 'O003', type: 'ORG', name: 'Arctos Logistics LLC',
      subtitle: 'Transport maritime · Panama', risk: 83, status: 'FLAGUÉ',
      lat: 8.9936, lng: -79.5197,
      props: {
        Pays: 'PA', Fondée: '2017', Flotte: '9 navires',
        'Routes actives': 'RU→UAE→PK', Source: 'SIGINT',
      },
    },
    {
      id: 'L001', type: 'LOCATION', name: 'Genève Freeport',
      subtitle: 'Zone franche · Genève, CH', risk: 74, status: 'SURVEILLÉ',
      lat: 46.1981, lng: 6.1070,
      props: {
        Pays: 'CH', Superficie: '22 000 m²', 'Valeur stockée': '$100 Md+',
        Accès: 'Restreint', 'Incidents 2026': '3', Source: 'HUMINT',
      },
    },
    {
      id: 'L002', type: 'LOCATION', name: 'Villa Beaulieu',
      subtitle: "Résidence · Côte d'Azur, FR", risk: 55, status: 'ACTIF',
      lat: 43.7102, lng: 7.2620,
      props: {
        Pays: 'FR', Surface: '1 400 m²', Valeur: '€18 M',
        Propriétaire: 'Société écran', Source: 'OSINT',
      },
    },
    {
      id: 'T001', type: 'TRANSACTION', name: 'Wire TXN-4492',
      subtitle: 'Virement · $4.2 M · USD', risk: 96, status: 'BLOQUÉ',
      lat: null, lng: null,
      props: {
        Montant: '$4 200 000', Devise: 'USD', De: 'Meridian Capital SA',
        Vers: 'Solstice Ventures BV', Date: '2026-04-21',
        Banque: 'BCV Genève', SWIFT: 'BCSECHGG', Source: 'FININT',
      },
    },
    {
      id: 'T002', type: 'TRANSACTION', name: 'Wire TXN-4891',
      subtitle: 'Virement · €890 K · EUR', risk: 71, status: 'FLAGUÉ',
      lat: null, lng: null,
      props: {
        Montant: '€890 000', Devise: 'EUR', De: 'Arctos Logistics LLC',
        Vers: 'Propriétaire anonyme', Date: '2026-04-19',
        Banque: 'ABN AMRO Amsterdam', Source: 'FININT',
      },
    },
    {
      id: 'E001', type: 'EVENT', name: 'Réunion Op. Cendrier',
      subtitle: 'Hôtel Beau-Rivage · Genève', risk: 88, status: 'CONFIRMÉ',
      lat: 46.2044, lng: 6.1530,
      props: {
        Date: '2026-04-18', Lieu: 'Genève', 'Participants': '5 identifiés',
        Durée: '4h 20min', Classification: 'CRITIQUE', Source: 'HUMINT',
      },
    },
    {
      id: 'E002', type: 'EVENT', name: 'Transit Arctos — Port Dubaï',
      subtitle: 'Port Rashid · Dubaï, UAE', risk: 62, status: 'SURVEILLÉ',
      lat: 25.2048, lng: 55.2708,
      props: {
        Date: '2026-04-15', Navire: 'MV Boreas Star',
        Cargaison: 'Équipement électronique', Manifeste: 'Incomplet', Source: 'SIGINT',
      },
    },
  ],

  /* ── Liens (connexions) ────────────────────────────────────────── */
  links: [
    { from: 'P001', to: 'O001', type: 'CONTRÔLE',      strength: .95 },
    { from: 'P001', to: 'T001', type: 'INITIÉ',         strength: .90 },
    { from: 'P001', to: 'E001', type: 'A ASSISTÉ',      strength: .85 },
    { from: 'P001', to: 'L002', type: 'POSSÈDE',        strength: .80 },
    { from: 'O001', to: 'T001', type: 'SOURCE',         strength: .95 },
    { from: 'O001', to: 'L001', type: 'UTILISE',        strength: .70 },
    { from: 'O001', to: 'O002', type: 'TRANSFÉRÉ VERS', strength: .90 },
    { from: 'T001', to: 'O002', type: 'REÇU PAR',       strength: .90 },
    { from: 'P002', to: 'P001', type: 'REPRÉSENTE',     strength: .70 },
    { from: 'P002', to: 'O001', type: 'CONSEILLE',      strength: .65 },
    { from: 'P002', to: 'E001', type: 'A ORGANISÉ',     strength: .80 },
    { from: 'P003', to: 'O001', type: 'INVESTIT DANS',  strength: .75 },
    { from: 'P003', to: 'T001', type: 'INTERMÉDIAIRE',  strength: .60 },
    { from: 'P003', to: 'E001', type: 'A ASSISTÉ',      strength: .70 },
    { from: 'O003', to: 'P001', type: 'CONTRÔLÉ PAR',   strength: .80 },
    { from: 'O003', to: 'T002', type: 'SOURCE',         strength: .75 },
    { from: 'O003', to: 'E002', type: 'OPÉRATEUR',      strength: .90 },
    { from: 'P004', to: 'P001', type: 'CONTACTÉ',       strength: .40 },
    { from: 'L001', to: 'O001', type: 'UTILISÉ PAR',    strength: .70 },
    { from: 'E001', to: 'L001', type: 'A EU LIEU À',    strength: .60 },
  ],

  /* ── Alertes actives ───────────────────────────────────────────── */
  alerts: [
    { id: 'A001', severity: 'critical', message: 'TXN-4492 → anomalie réseau blanchiment détectée',       time: 'Il y a 23 min',  entityId: 'T001' },
    { id: 'A002', severity: 'critical', message: 'Sorokin: nouveau passeport maltais détecté (MT)',        time: 'Il y a 1h 12min', entityId: 'P001' },
    { id: 'A003', severity: 'high',     message: 'Nouvelle connexion: Meridian → Solstice Ventures',      time: 'Il y a 2h 45min', entityId: 'O001' },
    { id: 'A004', severity: 'high',     message: 'Arctos Logistics: manifeste de cargaison incomplet',    time: 'Il y a 4h 10min', entityId: 'O003' },
    { id: 'A005', severity: 'medium',   message: 'Al-Rashidi: vol Zurich → Dubaï enregistré',             time: 'Il y a 5h 33min', entityId: 'P003' },
    { id: 'A006', severity: 'medium',   message: "Op. Cendrier: 2 participants non identifiés",           time: 'Il y a 8h 02min', entityId: 'E001' },
  ],

  /* ── Séries temporelles (graphiques) ───────────────────────────── */
  ingestion: {
    labels:  ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'],
    flux:    [1800, 1200, 980, 1100, 2200, 3400, 4100, 3800, 4200, 3900, 3200, 2800],
    alerts:  [8, 5, 3, 4, 7, 12, 18, 21, 23, 19, 14, 11],
  },

  threats: {
    labels:   ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    critical: [3, 5, 2, 7, 4, 2, 6],
    high:     [8, 12, 6, 15, 9, 5, 11],
    medium:   [14, 18, 10, 22, 16, 8, 17],
  },
};
