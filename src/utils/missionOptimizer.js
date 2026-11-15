/**
 * ============================================================================
 * MOON LOVER // SMART MISSION OPTIMIZER ENGINE
 * Archivo: src/utils/missionOptimizer.js
 * 
 * Motor de optimización cinemática y selenográfica para calcular la ventana
 * ideal de alunizaje: Cuándo, Desde Dónde y Durante Cuánto Tiempo.
 * ============================================================================
 */

import { calcularPosicionSolar } from './flightCalculator';

export function optimizeMissionWindow({
  lat = -89.9,
  lon = 0.0,
  slopeDeg = 6.0,
  maxSlopeAllowed = 17.5,
  minSunElevRequired = 1.6,
  referenceDate = '2026-11-20T12:00'
}) {
  const isPolar = Math.abs(lat) >= 75;
  const isFarSide = Math.abs(lon) > 90;

  // 1. Cálculo canónico de "CUÁNDO" sincronizado con la física del simulador 3D
  const baseTime = new Date(referenceDate.includes('Z') ? referenceDate : referenceDate + ':00Z').getTime();
  
  let optimalHourOffset = 0;
  let bestSolarScore = -999;

  // Muestreo horario sobre el ciclo sinódico completo (708 horas)
  for (let offsetH = 0; offsetH <= 708; offsetH += 1) {
    const candidateDate = new Date(baseTime + offsetH * 3600 * 1000);
    const { elevacionGrados } = calcularPosicionSolar(candidateDate, { lat, lon });

    let lightingScore = -100;
    if (elevacionGrados >= minSunElevRequired) {
      if (isPolar) {
        // En el polo buscamos la cresta de insolación máxima garantizada
        lightingScore = elevacionGrados * 40;
      } else {
        // En ecuador/mares buscamos la mañana lunar temprana (12° a 25°)
        lightingScore = elevacionGrados <= 35 ? 100 - Math.abs(elevacionGrados - 18) : 60 - elevacionGrados;
      }
    }

    if (lightingScore > bestSolarScore) {
      bestSolarScore = lightingScore;
      optimalHourOffset = offsetH;
    }
  }

  const optimalTouchdownDate = new Date(baseTime + optimalHourOffset * 3600 * 1000);

  // Asegurar que la pendiente de contacto esté calibrada dentro de los márgenes de seguridad
  const safeSlope = Math.min(Number(slopeDeg.toFixed(1)), maxSlopeAllowed);

  // 2. Cálculo de "DESDE DÓNDE" (Puerto terrestre y azimut de lanzamiento)
  let earthSpaceport = {
    nombre: 'Kennedy Space Center (KSC) - Cabo Cañaveral, EE.UU.',
    codigo: 'KSC-LC39B',
    lat: 28.57,
    lon: -80.65,
    azimutLanzamientoDeg: isPolar ? 68.4 : 90.0,
    perfilInyeccion: isPolar ? 'Inyección TLI Polar de Alta Inclinación' : 'Inyección TLI Ecuatorial Coplanar',
    ventajaDeltaV: isPolar ? 'Requiere corrección de plano orbital (Mid-Course Correction)' : 'Aprovecha rotación terrestre máxima (+408 m/s)'
  };

  if (!isPolar && Math.abs(lat) < 20) {
    earthSpaceport = {
      nombre: 'Centro Espacial Guayanés (CSG) - Kourou, Guayana Francesa',
      codigo: 'CSG-ELA4',
      lat: 5.23,
      lon: -52.77,
      azimutLanzamientoDeg: 90.0,
      perfilInyeccion: 'Transferencia Directa Ecuatorial de Mínimo Delta-V',
      ventajaDeltaV: 'Máxima eficiencia gravitacional y orbital coplanar'
    };
  }

  const earthLaunchDate = new Date(optimalTouchdownDate.getTime() - 84.42 * 3600 * 1000);

  // 3. Cálculo de "DURANTE CUÁNTO TIEMPO" (Duración óptima en superficie)
  let optimalDurationDays;
  if (isPolar) {
    // En el polo sur las ventanas de luz continua oscilan entre 6 y 14 días
    optimalDurationDays = slopeDeg > 12 ? 6 : 10;
  } else {
    // En latitudes medias/ecuatoriales el día lunar dura exactamente ~14 días terrestres
    optimalDurationDays = 12; // 12 días útiles antes de la noche lunar
  }

  // 4. Viabilidad DTE (Comunicaciones con la Tierra)
  let dteStatus = {
    isDirect: !isFarSide,
    elevationDeg: isFarSide ? -15.0 : Math.max(0.8, Number((90 - Math.abs(lat) - 10).toFixed(1))),
    mensaje: isFarSide
      ? 'Cara Oculta (Far Side): Sin enlace DTE directo. Requiere satélite repetidor orbital (L2 Halo - Constelación Queqiao / Artemis Gateway).'
      : isPolar
      ? 'Polo Sur: Enlace DTE rasante continuo con libration (~1.2° a 6.0° sobre el horizonte).'
      : 'Ecuatorial / Mares: Enlace DTE de alta elevación casi cenital (Línea de vista directa permanente).'
  };

  // 5. Índice Global de Viabilidad (0 - 100%)
  let viabilityScore = 100;
  if (slopeDeg > maxSlopeAllowed) {
    viabilityScore -= 50;
  } else {
    viabilityScore -= Math.round((slopeDeg / maxSlopeAllowed) * 20);
  }

  if (isFarSide) viabilityScore -= 15; // Penalización por requerir satélite relay
  if (!isPolar && optimalDurationDays > 14) viabilityScore -= 20;

  viabilityScore = Math.max(10, Math.min(99, viabilityScore));

  return {
    optimalTouchdownUTC: optimalTouchdownDate.toISOString().slice(0, 16),
    optimalTouchdownDisplay: optimalTouchdownDate.toUTCString().replace('GMT', 'UTC'),
    earthLaunchDisplay: earthLaunchDate.toUTCString().replace('GMT', 'UTC'),
    earthSpaceport,
    optimalDurationDays,
    safeSlope,
    tliTransitHours: 84.42,
    dteStatus,
    viabilityScore,
    slopeCheck: {
      slopeDeg,
      maxSlopeAllowed,
      isNominal: slopeDeg <= maxSlopeAllowed
    },
    resumenEstrategico: `Ventana óptima calculada para Lat ${lat}° / Lon ${lon}°. Salida recomendada desde ${earthSpaceport.nombre} con arribo en iluminación nominal (${optimalDurationDays} días útiles de operación continua).`
  };
}
