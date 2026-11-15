/**
 * ============================================================================
 * MOON LOVER // SMART MISSION OPTIMIZER MODAL
 * Archivo: src/components/SmartOptimizerModal.jsx
 * 
 * Permite al usuario calibrar cualquier ubicación en la superficie lunar
 * y calcula automáticamente la ventana ideal de vuelo:
 * ¿Cuándo?, ¿Desde dónde? y ¿Durante cuánto tiempo?
 * ============================================================================
 */

import { useState, useMemo } from 'react';
import {
  Sparkles,
  X,
  Calendar,
  Rocket,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { optimizeMissionWindow } from '../utils/missionOptimizer';
import { LUNAR_SITES } from '../data/lunarSites';

export default function SmartOptimizerModal({
  isOpen,
  onClose,
  currentSite,
  currentDate,
  maxSlope,
  minSunElev,
  onApplyOptimization
}) {
  // Estados de calibración
  const [selectedSiteId, setSelectedSiteId] = useState(currentSite?.id || 'shackleton');
  const [useCustomCoords, setUseCustomCoords] = useState(false);
  const [customLat, setCustomLat] = useState(currentSite?.lat || -89.9);
  const [customLon, setCustomLon] = useState(currentSite?.lon || 0.0);
  const [customSlope, setCustomSlope] = useState(currentSite?.slopeDeg || 7.2);

  // Sincronizar si el usuario elige un preset
  const handleSelectPreset = (site) => {
    setSelectedSiteId(site.id);
    setUseCustomCoords(false);
    setCustomLat(site.lat);
    setCustomLon(site.lon);
    setCustomSlope(site.slopeDeg || 6.0);
  };

  // Ejecución reactiva de la optimización
  const result = useMemo(() => {
    return optimizeMissionWindow({
      lat: customLat,
      lon: customLon,
      slopeDeg: customSlope,
      maxSlopeAllowed: maxSlope,
      minSunElevRequired: minSunElev,
      referenceDate: currentDate
    });
  }, [customLat, customLon, customSlope, maxSlope, minSunElev, currentDate]);

  if (!isOpen) return null;

  const handleApply = () => {
    // Si es un sitio del catálogo lo buscamos, de lo contrario construimos un objetivo custom
    let targetSite = LUNAR_SITES.find((s) => s.id === selectedSiteId);
    if (useCustomCoords || !targetSite) {
      targetSite = {
        id: `custom_${Date.now()}`,
        nombre: `Objetivo Calibrado (${customLat > 0 ? '+' : ''}${customLat}°, ${customLon > 0 ? '+' : ''}${customLon}°)`,
        category: Math.abs(customLat) >= 75 ? 'polar' : 'global',
        categoriaNombre: Math.abs(customLat) >= 75 ? 'Polo Sur / Norte' : 'Zona Global',
        lat: customLat,
        lon: customLon,
        slopeDeg: customSlope,
        desc: 'Sitio de aterrizaje calibrado mediante el Optimizador Inteligente de Misión.',
        topografia: {
          slopeMedia: customSlope,
          slopeMinima: Math.max(1, customSlope * 0.4),
          slopeCriticaCresta: customSlope * 2.5,
          radioSeguroMetros: customSlope > 15 ? 150 : 500,
          factorRugosidad: customSlope > 12 ? 1.4 : 0.8,
          minEarthElevationDTE: result.dteStatus.elevationDeg
        }
      };
    }

    const calibratedSite = {
      ...targetSite,
      slopeDeg: result.safeSlope
    };

    onApplyOptimization({
      site: calibratedSite,
      dateUTC: result.optimalTouchdownUTC,
      durationDays: result.optimalDurationDays,
      safeSlope: result.safeSlope
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#080d19] border border-cyan-500/40 rounded-2xl max-w-4xl w-full p-6 font-mono text-slate-200 shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                Simulación Inteligente & Optimizador de Misión
              </h2>
              <span className="text-[10px] text-slate-400 font-sans block">
                Cálculo autónomo: ¿Cuándo?, ¿Desde dónde? y ¿Durante cuánto tiempo?
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido Principal con Scroll */}
        <div className="overflow-y-auto py-4 space-y-5 pr-1 text-xs">
          
          {/* SECCIÓN 1: CALIBRADOR DE UBICACIÓN */}
          <div className="bg-[#050813] border border-slate-800/90 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5" /> 1. Calibrar Ubicación de Alunizaje
              </span>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  onClick={() => setUseCustomCoords(false)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    !useCustomCoords
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sitios Oficiales
                </button>
                <button
                  onClick={() => setUseCustomCoords(true)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    useCustomCoords
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Coordenadas Libres
                </button>
              </div>
            </div>

            {!useCustomCoords ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {LUNAR_SITES.map((site) => {
                  const isSel = selectedSiteId === site.id;
                  return (
                    <button
                      key={site.id}
                      onClick={() => handleSelectPreset(site)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSel
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 font-bold shadow-md shadow-cyan-500/10'
                          : 'bg-[#0a0f1d] border-slate-800/80 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-[11px] block truncate">{site.nombre}</span>
                      <span className="text-[9px] text-slate-500 block">
                        {site.lat}° | {site.lon}° • {site.slopeDeg}°
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Latitud */}
                <div className="bg-[#080d19] border border-slate-800 p-2.5 rounded-lg space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Latitud Selenográfica:</span>
                    <strong className="text-cyan-400">{customLat}°</strong>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="0.5"
                    value={customLat}
                    onChange={(e) => setCustomLat(Number(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg"
                  />
                  <span className="text-[9px] text-slate-500 block">
                    {customLat < -75 ? 'Zona Polar Sur' : customLat > 75 ? 'Zona Polar Norte' : 'Zona Ecuatorial / Media'}
                  </span>
                </div>

                {/* Longitud */}
                <div className="bg-[#080d19] border border-slate-800 p-2.5 rounded-lg space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Longitud Selenográfica:</span>
                    <strong className="text-amber-400">{customLon}°</strong>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="0.5"
                    value={customLon}
                    onChange={(e) => setCustomLon(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg"
                  />
                  <span className="text-[9px] text-slate-500 block">
                    {Math.abs(customLon) > 90 ? 'Cara Oculta (Far Side)' : 'Cara Visible (Near Side)'}
                  </span>
                </div>

                {/* Pendiente */}
                <div className="bg-[#080d19] border border-slate-800 p-2.5 rounded-lg space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Pendiente Local Estimada:</span>
                    <strong className={customSlope > maxSlope ? 'text-rose-400' : 'text-emerald-400'}>
                      {customSlope}°
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="0.5"
                    value={customSlope}
                    onChange={(e) => setCustomSlope(Number(e.target.value))}
                    className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg"
                  />
                  <span className="text-[9px] text-slate-500 block">
                    {customSlope > maxSlope ? '⚠️ Peligro de vuelco' : '✓ Pendiente nominal'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: RESULTADOS DE LA OPTIMIZACIÓN (3 PILARES) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Pilar 1: ¿CUÁNDO? */}
            <div className="bg-[#050813] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold border-b border-slate-800/80 pb-2 text-[11px]">
                <Calendar className="w-4 h-4" />
                <span>1. ¿Cuándo Alunizar?</span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div>
                  <span className="text-slate-500 block">Fecha y Hora Óptima (UTC):</span>
                  <strong className="text-slate-100 text-xs block text-amber-300">
                    {result.optimalTouchdownDisplay}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Condición Solar:</span>
                  <span className="text-slate-300">
                    Iluminación nominal &gt; {minSunElev}° para carga fotovoltaica y sombras óptimas.
                  </span>
                </div>
              </div>
            </div>

            {/* Pilar 2: ¿DESDE DÓNDE? */}
            <div className="bg-[#050813] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold border-b border-slate-800/80 pb-2 text-[11px]">
                <Rocket className="w-4 h-4" />
                <span>2. ¿Desde Dónde Despegar?</span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div>
                  <span className="text-slate-500 block">Puerto Espacial Terrestre:</span>
                  <strong className="text-slate-200 block truncate" title={result.earthSpaceport.nombre}>
                    {result.earthSpaceport.nombre}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Ignición TLI Terrestre:</span>
                  <span className="text-cyan-300 block">{result.earthLaunchDisplay}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Azimut de Vuelo:</span>
                  <span className="text-slate-400">{result.earthSpaceport.azimutLanzamientoDeg}° ({result.earthSpaceport.perfilInyeccion})</span>
                </div>
              </div>
            </div>

            {/* Pilar 3: ¿DURANTE CUÁNTO TIEMPO? */}
            <div className="bg-[#050813] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold border-b border-slate-800/80 pb-2 text-[11px]">
                <Clock className="w-4 h-4" />
                <span>3. ¿Durante Cuánto Tiempo?</span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div>
                  <span className="text-slate-500 block">Duración Óptima de Operación:</span>
                  <strong className="text-emerald-400 text-sm block">
                    {result.optimalDurationDays} días terrestres
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Enlace con la Tierra (DTE):</span>
                  <span className={result.dteStatus.isDirect ? 'text-cyan-400' : 'text-amber-400'}>
                    {result.dteStatus.isDirect ? 'Línea de vista directa activa' : 'Requiere Satélite Relay (Cara Oculta)'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* SECCIÓN 3: DICTAMEN DE VIABILIDAD CALCULADA */}
          <div className="bg-[#070b17] border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-400/80 bg-cyan-950/60 flex items-center justify-center font-bold text-cyan-300 text-base flex-shrink-0">
                {result.viabilityScore}%
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-200 font-bold text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Índice de Viabilidad de Misión: {result.viabilityScore >= 80 ? 'EXCELENTE' : result.viabilityScore >= 60 ? 'ACEPTABLE' : 'CRÍTICO'}
                </span>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  {result.resumenEstrategico}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer con Acciones */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] text-slate-500 font-sans">
            Ajusta los parámetros para recalcular la solución orbital en tiempo real.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              Cancelar
            </button>

            <button
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Aplicar Solución al Simulador</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
