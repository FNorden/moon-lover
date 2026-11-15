/**
 * OFFICIAL NASA & PARTNER RESOURCES HUB
 * Scientific Portals, Ephemeris & Topography Data
 * Core System // f_nord
 */
import { ExternalLink, Database, Globe, Compass, ShieldAlert, Layers } from 'lucide-react';

export default function ResourcesView() {
  const recursosOficiales = [
    {
      id: 'quickmap',
      nombre: 'Quickmap (LROC / ASU)',
      entidad: 'Arizona State University & NASA LRO',
      icono: Layers,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
      desc: 'Herramienta cartográfica de alta resolución basada en datos del Lunar Reconnaissance Orbiter. Ideal para inspeccionar pendientes reales, rugosidad del regolito y la topografía escarpada del Polo Sur.',
      url: 'https://quickmap.lroc.asu.edu/',
      urlDirecta: 'https://quickmap.lroc.im-ldi.com/settings?camera=1736683.1032%2C-0.6817%2C-14.1898%2C0%2C0%2C1%2C1%2C0%2C0%2C60&earthShadowEnabled=true&proj=22&stack=3314&defs=N4IgzGCMAsIFygPYAcCGBjAlgFwJ70gF9Cg'
    },
    {
      id: 'moontrek',
      nombre: 'NASA Moon Trek',
      entidad: 'NASA Solar System Treks (JPL)',
      icono: Globe,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
      desc: 'Visualizador 3D interactivo para explorar modelos de elevación digital (LOLA DEM), perfiles de elevación entre cráteres y simulación visual del horizonte lunar.',
      url: 'https://trek.nasa.gov/moon/',
      urlDirecta: 'https://trek.nasa.gov/moon/#v=0.1&x=0&y=0&z=1&p=urn%3Aogc%3Adef%3Acrs%3AEPSG%3A%3A104903&d=&locale=&b=moon&e=-269.999994963537%2C-139.04296615635272%2C269.999994963537%2C139.04296615635272&sfz=&w='
    },
    {
      id: 'horizons',
      nombre: 'JPL Horizons System',
      entidad: 'NASA Jet Propulsion Laboratory (SSD)',
      icono: Compass,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      desc: 'Motor de cálculo de efemérides astronómicas de alta precisión. Genera vectores de posición, velocidad y azimut/elevación del Sol y de la Tierra vistos desde cualquier coordenada selenográfica.',
      url: 'https://ssd.jpl.nasa.gov/horizons/',
      urlDirecta: 'https://ssd.jpl.nasa.gov/horizons/'
    },
    {
      id: 'csa',
      nombre: 'Moon Exploration Portal',
      entidad: 'Canadian Space Agency (CSA / ASC)',
      icono: Database,
      color: 'from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400',
      desc: 'Portal de exploración lunar de la agencia socia canadiense. Tecnologías de rovers polares, investigación científica y aportes al programa Artemis.',
      url: 'https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/',
      urlDirecta: 'https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/'
    }
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-[#05070c] p-6 lg:p-10 font-sans select-none">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="space-y-2 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>Infraestructura de Datos Oficiales</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Fuentes Científicas y Recursos de Misión
          </h1>
          <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
            MOON LOVER sintetiza datos topográficos y efemérides derivadas de los repositorios y sistemas de análisis de la NASA y agencias asociadas. Consulta los portales primarios a continuación:
          </p>
        </div>

        {/* Tarjetas de Recursos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recursosOficiales.map((item) => {
            const Icon = item.icono;
            return (
              <div
                key={item.id}
                className="bg-[#0d121d] border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-xl group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">{item.entidad}</span>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                      {item.nombre}
                    </h2>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center gap-3">
                  <a
                    href={item.urlDirecta}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold transition-all"
                  >
                    <span>Explorar Datos en Vivo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Descargo oficial NASA */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-400">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-300">Aviso Oficial:</strong> NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites. For non-U.S. Government websites, participants must comply with any data use parameters of that specific website.
          </p>
        </div>
      </div>
    </div>
  );
}