/**
 * PHYSICAL GADGET WORKBENCH
 * Especificaciones de Hardware, Electrónica ESP32 & Modelos 3D de NASA Moon Trek
 * System Design // f_nord
 */
import { Cpu, Download, Box, Layers, Wifi, Zap, ExternalLink, CheckCircle } from 'lucide-react';

export default function GadgetView() {
  const piezas3D = [
    {
      nombre: 'Esfera Lunar Topográfica (Polo Sur)',
      archivo: 'moon_south_pole_lola_dem.stl',
      peso: '~180 g (PLA)',
      desc: 'Malla exportada con la herramienta "Generate 3D Print File" de Moon Trek basada en el altímetro láser LOLA.',
      linkMoonTrek: 'https://trek.nasa.gov/moon/'
    },
    {
      nombre: 'Anillo Orbital de Lanzamiento Terrestre',
      archivo: 'earth_launch_ring_fixed.stl',
      peso: '~95 g (PLA)',
      desc: 'Estructura circular fija con dial graduado de azimut y ranura para tira LED direccionable de insolación solar.',
      linkMoonTrek: 'https://trek.nasa.gov/moon/'
    },
    {
      nombre: 'Chasis de Transmisión para Servomotores',
      archivo: 'dual_servo_mount_gearbox.stl',
      peso: '~60 g (PETG)',
      desc: 'Soporte mecánico para 2 servos micro (SG90/MG90S) encargados de orientar la declinación e inclinación axial lunar (1.54°).',
      linkMoonTrek: 'https://trek.nasa.gov/moon/'
    }
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-[#05070c] p-6 lg:p-10 font-sans select-none">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="space-y-2 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Dispositivo Físico y Modelo Educativo</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            MOON LOVER Physical Hardware & 3D Print
          </h1>
          <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
            Una réplica electromecánica a escala que replica en tiempo real las sombras solares polares, la visibilidad de la Tierra y la ventana de lanzamiento mediante microcontrolador ESP32 y servomotores.
          </p>
        </div>

        {/* Diagrama de Arquitectura Física */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-[#0d121d] border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <Wifi className="w-4 h-4" />
              <span className="font-bold">1. Conectividad ESP32</span>
            </div>
            <p className="text-slate-400 font-sans text-xs">
              Recibe las efemérides calculadas por la web vía WebSockets o HTTP local. Procesa el ángulo azimutal del Sol y la posición DTE de la Tierra.
            </p>
          </div>

          <div className="bg-[#0d121d] border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Zap className="w-4 h-4" />
              <span className="font-bold">2. Doble Servo Motor</span>
            </div>
            <p className="text-slate-400 font-sans text-xs">
              Micro-servos MG90S orientan el eje de rotación de la esfera lunar reproduciendo la inclinación de 1.54° y el ciclo sinódico de 29.5 días.
            </p>
          </div>

          <div className="bg-[#0d121d] border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <Box className="w-4 h-4" />
              <span className="font-bold">3. Mapeo Solar LED</span>
            </div>
            <p className="text-slate-400 font-sans text-xs">
              Tira LED Neopixel WS2812B proyecta la luz rasante horizontal sobre el relieve de los cráteres, emulando la iluminación polar real de la NASA.
            </p>
          </div>
        </div>

        {/* Descarga de Archivos 3D (Moon Trek Integration) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Modelos STL Oficiales (Generados con NASA Moon Trek)</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">Licencia NASA Open Data</span>
          </div>

          <div className="space-y-3">
            {piezas3D.map((p, i) => (
              <div 
                key={i}
                className="bg-[#0d121d] border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm font-sans">{p.nombre}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">{p.peso}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-sans">{p.desc}</p>
                </div>

                {/* Botón integrado con Download + ExternalLink */}
                <a
                  href={p.linkMoonTrek}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-2 py-2 px-3.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold transition-all group"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Obtener STL en Moon Trek</span>
                  <ExternalLink className="w-3 h-3 text-cyan-400/60 group-hover:text-cyan-400 transition-colors" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Guía Rápida para Aulas y Hobbistas */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-200 font-mono">Instrucciones de Despliegue en el Aula</h3>
          <ul className="text-xs text-slate-400 space-y-2 font-sans">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Imprime la esfera lunar con relleno de 15% y altura de capa de 0.16 mm para preservar los bordes de los cráteres LOLA.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Carga el firmware de Arduino/ESP32 y conecta el dispositivo a la red Wi-Fi local para sincronizar los relojes en vivo.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}