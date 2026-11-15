/**
 * ============================================================================
 * MOON LOVER // MISSION TECHNICAL REPORT MODAL
 * Archivo: src/components/MissionReportModal.jsx
 * 
 * Cuadro flotante táctico para revisión previa de viabilidad técnica
 * antes de la emisión del documento PDF formal.
 * ============================================================================
 */

import {
  FileText,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Compass,
  Clock,
  Info
} from 'lucide-react';
import { generateMissionPdf } from '../utils/generateMissionPdf';

export default function MissionReportModal({
  isOpen,
  onClose,
  selectedSite,
  missionDate,
  missionDurationDays,
  maxSlope,
  minSunElev,
  orbitalSync,
  telemetrySummary
}) {
  if (!isOpen) return null;

  const currentSlope = selectedSite?.slopeDeg || 8.5;
  const isSlopeNominal = currentSlope <= maxSlope;
  const isPowerNominal = (telemetrySummary?.powerPercentage || 0) >= 65;
  const isCommNominal = telemetrySummary?.commContinuous ?? true;
  const isMissionGo = isSlopeNominal && isPowerNominal && isCommNominal;

  const handleDownloadPdf = () => {
    generateMissionPdf({
      selectedSite,
      missionDate,
      missionDurationDays,
      maxSlope,
      minSunElev,
      orbitalSync,
      telemetrySummary
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#090e1a] border border-cyan-500/30 rounded-2xl max-w-3xl w-full p-6 font-mono text-slate-200 shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Cabecera del Cuadro Flotante */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                Dictamen Técnico y Auditoría de Misión
              </h2>
              <span className="text-[10px] text-slate-400 font-sans block">
                MOON LOVER // NASA Space Apps Challenge • Human Exploration
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Modal con Desplazamiento */}
        <div className="overflow-y-auto py-4 space-y-4 pr-1 text-xs">
          
          {/* Banner de Dictamen Global */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isMissionGo
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : !isSlopeNominal
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                : 'bg-amber-950/40 border-amber-500/50 text-amber-300'
            }`}
          >
            {isMissionGo ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold uppercase tracking-wider block text-[11px]">
                {isMissionGo
                  ? 'DICTAMEN FORMAL: GO FOR TOUCHDOWN (ALUNIZAJE NOMINAL)'
                  : !isSlopeNominal
                  ? 'DICTAMEN FORMAL: NO-GO // RIESGO TOPOGRÁFICO ELEVADO'
                  : 'DICTAMEN FORMAL: PRECAUCIÓN // VENTANA ENERGÉTICA RESTRINGIDA'}
              </span>
              <p className="text-[11px] opacity-90 mt-0.5 font-sans">
                {isMissionGo
                  ? 'Todos los parámetros selenográficos, pendientes locales e iluminación polar satisfacen los márgenes de seguridad establecidos.'
                  : !isSlopeNominal
                  ? `La pendiente del terreno (${currentSlope}°) supera el umbral configurado de ${maxSlope}°. Existe peligro de volcamiento de la etapa de descenso.`
                  : `La insolación solar útil (${telemetrySummary?.powerPercentage || 0}%) se sitúa bajo el margen recomendado del 65%. Se aconseja recalibrar la fecha.`}
              </p>
            </div>
          </div>

          {/* Grilla de Métricas Técnicas Rigurosas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Tarjeta 1: Parámetros del Sitio */}
            <div className="bg-[#050812] border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold border-b border-slate-800/80 pb-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Sitio Selenográfico</span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div>
                  <span className="text-slate-500 block">Objetivo:</span>
                  <strong className="text-slate-200 text-xs">{selectedSite?.nombre}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Coordenadas:</span>
                  <span className="text-slate-300">Lat: {selectedSite?.lat}° | Lon: {selectedSite?.lon}°</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Pendiente Local (LOLA):</span>
                  <span className={isSlopeNominal ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {currentSlope}° (Máx: {maxSlope}°)
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Energía & DTE */}
            <div className="bg-[#050812] border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold border-b border-slate-800/80 pb-1.5">
                <Sun className="w-3.5 h-3.5" />
                <span>Insolación & DTE</span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div>
                  <span className="text-slate-500 block">Ventana Solar Útil:</span>
                  <strong className={isPowerNominal ? 'text-emerald-400' : 'text-amber-400'}>
                    {telemetrySummary?.powerPercentage || 0}% ({telemetrySummary?.totalPowerHours || 0}h)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Umbral Fotovoltaico:</span>
                  <span className="text-slate-300">Sol &gt; {minSunElev}° sobre horizonte</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Enlace Directo Tierra:</span>
                  <span className={isCommNominal ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>
                    {isCommNominal ? 'Continuo (100% Cobertura)' : 'Intermitente (Ocultación)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta 3: Sincronización TLI */}
            <div className="bg-[#050812] border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-sky-400 text-[11px] font-bold border-b border-slate-800/80 pb-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Cinemática TLI</span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div>
                  <span className="text-slate-500 block">Despegue Terrestre:</span>
                  <strong className="text-amber-300 truncate block">{orbitalSync?.earthLaunchUTC}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tránsito Translunar:</span>
                  <span className="text-cyan-300">84.42 horas (~3.5 días)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Alunizaje (Touchdown):</span>
                  <span className="text-slate-200 truncate block">{orbitalSync?.touchdownUTC}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Recuadro de Disclaimer Didáctico y Rigor Científico */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
            <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] font-sans text-slate-300 leading-relaxed">
              <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                Aviso de Divulgación Científica y Propósito Didáctico
              </span>
              <p>
                <strong>MOON LOVER</strong> es una plataforma didáctica y educativa desarrollada para el <em>NASA Space Apps Challenge (Human Exploration)</em>.
                Los cálculos astronómicos, fotométricos, topográficos y de enlace de comunicaciones son <strong>aproximaciones cinemáticas y fotométricas rigurosas dentro de nuestra capacidad técnica</strong>, concebidas para el aprendizaje interactivo, la simulación escolar y el fomento de la exploración lunar, no debiendo ser utilizadas para navegación ni operaciones de vuelo aeroespacial real.
              </p>
            </div>
          </div>

        </div>

        {/* Footer con Acciones */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] text-slate-500">
            Formato de salida: Documento Técnico Vectorial A4 listo para imprimir
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              Cerrar
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Informe Técnico (PDF)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
