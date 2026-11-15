/**
 * ============================================================================
 * MOON LOVER ENGINE // MISSION TELEMETRY CHARTS
 * Archivo: src/components/MissionTelemetryCharts.jsx
 * 
 * AUDITORÍA TÉCNICA:
 * - Scrubber interactivo con escaneo temporal vertical hora a hora.
 * - Tooltip dinámico con lecturas rigurosas de insolación y enlace DTE.
 * - Selector toggle para "Datos y Etiquetas" en curva polar.
 * - Sincronización horaria desacoplada (onTimeScrub).
 * ============================================================================
 */

import { useState, useMemo, useRef } from 'react';
import { Sun, Radio, AlertTriangle, CheckCircle2, Tag, Activity } from 'lucide-react';

const TELEMETRY_CONFIG = {
  SUN_CRITICAL_ELEV_DEG: 1.6,   // Umbral de corte fotovoltaico (° sobre horizonte)
  EARTH_MIN_ELEV_DEG: 0.5,      // Ángulo mínimo para enlace de comunicaciones DTE
  LUNAR_SYNODIC_HOURS: 708.7,   // Día lunar sinódico (~29.53 días terrestres)
  LUNAR_AXIAL_TILT: 1.54,       // Inclinación del eje lunar respecto a la eclíptica (°)
  TIME_STEP_HOURS: 4,           // Resolución temporal del muestreo (cada 4 horas)
  SVG_WIDTH: 640,
  SVG_HEIGHT: 160,
  PADDING: { top: 22, right: 30, bottom: 25, left: 40 }
};

export default function MissionTelemetryCharts({
  selectedSite,
  missionDate,
  missionDurationDays = 7,
  onTimeScrub = null
}) {
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showLabels, setShowLabels] = useState(false);

  const chartPayload = useMemo(() => {
    if (!selectedSite || !missionDate) return null;

    const totalHours = Math.max(1, missionDurationDays) * 24;
    const step = TELEMETRY_CONFIG.TIME_STEP_HOURS;
    const points = [];

    const isPolar = Math.abs(selectedSite.lat) >= 75;
    const isFarSide = Math.abs(selectedSite.lon) > 90;

    for (let h = 0; h <= totalHours; h += step) {
      const dayFraction = (h % TELEMETRY_CONFIG.LUNAR_SYNODIC_HOURS) / TELEMETRY_CONFIG.LUNAR_SYNODIC_HOURS;
      let sunElevation;
      if (isPolar) {
        const polarOffset = (90 - Math.abs(selectedSite.lat)) * 0.18;
        sunElevation = Math.sin(dayFraction * Math.PI * 2) * TELEMETRY_CONFIG.LUNAR_AXIAL_TILT + polarOffset;
      } else {
        const maxElev = Math.min(85, 90 - Math.abs(selectedSite.lat));
        sunElevation = Math.sin(dayFraction * Math.PI * 2) * maxElev;
      }

      let earthElevation;
      if (isFarSide) {
        earthElevation = 0;
      } else if (isPolar) {
        earthElevation = Math.max(0, 1.2 + Math.cos(dayFraction * Math.PI * 2 * 1.05) * 5.5);
      } else {
        const nominalElev = Math.max(5, 90 - Math.abs(selectedSite.lat) - 15);
        earthElevation = Number((nominalElev + Math.cos(dayFraction * Math.PI * 2) * 4).toFixed(2));
      }

      points.push({
        hour: h,
        day: (h / 24).toFixed(1),
        sunElevation: Number(sunElevation.toFixed(2)),
        earthElevation: Number(earthElevation.toFixed(2)),
        hasPower: sunElevation >= TELEMETRY_CONFIG.SUN_CRITICAL_ELEV_DEG,
        hasComm: earthElevation >= TELEMETRY_CONFIG.EARTH_MIN_ELEV_DEG
      });
    }

    if (points.length === 0) return null;

    const { SVG_WIDTH, SVG_HEIGHT, PADDING } = TELEMETRY_CONFIG;
    const graphW = SVG_WIDTH - PADDING.left - PADDING.right;
    const graphH = SVG_HEIGHT - PADDING.top - PADDING.bottom;

    const maxElev = isPolar ? 7 : 90;
    const minElev = isPolar ? -2 : -10;
    const ticks = isPolar ? [-2, 0, TELEMETRY_CONFIG.SUN_CRITICAL_ELEV_DEG, 4, 6] : [0, TELEMETRY_CONFIG.SUN_CRITICAL_ELEV_DEG, 30, 60, 85];

    const getX = (index) => PADDING.left + (index / (points.length - 1)) * graphW;
    const getY = (val) => PADDING.top + graphH - ((val - minElev) / (maxElev - minElev)) * graphH;

    const sunPath = points.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.sunElevation)}`,
      ''
    );

    const earthPath = points.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.earthElevation)}`,
      ''
    );

    const totalPowerHours = points.filter((d) => d.hasPower).length * step;
    const totalHoursMission = missionDurationDays * 24;
    const powerPercentage = Math.round((totalPowerHours / totalHoursMission) * 100);
    const commContinuous = points.every((d) => d.hasComm);

    return {
      points,
      sunPath,
      earthPath,
      totalPowerHours,
      powerPercentage,
      commContinuous,
      getY,
      getX,
      graphW,
      graphH,
      ticks
    };
  }, [selectedSite, missionDate, missionDurationDays]);

  if (!selectedSite || !chartPayload) return null;

  const {
    points,
    sunPath,
    earthPath,
    totalPowerHours,
    powerPercentage,
    commContinuous,
    getY,
    getX,
    graphW,
    ticks
  } = chartPayload;

  const { SVG_WIDTH, SVG_HEIGHT, PADDING } = TELEMETRY_CONFIG;

  const handleMouseMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scaleX = SVG_WIDTH / rect.width;
    const svgX = mouseX * scaleX;

    const clampedX = Math.max(PADDING.left, Math.min(SVG_WIDTH - PADDING.right, svgX));
    const ratio = (clampedX - PADDING.left) / graphW;
    const index = Math.round(ratio * (points.length - 1));

    if (index >= 0 && index < points.length) {
      setHoverIndex(index);
      if (onTimeScrub) {
        onTimeScrub(points[index].hour, points[index]);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="bg-[#0b101b]/95 border border-slate-800 rounded-xl p-2.5 sm:p-3 font-mono shadow-2xl backdrop-blur-md select-none transition-all">
      {/* Cabecera compacta de la telemetría */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-300 font-bold truncate">
            Telemetría Solar & Enlace DTE: {selectedSite.nombre}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px]">
          <span className="flex items-center gap-1 text-amber-400">
            <Sun className="w-3 h-3" /> Sol (&ge;{TELEMETRY_CONFIG.SUN_CRITICAL_ELEV_DEG}°)
          </span>
          <span className="flex items-center gap-1 text-sky-400">
            <Radio className="w-3 h-3" /> Tierra DTE
          </span>

          {/* Botón de Datos y Etiquetas */}
          <button
            onClick={() => setShowLabels((prev) => !prev)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] sm:text-[10px] transition-all cursor-pointer ${
              showLabels
                ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 font-bold shadow-sm shadow-cyan-500/10'
                : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Activa o desactiva la lectura de datos numéricos y etiquetas sobre la curva"
          >
            <Tag className="w-2.5 h-2.5" />
            <span>{showLabels ? 'Ocultar Datos' : 'Datos & Etiquetas'}</span>
          </button>
        </div>
      </div>

      {/* Banner de Lectura Instantánea (Scrubber Status) */}
      <div className="flex items-center justify-between px-2.5 py-1 mb-1.5 bg-[#060913] border border-slate-800/90 rounded-lg text-[10px] sm:text-[11px]">
        {activePoint ? (
          <div className="flex flex-wrap items-center gap-3 text-slate-200">
            <span className="flex items-center gap-1 text-cyan-400 font-bold">
              <Activity className="w-3 h-3 animate-spin" />
              T+{activePoint.hour}h (Día {activePoint.day})
            </span>
            <span className="flex items-center gap-1">
              Sol:{' '}
              <strong className={activePoint.hasPower ? 'text-amber-400' : 'text-slate-500'}>
                {activePoint.sunElevation > 0 ? `+${activePoint.sunElevation}` : activePoint.sunElevation}°
              </strong>{' '}
              ({activePoint.hasPower ? 'Potencia Nominal' : 'Sombra'})
            </span>
            <span className="flex items-center gap-1">
              Tierra (DTE):{' '}
              <strong className={activePoint.hasComm ? 'text-sky-400' : 'text-rose-400'}>
                {activePoint.earthElevation}°
              </strong>{' '}
              ({activePoint.hasComm ? 'Enlace Directo' : 'Sin Enlace'})
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
            <span>Desplaza el cursor sobre el gráfico para escanear hora por hora la telemetría polar</span>
          </div>
        )}
      </div>

      {/* Lienzo vectorial interactivo SVG */}
      <div className="w-full overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-38 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Ejes y marcas horizontales */}
          {(ticks || [-2, 0, TELEMETRY_CONFIG.SUN_CRITICAL_ELEV_DEG, 4, 6]).map((tick) => {
            const y = getY(tick);
            const isThreshold = tick === TELEMETRY_CONFIG.SUN_CRITICAL_ELEV_DEG;
            return (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={SVG_WIDTH - PADDING.right}
                  y2={y}
                  stroke={isThreshold ? '#f59e0b' : '#1e293b'}
                  strokeDasharray={isThreshold ? '4,4' : 'none'}
                  strokeWidth={isThreshold ? 1.5 : 1}
                />
                <text
                  x={PADDING.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill={isThreshold ? '#f59e0b' : '#64748b'}
                  fontSize="9"
                  fontWeight={isThreshold ? 'bold' : 'normal'}
                >
                  {tick}°
                </text>
              </g>
            );
          })}

          {/* Curva de Enlace DTE */}
          <path d={earthPath} fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />

          {/* Curva de Insolación Solar */}
          <path d={sunPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" />

          {/* Etiquetas temporales de días en eje X */}
          {points.map((pt, i) => {
            if (i % 6 !== 0) return null;
            return (
              <text
                key={i}
                x={getX(i)}
                y={SVG_HEIGHT - 6}
                textAnchor="middle"
                fill="#64748b"
                fontSize="9"
              >
                Día {pt.day}
              </text>
            );
          })}

          {/* Capa de Datos y Etiquetas sobre puntos (si está activada) */}
          {showLabels &&
            points.map((pt, i) => {
              if (i % 4 !== 0) return null;
              const x = getX(i);
              const ySun = getY(pt.sunElevation);
              return (
                <g key={`lbl-${i}`}>
                  <circle cx={x} cy={ySun} r="2.5" fill="#f59e0b" />
                  <text
                    x={x}
                    y={ySun - 6}
                    textAnchor="middle"
                    fill="#fde68a"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    {pt.sunElevation}°
                  </text>
                </g>
              );
            })}

          {/* Cursor Scrubber Vertical Interactivo */}
          {activePoint && hoverIndex !== null && (
            <g pointerEvents="none">
              {/* Línea vertical de escaneo */}
              <line
                x1={getX(hoverIndex)}
                y1={PADDING.top}
                x2={getX(hoverIndex)}
                y2={SVG_HEIGHT - PADDING.bottom}
                stroke="#22d3ee"
                strokeWidth="1.5"
                strokeDasharray="2,2"
              />

              {/* Punto de intersección Solar */}
              <circle
                cx={getX(hoverIndex)}
                cy={getY(activePoint.sunElevation)}
                r="4.5"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Punto de intersección Tierra DTE */}
              <circle
                cx={getX(hoverIndex)}
                cy={getY(activePoint.earthElevation)}
                r="4"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Resumen compacto de telemetría de energía y enlace */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5 pt-1.5 border-t border-slate-800/60 text-[10px] sm:text-[11px]">
        <div className="flex items-center gap-1.5">
          {powerPercentage >= 65 ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          )}
          <span className="text-slate-300">
            Ventana Solar Útil:{' '}
            <strong className={powerPercentage >= 65 ? 'text-emerald-400' : 'text-amber-400'}>
              {powerPercentage}%
            </strong>{' '}
            ({totalPowerHours}h totales)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {commContinuous ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-slate-300">
            Visibilidad DTE con Tierra:{' '}
            <strong className={commContinuous ? 'text-cyan-400' : 'text-rose-400'}>
              {commContinuous ? 'Continua' : 'Intermitente (Sombra)'}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
