/**
 * TWIN CLOCKS HUD
 * Sincronización de inyección translunar (TLI) Tierra <-> Luna.
 * Telemetry Bridge // f_nord
 */
import { Clock, Rocket, Moon, ArrowRight, Radio } from 'lucide-react';
import { calcularFechaDespegue, formatearFechaUTC } from '../utils/flightCalculator';

export default function TwinClocks({ missionDate }) {
  const fechaAlunizaje = new Date(missionDate + ':00Z');
  const telemetria = calcularFechaDespegue(fechaAlunizaje);

  return (
    <div className="absolute top-4 right-4 bg-[#0d121d]/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl z-30 w-84 font-mono select-none">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2 text-cyan-400">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wider uppercase">Sincronización Orbital</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>TLI Acoplado</span>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        {/* Reloj Maestro: Luna */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
              <Moon className="w-3.5 h-3.5" /> Alunizaje (Luna - Maestro)
            </span>
            <span className="text-[10px] text-cyan-400/80 uppercase">Touchdown</span>
          </div>
          <div className="text-sm font-bold text-slate-100 tracking-wide">
            {formatearFechaUTC(fechaAlunizaje)}
          </div>
        </div>

        {/* Tránsito Translunar */}
        <div className="flex items-center justify-between px-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1 text-slate-500">
            <ArrowRight className="w-3 h-3 text-cyan-500 rotate-90" />
            <span>Tránsito translunar:</span>
          </div>
          <span className="text-cyan-400 font-semibold">{telemetria.horasVuelo} hrs (~{(telemetria.horasVuelo / 24).toFixed(1)} d)</span>
        </div>

        {/* Reloj Esclavo: Tierra */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <Rocket className="w-3.5 h-3.5" /> Despegue (Tierra - Esclavo)
            </span>
            <span className="text-[10px] text-blue-400/80 uppercase">Ignición</span>
          </div>
          <div className="text-sm font-bold text-slate-100 tracking-wide">
            {formatearFechaUTC(telemetria.fechaDespegueUTC)}
          </div>
        </div>

        {/* Telemetría Dinámica */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-slate-400" />
            Distancia Tierra-Luna:
          </span>
          <span className="text-slate-300 font-bold">{telemetria.distanciaKm.toLocaleString()} km</span>
        </div>
      </div>
    </div>
  );
}