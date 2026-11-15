/**
 * ============================================================================
 * MOON LOVER // COMMAND CENTER & MISSION PLANNER
 * Archivo: src/App.jsx
 * 
 * AUDITORÍA TÉCNICA:
 * - Estado inicial corregido: LUNAR_SITES[0] (Shackleton Rim).
 * - Shell reactivo aeroespacial con navegación por pestañas (Inicio, Simulador, Gadget, Recursos).
 * - Sincronización orbital TLI: Alunizaje (Master) -> Despegue terrestre (Slave).
 * - Sección de Control de Seguridad activa con alertas dinámicas (AlertTriangle).
 * - Exportador de plan de vuelo en formato JSON para colegios y equipos de misión.
 * ============================================================================
 */

import { useState, useMemo, useCallback } from 'react';
import LunarViewer3D from './components/LunarViewer3D';
import MissionTelemetryCharts from './components/MissionTelemetryCharts';
import MissionReportModal from './components/MissionReportModal';
import SmartOptimizerModal from './components/SmartOptimizerModal';
import { LUNAR_SITES } from './data/lunarSites';
import {
  Rocket,
  Compass,
  Sliders,
  Calendar,
  Clock,
  Download,
  Cpu,
  BookOpen,
  Info,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText,
  Sparkles,
  Eye,
  ShieldAlert,
  Globe,
  MapPin
} from 'lucide-react';

/* ============================================================================
 * [CONFIGURACIÓN GLOBAL Y EFEMÉRIDES CONSTANTES]
 * ============================================================================ */
const ORBITAL_CONSTANTS = {
  TLI_TRANSIT_HOURS: 84.42,            // Tiempo medio de vuelo Tierra-Luna (~3.5 días)
  AVG_EARTH_MOON_DIST_KM: 384400,      // Distancia orbital media en kilómetros
  DEFAULT_DATE_UTC: '2026-11-20T12:00' // Fecha predeterminada de misión
};

export default function App() {
  /* ============================================================================
   * [SECCIÓN 1: ESTADO CANÓNICO DE LA MISIÓN]
   * ============================================================================ */
  const [activeTab, setActiveTab] = useState('simulador'); // 'inicio' | 'simulador' | 'gadget' | 'recursos'
  
  // Selección inicial blindada con índice [0] (Shackleton Rim)
  const [selectedSite, setSelectedSite] = useState(
    Array.isArray(LUNAR_SITES) && LUNAR_SITES.length > 0 ? LUNAR_SITES[0] : null
  );
  
  const [missionDate, setMissionDate] = useState(ORBITAL_CONSTANTS.DEFAULT_DATE_UTC);
  const [missionDurationDays, setMissionDurationDays] = useState(8);
  
  // Parámetros de Control y Seguridad
  const [maxSlope, setMaxSlope] = useState(17.5);
  const [minSunElev, setMinSunElev] = useState(1.6);

  // Estados de Auditoría Técnica y Escaneo Temporal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isOptimizerModalOpen, setIsOptimizerModalOpen] = useState(false);
  const [scrubbedHours, setScrubbedHours] = useState(0);
  const [zoneCategory, setZoneCategory] = useState('polar'); // 'polar' | 'global'
  const [currentPerspective, setCurrentPerspective] = useState('south_pole');
  const [showPins, setShowPins] = useState(true);
  const [isFlying, setIsFlying] = useState(false);
  const [flightTrigger, setFlightTrigger] = useState(0);

  // Callbacks memorizados para blindar el ciclo de vida WebGL de Three.js
  const handleSelectSite = useCallback((site) => {
    setSelectedSite(site);
  }, []);

  const handleResetScrub = useCallback(() => {
    setScrubbedHours(0);
  }, []);

  // Aplicación automática de resultados desde el optimizador inteligente
  const handleApplyOptimization = ({ site, dateUTC, durationDays }) => {
    setSelectedSite(site);
    setMissionDate(dateUTC);
    setMissionDurationDays(durationDays);
    if (site.category) {
      setZoneCategory(site.category);
    }
  };

  /* ============================================================================
   * [SECCIÓN 2: MOTOR DE CÁLCULO ORBITAL TLI (Sincronización Tierra-Luna)]
   * ============================================================================ */
  const orbitalSync = useMemo(() => {
    const touchdownDate = new Date(missionDate.includes('Z') ? missionDate : missionDate + ':00Z');
    // Cálculo de ignición terrestre restando las horas de tránsito translunar
    const departureTimeMs = touchdownDate.getTime() - ORBITAL_CONSTANTS.TLI_TRANSIT_HOURS * 3600 * 1000;
    const earthLaunchDate = new Date(departureTimeMs);

    // Variación periódica de la distancia lunar
    const dayOfYear = Math.floor((touchdownDate - new Date(touchdownDate.getFullYear(), 0, 0)) / 86400000);
    const distanceKm = Math.round(ORBITAL_CONSTANTS.AVG_EARTH_MOON_DIST_KM + Math.sin(dayOfYear * 0.23) * 18000);

    return {
      touchdownUTC: touchdownDate.toUTCString().replace('GMT', 'UTC'),
      earthLaunchUTC: earthLaunchDate.toUTCString().replace('GMT', 'UTC'),
      distanceKm: distanceKm.toLocaleString()
    };
  }, [missionDate]);

  /* Resumen de telemetría ambiental para dictamen de vuelo */
  const telemetrySummary = useMemo(() => {
    const activeSite = selectedSite || (Array.isArray(LUNAR_SITES) ? LUNAR_SITES[0] : null);
    if (!activeSite || !missionDate) {
      return { totalPowerHours: 0, powerPercentage: 0, commContinuous: true };
    }

    const totalHours = Math.max(1, missionDurationDays) * 24;
    const step = 4;
    let powerHoursCount = 0;
    let commContinuous = true;

    for (let h = 0; h <= totalHours; h += step) {
      const dayFraction = (h % 708.7) / 708.7;
      const polarOffset = (90 - Math.abs(activeSite.lat)) * 0.18;
      const sunElevation = Math.sin(dayFraction * Math.PI * 2) * 1.54 + polarOffset;
      const earthElevation = Math.max(0, 1.2 + Math.cos(dayFraction * Math.PI * 2 * 1.05) * 5.5);

      if (sunElevation >= minSunElev) {
        powerHoursCount += step;
      }
      if (earthElevation < 0.5) {
        commContinuous = false;
      }
    }

    const powerPercentage = Math.round((powerHoursCount / totalHours) * 100);
    return {
      totalPowerHours: powerHoursCount,
      powerPercentage,
      commContinuous
    };
  }, [selectedSite, missionDate, missionDurationDays, minSunElev]);

  /* ============================================================================
   * [SECCIÓN 3: EXPORTACIÓN DE REPORTE DE MISIÓN (JSON)]
   * ============================================================================ */
  const handleExportJSON = () => {
    const activeSite = selectedSite || (Array.isArray(LUNAR_SITES) ? LUNAR_SITES[0] : null);
    if (!activeSite) return;

    const missionReport = {
      project: 'MOON LOVER - Lunar Landing Site Navigator',
      generatedAt: new Date().toISOString(),
      targetSite: {
        id: activeSite.id,
        name: activeSite.nombre,
        coordinates: { lat: activeSite.lat, lon: activeSite.lon },
        slopeDeg: activeSite.slopeDeg || 8.5
      },
      schedule: {
        touchdownUTC: orbitalSync.touchdownUTC,
        earthLaunchUTC: orbitalSync.earthLaunchUTC,
        transitDurationHours: ORBITAL_CONSTANTS.TLI_TRANSIT_HOURS,
        surfaceDurationDays: missionDurationDays
      },
      safetyThresholds: {
        maxAllowedSlopeDeg: maxSlope,
        minRequiredSunElevationDeg: minSunElev
      },
      orbitalTelematics: {
        earthMoonDistanceKm: orbitalSync.distanceKm,
        directToEarthLink: 'Nominal'
      }
    };

    const blob = new Blob([JSON.stringify(missionReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MOON_LOVER_MissionPlan_${activeSite.id}_${missionDate.replace(/[:T]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Referencia segura del sitio activo para evitar fallos de render
  const currentSite = selectedSite || (Array.isArray(LUNAR_SITES) ? LUNAR_SITES[0] : null);

  /* ============================================================================
   * [SECCIÓN 4: RENDERIZADO DEL COMMAND CENTER]
   * ============================================================================ */
  return (
    <div className="w-full min-h-screen bg-[#03060f] text-slate-100 flex flex-col font-sans select-none">
      
      {/* 4.1 Barra Superior de Navegación (Header Táctico Retro 70s) */}
      <header className="border-b border-slate-900 bg-[#030612]/95 backdrop-blur z-30">
        <div className="h-14 px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 via-cyan-500 to-slate-200 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Compass className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div>
              <h1 className="font-mono text-xs tracking-widest font-black uppercase text-slate-100 flex items-center gap-2">
                MOON LOVER <span className="text-cyan-400 font-normal">| Apollo-Artemis Navigator</span>
              </h1>
              <span className="text-[9px] text-slate-400 font-mono block">70's Space-Age Edition // NASA Space Apps</span>
            </div>
          </div>

          {/* Pestañas Principales */}
          <nav className="flex items-center gap-1 bg-[#050917] border border-slate-800 p-1 rounded-xl font-mono text-[11px]">
            {[
              { id: 'inicio', label: 'Inicio', icon: Info },
              { id: 'simulador', label: 'Simulador 3D', icon: Rocket },
              { id: 'gadget', label: 'Gadget 3D & ESP32', icon: Cpu },
              { id: 'recursos', label: 'Recursos', icon: BookOpen }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-bold ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-slate-200 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Estado del Enlace DTE */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>DTE: Online</span>
          </div>
        </div>
        
        {/* Cinta 70's Retrolines de 5 líneas (Azul a Plata) */}
        <div className="retro-ribbon-5" />
      </header>

      {/* 4.2 Contenedor Dinámico según Pestaña Activa */}
      <main className="flex-1 p-4 max-w-[1720px] w-full mx-auto">
        
        {/* ================================================================== */}
        {/* VISTA 1: SIMULADOR (Comando Central: Simulación 3D + Telemetría en un solo vistazo) */}
        {/* ================================================================== */}
        {activeTab === 'simulador' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
            
            {/* Columna Principal (8 cols): Visor Lunar 3D + Curva de Viabilidad inmediatamente visible */}
            <div className="lg:col-span-8 flex flex-col gap-3">
              
              {/* 1. Lienzo 3D Despejado (Altura calibrada para encajar en un solo vistazo) */}
              <div 
                className="w-full h-[320px] sm:h-[370px] lg:h-[395px] xl:h-[415px] retro-frame overflow-hidden relative flex flex-col transition-all"
              >
                <div className="flex-1 w-full h-full relative">
                  <LunarViewer3D
                    selectedSite={currentSite}
                    missionDate={missionDate}
                    onSelectSite={handleSelectSite}
                    scrubbedHours={scrubbedHours}
                    onResetScrub={handleResetScrub}
                    perspective={currentPerspective}
                    showPins={showPins}
                    zoneFilter={zoneCategory}
                    flightTrigger={flightTrigger}
                    onFlightStateChange={setIsFlying}
                    onOpenOptimizer={() => setIsOptimizerModalOpen(true)}
                  />

                  {/* Acceso Rápido Flotante: Simulación Inteligente */}
                  <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
                    <button
                      onClick={() => setIsOptimizerModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-cyan-500 to-blue-500 hover:opacity-95 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/25 cursor-pointer transition-all"
                      title="Simulación Inteligente (Calcular automáticamente cuándo, dónde y cuánto tiempo)"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>Simulación Inteligente</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Curvas de Telemetría & Viabilidad (Inmediatamente visible en el mismo vistazo) */}
              <div className="retro-frame p-1 overflow-hidden transition-all">
                <div className="retro-ribbon-5 rounded-t-xl" />
                <MissionTelemetryCharts
                  selectedSite={currentSite}
                  missionDate={missionDate}
                  missionDurationDays={missionDurationDays}
                  onTimeScrub={(hour) => setScrubbedHours(hour)}
                />
              </div>

            </div>

            {/* Columna Lateral Derecha (4 cols): Consola de Parámetros de Vuelo y Orientación */}
            <div className="lg:col-span-4 retro-frame p-4 sm:p-5 space-y-3.5 lg:max-h-[625px] xl:max-h-[650px] overflow-y-auto">
              <div className="retro-ribbon-5 -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 mb-3.5 rounded-t-xl" />

              {/* Cabecera del Panel */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs uppercase tracking-widest text-slate-100 font-black flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" /> Parámetros de Vuelo
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/50 hover:bg-cyan-900 text-cyan-300 font-bold text-[10px] cursor-pointer"
                    title="Abrir dictamen de misión y descargar reporte PDF"
                  >
                    <FileText className="w-3 h-3" /> Dictamen & PDF
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-[10px] cursor-pointer"
                    title="Exportar archivo JSON"
                  >
                    <Download className="w-3 h-3" /> JSON
                  </button>
                </div>
              </div>

              {/* 1. Orientación Lunar / Perspectivas de Cámara */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-cyan-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> 1. Orientación Lunar
                </label>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Establece la orientación de la Luna para visualizarla mejor.
                </p>
                <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                  <button
                    onClick={() => setCurrentPerspective('south_pole')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      currentPerspective === 'south_pole'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                        : 'bg-[#0b101c] text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Compass className="w-3 h-3" /> Polo Sur
                  </button>
                  <button
                    onClick={() => setCurrentPerspective('nearside')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      currentPerspective === 'nearside'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                        : 'bg-[#0b101c] text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3 h-3" /> Near Side
                  </button>
                  <button
                    onClick={() => setCurrentPerspective('farside')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      currentPerspective === 'farside'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                        : 'bg-[#0b101c] text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <ShieldAlert className="w-3 h-3" /> Far Side
                  </button>
                  <button
                    onClick={() => setCurrentPerspective('tli_corridor')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      currentPerspective === 'tli_corridor'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                        : 'bg-[#0b101c] text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Globe className="w-3 h-3" /> Corredor TLI
                  </button>
                </div>
              </div>

              {/* 2. Sitios Candidatos de Alunizaje y Botón de Ocultar Pines */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-cyan-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> 2. Sitios Candidatos
                  </label>
                  <button
                    onClick={() => setShowPins((prev) => !prev)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      showPins
                        ? 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'
                        : 'bg-rose-950/70 text-rose-300 border-rose-800 hover:bg-rose-900'
                    }`}
                    title="Activar u ocultar los marcadores en la superficie lunar (estado persistente)"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{showPins ? 'Ocultar Pines' : 'Mostrar Pines'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Visualiza potenciales lugares de aterrizaje.
                </p>

                <div className="flex items-center gap-1 bg-[#050812] border border-slate-800 p-0.5 rounded-lg text-[10px]">
                  <button
                    onClick={() => setZoneCategory('polar')}
                    className={`flex-1 py-1 rounded text-center transition-all cursor-pointer ${
                      zoneCategory === 'polar'
                        ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Polo Sur
                  </button>
                  <button
                    onClick={() => setZoneCategory('global')}
                    className={`flex-1 py-1 rounded text-center transition-all cursor-pointer ${
                      zoneCategory === 'global'
                        ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/50'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Otras Zonas
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {Array.isArray(LUNAR_SITES) &&
                    LUNAR_SITES.filter((site) => site.category === zoneCategory).map((site) => {
                      const isSelected = currentSite?.id === site.id;
                      return (
                        <button
                          key={site.id}
                          onClick={() => setSelectedSite(site)}
                          className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 font-bold shadow-md shadow-cyan-500/10'
                              : 'bg-[#0f1422] border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <span className="block text-[10px] sm:text-[11px] truncate font-bold">{site.nombre}</span>
                          <span className="block text-[8px] sm:text-[9px] text-slate-500">
                            {site.lat}° | {site.lon}° • {site.slopeDeg}°
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* 3. Despegue TLI & Simulación Cinemática de Alunizaje */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => setFlightTrigger((prev) => prev + 1)}
                  disabled={isFlying || !currentSite}
                  className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    isFlying
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  <Rocket className={`w-4 h-4 ${isFlying ? 'animate-bounce' : ''}`} />
                  <span>{isFlying ? 'Misión TLI en Progreso...' : 'Despegar TLI & Alunizar'}</span>
                </button>
              </div>

              {/* 4. Ventana de Alunizaje (Fecha UTC y Duración) */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                <label className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" /> 3. Alunizaje (Touchdown UTC)
                </label>
                <input
                  type="datetime-local"
                  value={missionDate}
                  onChange={(e) => setMissionDate(e.target.value)}
                  className="w-full bg-[#101625] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />

                <div className="flex justify-between items-center text-[11px] mt-0.5">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> Duración de Misión:
                  </span>
                  <span className="text-cyan-400 font-bold">{missionDurationDays} días</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="14"
                  step="1"
                  value={missionDurationDays}
                  onChange={(e) => setMissionDurationDays(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 5. Filtros de Seguridad */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> 4. Filtros de Seguridad
                  </span>
                  {maxSlope > 17.5 && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> Vuelco
                    </span>
                  )}
                </div>
                
                {/* Control de Pendiente Máxima */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
                    <span className="text-slate-400">Pendiente máxima:</span>
                    <span className={maxSlope > 17.5 ? "text-amber-400 font-bold flex items-center gap-1" : "text-slate-200 font-bold"}>
                      {maxSlope > 17.5 && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                      {maxSlope}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="0.5"
                    value={maxSlope}
                    onChange={(e) => setMaxSlope(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Control de Elevación Solar Mínima */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
                    <span className="text-slate-400">Elevación solar mínima:</span>
                    <span className="text-cyan-400 font-bold">{minSunElev}°</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={minSunElev}
                    onChange={(e) => setMinSunElev(Number(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* 6. Sincronización Orbital TLI */}
              <div className="bg-[#050811] border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5 text-[10px] sm:text-[11px]">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" /> Sincronización TLI
                  </span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                    Acoplado
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-slate-400">
                  <div>
                    <span className="text-slate-500 block text-[9px]">Alunizaje (Luna):</span>
                    <strong className="text-slate-200">{orbitalSync.touchdownUTC}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">Tránsito TLI:</span>
                    <strong className="text-cyan-400">{ORBITAL_CONSTANTS.TLI_TRANSIT_HOURS} hrs (~3.5 días)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">Despegue (Tierra):</span>
                    <strong className="text-amber-300">{orbitalSync.earthLaunchUTC}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">Distancia Tierra-Luna:</span>
                    <strong className="text-sky-300">{orbitalSync.distanceKm} km</strong>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================================================================== */}
        {/* VISTA 2: INICIO (Presentación del Proyecto y Desafío NASA) */}
        {/* ================================================================== */}
        {activeTab === 'inicio' && (
          <div className="max-w-4xl mx-auto py-8 font-mono flex flex-col gap-6">
            <div className="retro-frame p-8 overflow-hidden">
              <div className="retro-ribbon-5 -mx-8 -mt-8 mb-6 rounded-t-xl" />
              <span className="text-xs text-cyan-400 uppercase tracking-widest font-black block mb-2">
                2026 NASA Space Apps Challenge // Human Exploration
              </span>
              <h2 className="text-2xl font-black text-slate-100 mb-4 tracking-tight">
                Challenge: Lunar Landing Site Navigator
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6 font-sans">
                Las misiones al Polo Sur de la Luna enfrentan restricciones extremas de iluminación rasante y comunicaciones directas. Las herramientas oficiales existentes como QuickMap, Moon Trek o JPL Horizons requieren una alta curva técnica. <strong>MOON LOVER</strong> nace para democratizar esta evaluación, transformando efemérides complejas en un visualizador 3D intuitivo, complementado con un simulador físico impreso en 3D para escuelas y entusiastas espaciales.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#030612] border border-slate-800/80 p-4 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 mb-2" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase mb-1">Mapeo Fotográfico 3D</h4>
                  <p className="text-[11px] text-slate-400 font-sans">Textura continua con proporciones físicas reales y relieve derivado de NASA Moon Trek.</p>
                </div>
                <div className="bg-[#030612] border border-slate-800/80 p-4 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 mb-2" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase mb-1">Insolación y DTE</h4>
                  <p className="text-[11px] text-slate-400 font-sans">Curvas temporales de energía fotovoltaica y ventanas de línea de vista con la Tierra.</p>
                </div>
                <div className="bg-[#030612] border border-slate-800/80 p-4 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase mb-1">Gadget Físico 3D</h4>
                  <p className="text-[11px] text-slate-400 font-sans">Réplica de la Luna impresa en 3D motorizada con placa ESP32 para aulas y talleres.</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setActiveTab('simulador')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-slate-200 hover:opacity-90 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <span>Abrir Simulador de Vuelo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* VISTA 3: GADGET (Hardware 3D + ESP32 / Arduino para Escuelas) */}
        {/* ================================================================== */}
        {activeTab === 'gadget' && (
          <div className="max-w-4xl mx-auto py-8 font-mono flex flex-col gap-6">
            <div className="retro-frame p-8 overflow-hidden">
              <div className="retro-ribbon-5 -mx-8 -mt-8 mb-6 rounded-t-xl" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                  <Cpu className="w-5 h-5 text-amber-400" /> El Gadget Físico: Torre de Control Escolar
                </h2>
                <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded font-bold">
                  Open Hardware
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-6 font-sans">
                El proyecto MOON LOVER no vive solo en el navegador: se materializa en una maqueta didáctica motorizada diseñada para que estudiantes jueguen a ser controladores de misión de la NASA. Con una impresora 3D básica y una placa ESP32 o Arduino, cualquier escuela puede ensamblar el dispositivo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#030612] border border-slate-800/80 p-4 rounded-xl">
                  <span className="text-amber-400 font-bold text-xs block mb-1">Módulo 1: Esfera Lunar</span>
                  <p className="text-[11px] text-slate-400 font-sans">Globo impreso en 3D que gira sobre sus ejes mediante servomotores para posicionar el cráter de aterrizaje.</p>
                </div>
                <div className="bg-[#030612] border border-slate-800/80 p-4 rounded-xl">
                  <span className="text-amber-400 font-bold text-xs block mb-1">Módulo 2: Fuente Solar LED</span>
                  <p className="text-[11px] text-slate-400 font-sans">Brazo articulado con luz LED que simula la elevación rasante del Sol en el Polo Sur.</p>
                </div>
                <div className="bg-[#030612] border border-slate-800/80 p-4 rounded-xl">
                  <span className="text-amber-400 font-bold text-xs block mb-1">Módulo 3: Teclado Físico</span>
                  <p className="text-[11px] text-slate-400 font-sans">Teclado numérico estilo teléfono clásico para introducir la fecha y coordenadas desde la Tierra.</p>
                </div>
              </div>

              <div className="bg-[#030612] border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Archivos STL y Firmware ESP32</h4>
                  <p className="text-[11px] text-slate-400 font-sans">Descarga los modelos 3D y el sketch de Arduino para sincronizar el hardware.</p>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Paquete Maker
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* VISTA 4: RECURSOS Y ATRIBUCIÓN CIENTÍFICA */}
        {/* ================================================================== */}
        {activeTab === 'recursos' && (
          <div className="max-w-4xl mx-auto py-8 font-mono flex flex-col gap-6">
            <div className="retro-frame p-8 overflow-hidden">
              <div className="retro-ribbon-5 -mx-8 -mt-8 mb-6 rounded-t-xl" />
              <h2 className="text-xl font-black text-slate-100 mb-2 flex items-center gap-2 uppercase tracking-wide">
                <BookOpen className="w-5 h-5 text-cyan-400" /> Fuentes de Datos y Atribución Científica
              </h2>
              <p className="text-xs text-slate-400 mb-6 font-sans">
                Este proyecto se fundamenta en los repositorios públicos de datos cartográficos y efemérides astronómicas de la NASA, JPL y agencias socias:
              </p>

              <div className="flex flex-col gap-3 text-xs">
                {[
                  {
                    name: 'NASA Moon Trek',
                    desc: 'Cartografía global, mosaicos WAC/NAC y datos topográficos del LRO.',
                    url: 'https://trek.nasa.gov/moon/'
                  },
                  {
                    name: 'LROC QuickMap (Intuitive Machines / ASU)',
                    desc: 'Análisis de visibilidad, sombras permanentes y modelos de elevación digital LOLA.',
                    url: 'https://quickmap.lroc.im-ldi.com/'
                  },
                  {
                    name: 'JPL Horizons System',
                    desc: 'Cálculo de efemérides y vectores de posición solar y terrestre de alta precisión.',
                    url: 'https://ssd.jpl.nasa.gov/horizons/'
                  },
                  {
                    name: 'Canadian Space Agency (CSA)',
                    desc: 'Portal de exploración lunar y tecnologías del programa Artemis.',
                    url: 'https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/'
                  }
                ].map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 rounded-xl bg-[#030612] border border-slate-800 hover:border-cyan-500 flex items-center justify-between group transition-all"
                  >
                    <div>
                      <span className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors block">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-sans">{item.desc}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 4.3 Cuadro Flotante de Auditoría y Dictamen Técnico (Modal PDF) */}
      <MissionReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        selectedSite={currentSite}
        missionDate={missionDate}
        missionDurationDays={missionDurationDays}
        maxSlope={maxSlope}
        minSunElev={minSunElev}
        orbitalSync={orbitalSync}
        telemetrySummary={telemetrySummary}
      />

      {/* 4.4 Modal de Simulación Inteligente & Optimizador de Misión */}
      <SmartOptimizerModal
        isOpen={isOptimizerModalOpen}
        onClose={() => setIsOptimizerModalOpen(false)}
        currentSite={currentSite}
        currentDate={missionDate}
        maxSlope={maxSlope}
        minSunElev={minSunElev}
        onApplyOptimization={handleApplyOptimization}
      />
    </div>
  );
}