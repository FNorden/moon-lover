/**
 * VIABILITY SCORING ENGINE - INTEGRACIÓN NASA LOLA & LROC
 * f_nord // Aerospace Decision Matrix
 */

export function evaluarViabilidadSitio({ sunElevation, earthElevation, topografia, customThresholds }) {
  const SLOPE_MAX = customThresholds?.SLOPE_MAX ?? 12.0;
  const SUN_ELEV_MIN = customThresholds?.SUN_ELEV_MIN ?? 1.2;

  let score = 100;
  const razonesExclusion = [];
  const advertencias = [];

  // 1. PENDIENTE MEDIA (Riesgo de vuelco)
  if (topografia.slopeMedia > SLOPE_MAX) {
    razonesExclusion.push(`Pendiente media (${topografia.slopeMedia}°) supera el umbral seguro (${SLOPE_MAX}°).`);
    score -= 40;
  }

  // 2. ENLACE CON LA TIERRA (Calibrado con LROC Visibility)
  if (earthElevation < topografia.minEarthElevationDTE) {
    razonesExclusion.push(`Pérdida de enlace DTE: Tierra a ${earthElevation.toFixed(1)}° (bloqueada por crestas locales < ${topografia.minEarthElevationDTE}°).`);
    score -= 45;
  }

  // 3. ENERGÍA SOLAR POLAR
  if (sunElevation < SUN_ELEV_MIN) {
    razonesExclusion.push(`Ángulo solar (${sunElevation.toFixed(1)}°) por debajo del mínimo de recarga (${SUN_ELEV_MIN}°).`);
    score -= 40;
  }

  // 4. FACTORES DE RIESGO ADICIONALES (Moon Trek LOLA)
  if (topografia.slopeCriticaCresta > (SLOPE_MAX * 1.5)) {
    advertencias.push(`Crestas periféricas abruptas (${topografia.slopeCriticaCresta}°). Radio seguro limitado a ${topografia.radioSeguroMetros} m.`);
    score -= 10;
  }

  if (topografia.factorRugosidad > 1.2) {
    advertencias.push(`Terreno de alta rugosidad geológica (bloques rocosos).`);
    score -= 5;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let estado = 'GREEN';
  let etiqueta = 'Sitio Operacionalmente Viable';

  if (razonesExclusion.length > 0) {
    estado = 'RED';
    etiqueta = 'No Recomendado (Exclusión)';
  } else if (score < 80 || advertencias.length > 0) {
    estado = 'YELLOW';
    etiqueta = 'Aceptable con Restricciones';
  }

  return {
    score,
    estado,
    etiqueta,
    razonesExclusion,
    advertencias
  };
}