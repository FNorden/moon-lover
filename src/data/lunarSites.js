/**
 * ============================================================================
 * LUNAR SITES REPOSITORY - CATÁLOGO SELENOGRÁFICO EXPANDIDO (NASA / LOLA / LROC)
 * Archivo: src/data/lunarSites.js
 * 
 * Contiene sitios de aterrizaje candidatos Artemis (Polo Sur) y zonas
 * globales históricas y de exploración (Ecuatoriales, Mares y Cara Oculta).
 * ============================================================================
 */

export const LUNAR_SITES = [
  // ==========================================
  // ZONA POLO SUR (Programa Artemis / NASA)
  // ==========================================
  {
    id: 'shackleton',
    nombre: 'Shackleton Crater Rim',
    category: 'polar',
    categoriaNombre: 'Polo Sur (Artemis)',
    lat: -89.9,
    lon: 0.0,
    slopeDeg: 7.2,
    desc: 'Cresta escarpada de insolación cuasi-permanente sobre trampas frías de hielo en sombra perpetua (PSR).',
    topografia: {
      slopeMedia: 7.2,
      slopeMinima: 2.5,
      slopeCriticaCresta: 28.5,
      radioSeguroMetros: 180,
      factorRugosidad: 1.4,
      minEarthElevationDTE: 1.8
    },
    quickmapUrl: 'https://quickmap.lroc.im-ldi.com/',
    moonTrekUrl: 'https://trek.nasa.gov/moon/'
  },
  {
    id: 'malapert',
    nombre: 'Malapert Mountain',
    category: 'polar',
    categoriaNombre: 'Polo Sur (Artemis)',
    lat: -84.9,
    lon: 12.9,
    slopeDeg: 8.5,
    desc: 'Macizo elevado con vista permanente a la Tierra para telecomunicaciones directas (DTE continuo).',
    topografia: {
      slopeMedia: 8.5,
      slopeMinima: 3.8,
      slopeCriticaCresta: 22.0,
      radioSeguroMetros: 350,
      factorRugosidad: 1.1,
      minEarthElevationDTE: 1.2
    },
    quickmapUrl: 'https://quickmap.lroc.im-ldi.com/',
    moonTrekUrl: 'https://trek.nasa.gov/moon/'
  },
  {
    id: 'connecting',
    nombre: 'Connecting Ridge',
    category: 'polar',
    categoriaNombre: 'Polo Sur (Artemis)',
    lat: -89.4,
    lon: 222.0,
    slopeDeg: 9.8,
    desc: 'Cresta estrecha con perfiles topográficos desafiantes, excelente cobertura solar y acceso geológico.',
    topografia: {
      slopeMedia: 9.8,
      slopeMinima: 4.2,
      slopeCriticaCresta: 31.0,
      radioSeguroMetros: 120,
      factorRugosidad: 1.6,
      minEarthElevationDTE: 2.5
    },
    quickmapUrl: 'https://quickmap.lroc.im-ldi.com/',
    moonTrekUrl: 'https://trek.nasa.gov/moon/'
  },
  {
    id: 'nobile',
    nombre: 'Nobile Rim 1',
    category: 'polar',
    categoriaNombre: 'Polo Sur (Artemis)',
    lat: -85.2,
    lon: 36.1,
    slopeDeg: 6.0,
    desc: 'Planicie ondulada de bajo relieve y amplias mesetas, ideal para el descenso seguro del rover VIPER.',
    topografia: {
      slopeMedia: 6.0,
      slopeMinima: 1.8,
      slopeCriticaCresta: 14.5,
      radioSeguroMetros: 600,
      factorRugosidad: 0.8,
      minEarthElevationDTE: 0.9
    },
    quickmapUrl: 'https://quickmap.lroc.im-ldi.com/',
    moonTrekUrl: 'https://trek.nasa.gov/moon/'
  },

  // ==========================================
  // OTRAS ZONAS GLOBALES (Históricas y Mares)
  // ==========================================
  {
    id: 'tranquillitatis',
    nombre: 'Mare Tranquillitatis (Apollo 11)',
    category: 'global',
    categoriaNombre: 'Otras Zonas (Global)',
    lat: 0.67,
    lon: 23.47,
    slopeDeg: 2.4,
    desc: 'Llanura basáltica ecuatorial de baja rugosidad. Primer alunizaje tripulado de la humanidad (1969). Día y noche de 14 días.',
    topografia: {
      slopeMedia: 2.4,
      slopeMinima: 1.1,
      slopeCriticaCresta: 8.0,
      radioSeguroMetros: 1200,
      factorRugosidad: 0.5,
      minEarthElevationDTE: 45.0
    },
    quickmapUrl: 'https://quickmap.lroc.im-ldi.com/',
    moonTrekUrl: 'https://trek.nasa.gov/moon/'
  },
  {
    id: 'procellarum',
    nombre: 'Oceanus Procellarum (Apollo 12)',
    category: 'global',
    categoriaNombre: 'Otras Zonas (Global)',
    lat: -3.01,
    lon: -23.42,
    slopeDeg: 3.1,
    desc: 'El mayor mar lunar ("Océano de las Tormentas"). Alunizaje de precisión junto a la sonda Surveyor 3.',
    topografia: {
      slopeMedia: 3.1,
      slopeMinima: 1.4,
      slopeCriticaCresta: 9.5,
      radioSeguroMetros: 950,
      factorRugosidad: 0.6,
      minEarthElevationDTE: 52.0
    },
    quickmapUrl: 'https://quickmap.lroc.im-ldi.com/',
    moonTrekUrl: 'https://trek.nasa.gov/moon/'
  },
  {
    id: 'taurus_littrow',
    nombre: 'Taurus-Littrow (Apollo 17)',
    category: 'global',
    categoriaNombre: 'Otras Zonas (Global)',
    lat: 20.19,
    lon: 30.77,
    slopeDeg: 8.9,
    desc: 'Valle profundo encajonado entre macizos escarpados del Mare Serenitatis. Zona de muestreo geológico de gran diversidad.',
    topografia: {
      slopeMedia: 8.9,
      slopeMinima: 3.5,
      slopeCriticaCresta: 24.0,
      radioSeguroMetros: 400,
      factorRugosidad: 1.3,
      minEarthElevationDTE: 38.0
    },
    quickmapUrl: 'https://quickmap.lroc.im-ldi.com/',
    moonTrekUrl: 'https://trek.nasa.gov/moon/'
  },
  {
    id: 'tycho',
    nombre: 'Tycho Crater High-Rims',
    category: 'global',
    categoriaNombre: 'Otras Zonas (Global)',
    lat: -43.31,
    lon: -11.36,
    slopeDeg: 16.2,
    desc: 'Cráter de impacto joven con prominente sistema de rayos brillantes. Terreno muy escarpado y de alto desafío cinemático.',
    topografia: {
      slopeMedia: 16.2,
      slopeMinima: 6.8,
      slopeCriticaCresta: 36.0,
      radioSeguroMetros: 150,
      factorRugosidad: 2.1,
      minEarthElevationDTE: 28.0
    },
    quickmapUrl: 'https://quickmap.lroc.im-ldi.com/',
    moonTrekUrl: 'https://trek.nasa.gov/moon/'
  },
  {
    id: 'von_karman',
    nombre: 'Von Kármán Crater (Cara Oculta)',
    category: 'global',
    categoriaNombre: 'Otras Zonas (Global)',
    lat: -45.45,
    lon: 176.05,
    slopeDeg: 5.2,
    desc: 'Cuenca Aitken en la Cara Oculta de la Luna (Chang\'e 4). Línea de vista DTE bloqueada: requiere satélite repetidor orbital (Queqiao).',
    topografia: {
      slopeMedia: 5.2,
      slopeMinima: 2.0,
      slopeCriticaCresta: 16.0,
      radioSeguroMetros: 800,
      factorRugosidad: 0.9,
      minEarthElevationDTE: -10.0 // Oculta respecto a la Tierra
    },
    quickmapUrl: 'https://quickmap.lroc.im-ldi.com/',
    moonTrekUrl: 'https://trek.nasa.gov/moon/'
  }
];

export const SITIO_DEFAULT = LUNAR_SITES[0];
