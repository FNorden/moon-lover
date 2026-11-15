/**
 * FLIGHT CALCULATOR & ORBITAL KINEMATICS
 * Modelado matemático para Relojes Gemelos y ángulo solar polar.
 * Core Logic Engine // f_nord
 */

const DISTANCIA_MEDIA_KM = 384400;
const EXCENTRICIDAD_LUNAR = 0.0549;
const PERIODO_ANOMALISTICO_DIAS = 27.55455;
const PERIODO_SINODICO_LUNAR = 29.53059;
const TIEMPO_VUELO_BASE_HORAS = 84;
const EPOCA_PERIGEO_REF_MS = new Date('2026-01-01T00:00:00Z').getTime();

export function estimarDistanciaTierraLuna(fechaUTC) {
  const tiempoDiffMs = fechaUTC.getTime() - EPOCA_PERIGEO_REF_MS;
  const dias = tiempoDiffMs / (1000 * 60 * 60 * 24);
  const M = (2 * Math.PI * (dias % PERIODO_ANOMALISTICO_DIAS)) / PERIODO_ANOMALISTICO_DIAS;
  return Math.round(DISTANCIA_MEDIA_KM * (1 - EXCENTRICIDAD_LUNAR * Math.cos(M)));
}

export function calcularFechaDespegue(fechaAlunizajeUTC) {
  const distanciaKm = estimarDistanciaTierraLuna(fechaAlunizajeUTC);
  const factorEscala = Math.pow(distanciaKm / DISTANCIA_MEDIA_KM, 1.5);
  const horasVuelo = Number((TIEMPO_VUELO_BASE_HORAS * factorEscala).toFixed(2));
  const duracionMs = Math.round(horasVuelo * 3600 * 1000);
  const fechaDespegueUTC = new Date(fechaAlunizajeUTC.getTime() - duracionMs);

  return { fechaDespegueUTC, horasVuelo, distanciaKm };
}

export function calcularPosicionSolar(fechaUTC, site = null) {
  const dias = fechaUTC.getTime() / (1000 * 60 * 60 * 24);
  const anguloAzimut = ((dias % PERIODO_SINODICO_LUNAR) / PERIODO_SINODICO_LUNAR) * Math.PI * 2;
  
  let elevacionGrados;
  const lat = site?.lat ?? -89.9;
  const isPolar = Math.abs(lat) >= 75;

  if (isPolar) {
    // Modelo polar calibrado con insolación del Polo Sur lunar (inclinación axial 1.54° + relieve)
    const polarOffset = (90 - Math.abs(lat)) * 0.22;
    const seasonalTilt = lat < 0 ? 1.54 : -1.54;
    // Elevación rasante con pico nominal entre 1.8° y 3.5° en verano polar
    elevacionGrados = Math.sin(anguloAzimut) * seasonalTilt + polarOffset + 0.6;
  } else {
    // Zonas medias y ecuatoriales (0° a 88°)
    const maxElev = Math.min(88, 90 - Math.abs(lat));
    elevacionGrados = Math.sin(anguloAzimut) * maxElev;
  }
  
  const elevacion = Number(elevacionGrados.toFixed(2));
  return {
    anguloAzimut,
    elevacionGrados: elevacion,
    esNoche: elevacion <= 0
  };
}

export function formatearFechaUTC(fecha) {
  if (!fecha || isNaN(fecha.getTime())) return '--:-- UTC';
  return fecha.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
}