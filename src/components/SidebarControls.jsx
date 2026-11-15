/**
 * MISSION CONTROL SIDEBAR - NASA INTEGRATED
 * Panel de configuración de parámetros, micro-relieve y auditoría oficial LROC/Moon Trek
 * Core Architecture // f_nord
 */
import { 
  Compass, Calendar, ShieldCheck, Sun, Layers, ExternalLink, 
  ChevronLeft, AlertCircle, Mountain, Radio, Play
} from 'lucide-react';
import { LUNAR_SITES } from '../data/lunarSites';

export default function SidebarControls({ isOpen, params, onChangeParam, onCalculate, onToggleSidebar }) {
  const currentSite = params.selectedSite;

  return (
    <aside 
      className={`h-full bg-[#0d121d] border-r border-slate-800 transition-all duration-300 z-20 flex flex-col ${
        isOpen ? 'w-80 lg:w-96' : 'w-0 -translate-x-full overflow-hidden'
      }`}
    >
      {/* Cabecera con ChevronLeft para colapsar */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>Parámetros de Misión</span>
        </div>
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            title="Ocultar panel lateral"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 font-mono text-xs">
        {/* 1. Selector de Sitio */}
        <div className="space-y-2">
          <label className="text-slate-400 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Zona de Alunizaje (Polo Sur)</span>
          </label>
          <select
            value={currentSite.id}
            onChange={(e) => {
              const site = LUNAR_SITES.find(s => s.id === e.target.value);
              if (site) onChangeParam('selectedSite', site);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-sans focus:outline-none focus:border-cyan-500"
          >
            {LUNAR_SITES.map((site) => (
              <option key={site.id} value={site.id}>
                {site.nombre} (Lat: {site.lat}°)
              </option>
            ))}
          </select>
        </div>

        {/* Ficha Topográfica Calibrada (Moon Trek LOLA) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5 font-sans">
          <p className="text-[11px] text-slate-400 leading-relaxed">{currentSite.desc}</p>
          
           <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
            <div className="bg-[#05070c] p-2 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Pendiente Media</span>
              <span className="text-cyan-400 font-bold">{currentSite.topografia.slopeMedia}°</span>
            </div>
            <div className="bg-[#05070c] p-2 rounded border border-slate-800/80">
              <span className="text-[10px] text-rose-400/80 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                <span>Cresta Crítica</span>
              </span>
              <span className="text-rose-400 font-bold">{currentSite.topografia.slopeCriticaCresta}°</span>
            </div>
            <div className="bg-[#05070c] p-2 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Radio Seguro</span>
              <span className="text-slate-200 font-bold">{currentSite.topografia.radioSeguroMetros} m</span>
            </div>
            <div className="bg-[#05070c] p-2 rounded border border-slate-800/80">
              <span className="text-[10px] text-amber-400/80 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-amber-400" />
                <span>Bloqueo DTE</span>
              </span>
              <span className="text-amber-400 font-bold">&gt; {currentSite.topografia.minEarthElevationDTE}°</span>
            </div>
          </div>

          {/* Botones de Auditoría Oficial Directa */}
          <div className="pt-2 flex flex-col gap-1.5 font-mono">
            <a
              href={currentSite.quickmapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2.5 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] transition-all"
            >
              <span>Auditar en LROC QuickMap (3D)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={currentSite.moonTrekUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2.5 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] transition-all"
            >
              <span>Inspeccionar en NASA Moon Trek</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* 2. Fecha y Ventana de Descenso */}
        <div className="space-y-2">
          <label className="text-slate-400 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fecha y Hora UTC de Alunizaje</span>
          </label>
          <input
            type="datetime-local"
            value={params.missionDate}
            onChange={(e) => onChangeParam('missionDate', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* 3. Umbrales Operacionales (Con ShieldCheck integrado) */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Límites de Seguridad</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Mountain className="w-3 h-3 text-cyan-400" /> Pendiente Máxima Segura:
              </span>
              <span className="text-cyan-400 font-bold">{params.maxSlope}°</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="0.5"
              value={params.maxSlope}
              onChange={(e) => onChangeParam('maxSlope', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 cursor-pointer h-1.5 rounded"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3 h-3 text-amber-400" /> Elevación Solar Mínima:
              </span>
              <span className="text-amber-400 font-bold">{params.minSunElev}°</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={params.minSunElev}
              onChange={(e) => onChangeParam('minSunElev', parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 cursor-pointer h-1.5 rounded"
            />
          </div>
        </div>
      </div>

      {/* Botón de Ejecución de Cálculo */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={onCalculate}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>CALCULAR VIABILIDAD</span>
        </button>
      </div>
    </aside>
  );
}