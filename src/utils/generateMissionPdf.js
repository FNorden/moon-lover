/**
 * ============================================================================
 * MOON LOVER // MOTOR DE GENERACIÓN DE REPORTES PDF FORMALES
 * Archivo: src/utils/generateMissionPdf.js
 * 
 * Genera un documento técnico vectorial formal para impresión y descarga
 * sin depender de capturas de pantalla de baja resolución.
 * ============================================================================
 */

import { jsPDF } from 'jspdf';

export function generateMissionPdf({
  selectedSite,
  missionDate,
  missionDurationDays,
  maxSlope,
  minSunElev,
  orbitalSync,
  telemetrySummary
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Paleta de colores aeroespaciales
  const cDark = [10, 15, 29];
  const cCyan = [6, 182, 212];
  const cAmber = [245, 158, 11];
  const cEmerald = [16, 185, 129];
  const cRose = [244, 63, 94];
  const cSlate = [100, 116, 139];
  const cTextDark = [15, 23, 42];

  // 1. Encabezado Táctico
  doc.setFillColor(...cDark);
  doc.rect(margin, 15, contentWidth, 24, 'F');

  // Línea de acento cyan
  doc.setDrawColor(...cCyan);
  doc.setLineWidth(1.2);
  doc.line(margin, 39, margin + contentWidth, 39);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('MOON LOVER // INFORME TÉCNICO DE MISIÓN LUNAR', margin + 6, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('NASA Space Apps Challenge 2026 • Lunar Landing Site Navigator', margin + 6, 30);
  doc.text(`Fecha Emisión: ${new Date().toUTCString()}`, margin + 6, 35);

  let currentY = 47;

  // 2. Dictamen de Viabilidad (Badge Formal)
  const isSlopeNominal = (selectedSite?.slopeDeg || 8.5) <= maxSlope;
  const isPowerNominal = (telemetrySummary?.powerPercentage || 70) >= 65;
  const isCommNominal = telemetrySummary?.commContinuous ?? true;

  let verdictTitle = 'DICTAMEN TÉCNICO: GO FOR TOUCHDOWN (ALUNIZAJE NOMINAL)';
  let verdictColor = cEmerald;
  let verdictDesc = 'El sitio de aterrizaje y la ventana de vuelo cumplen con todos los criterios de estabilidad y sustentación.';

  if (!isSlopeNominal) {
    verdictTitle = 'DICTAMEN TÉCNICO: NO-GO // PENDIENTE CRÍTICA';
    verdictColor = cRose;
    verdictDesc = `La pendiente local de ${selectedSite?.slopeDeg}° excede el límite de vuelco de ${maxSlope}°. Requiere corrección de sitio.`;
  } else if (!isPowerNominal) {
    verdictTitle = 'DICTAMEN TÉCNICO: PRECAUCIÓN // VENTANA SOLAR LIMITADA';
    verdictColor = cAmber;
    verdictDesc = `Ventana solar del ${telemetrySummary?.powerPercentage}% bajo el umbral recomendado del 65%. Requiere reservas secundarias de energía.`;
  }

  doc.setDrawColor(...verdictColor);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...verdictColor);
  doc.text(verdictTitle, margin + 5, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...cTextDark);
  doc.text(verdictDesc, margin + 5, currentY + 13);

  currentY += 26;

  // 3. Ficha Técnica Selenográfica (Sitio y Topografía)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...cDark);
  doc.text('1. PARÁMETROS DEL SITIO SELENOGRÁFICO', margin, currentY);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY + 2, margin + contentWidth, currentY + 2);

  currentY += 7;

  const siteData = [
    ['Sitio Seleccionado:', selectedSite?.nombre || 'Shackleton Crater Rim'],
    ['Región Lunar:', 'Polo Sur Lunar (Artemis III Focus Area)'],
    ['Coordenadas Geodésicas:', `Lat: ${selectedSite?.lat}° | Lon: ${selectedSite?.lon}°`],
    ['Pendiente Topográfica Local:', `${selectedSite?.slopeDeg || 8.5}° (Límite Máximo: ${maxSlope}°)`],
    ['Fuente Cartográfica:', 'NASA Moon Trek & LRO LOLA Laser Altimeter']
  ];

  siteData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...cSlate);
    doc.text(label, margin + 4, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...cTextDark);
    doc.text(value, margin + 65, currentY);

    currentY += 6;
  });

  currentY += 4;

  // 4. Cronograma de Vuelo y Mecánica Orbital TLI
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...cDark);
  doc.text('2. CRONOGRAMA DE VUELO Y TRANSFERENCIA TLI', margin, currentY);

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, currentY + 2, margin + contentWidth, currentY + 2);

  currentY += 7;

  const orbitalData = [
    ['Despegue Terrestre (TLI Ignition):', orbitalSync?.earthLaunchUTC || 'Calculado TLI'],
    ['Tránsito Translunar Estimado:', '84.42 horas (~3.5 días)'],
    ['Alunizaje Programado (Touchdown):', orbitalSync?.touchdownUTC || missionDate],
    ['Duración de la Misión de Superficie:', `${missionDurationDays} días terrestres`],
    ['Distancia Geocéntrica Tierra-Luna:', `${orbitalSync?.distanceKm || '384,400'} km`]
  ];

  orbitalData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...cSlate);
    doc.text(label, margin + 4, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...cTextDark);
    doc.text(value, margin + 65, currentY);

    currentY += 6;
  });

  currentY += 4;

  // 5. Telemetría Ambiental: Energía Solar y Enlace DTE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...cDark);
  doc.text('3. BALANCES AMBIENTALES: INSOLACIÓN Y COMUNICACIONES DTE', margin, currentY);

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, currentY + 2, margin + contentWidth, currentY + 2);

  currentY += 7;

  const envData = [
    ['Umbral Crítico Fotovoltaico:', `${minSunElev}° de elevación sobre el horizonte`],
    ['Ventana Solar Útil en Superficie:', `${telemetrySummary?.powerPercentage || 0}% (${telemetrySummary?.totalPowerHours || 0} horas nominales)`],
    ['Enlace Directo a Tierra (DTE):', isCommNominal ? 'Línea de vista directa continua (Nominal)' : 'Intermitente (Ocultaciones orográficas)'],
    ['Inclinación Eje Lunar Considerada:', '1.54° respecto a la eclíptica'],
    ['Ciclo Sinódico de Referencia:', '708.7 horas (~29.5 días)']
  ];

  envData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...cSlate);
    doc.text(label, margin + 4, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...cTextDark);
    doc.text(value, margin + 65, currentY);

    currentY += 6;
  });

  currentY += 6;

  // 6. Recuadro de Disclaimer Didáctico y Rigor Científico (Obligatorio)
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...cDark);
  doc.text('AVISO DE DIVULGACIÓN CIENTÍFICA Y PROPÓSITO DIDÁCTICO:', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...cSlate);
  const disclaimerText = 'MOON LOVER es una plataforma didáctica y educativa desarrollada para el NASA Space Apps Challenge (Human Exploration). Los cálculos astronómicos, fotométricos, topográficos y orbitales son aproximaciones cinemáticas rigurosas dentro de nuestra capacidad técnica, orientadas al aprendizaje interactivo, la divulgación científica y la experimentación escolar, no para operaciones de vuelo real.';
  
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth - 8);
  doc.text(splitDisclaimer, margin + 4, currentY + 12);

  // Pie de página
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('MOON LOVER // Artemis Navigator Edition • Open Science & Educational Hardware', margin, pageHeight - 10);
  doc.text(`Página 1 de 1`, pageWidth - margin - 15, pageHeight - 10);

  // Descarga del documento
  const fileName = `MOON_LOVER_InformeMision_${selectedSite?.id || 'SouthPole'}_${missionDate.replace(/[:T]/g, '_')}.pdf`;
  doc.save(fileName);
}
