/**
 * NAVIGATION COMPONENT
 * UI Framework // f_nord Design System
 */
import { Menu, Moon, Compass, Cpu, BookOpen, Orbit } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
}) {
  const navItems = [
    { id: 'inicio', label: 'INICIO', icon: Moon },
    { id: 'simulador', label: 'SIMULADOR', icon: Compass },
    { id: 'gadget', label: 'GADGET', icon: Cpu },
    { id: 'recursos', label: 'RECURSOS', icon: BookOpen },
  ];

  return (
    <header className="h-14 bg-[#0d121d] border-b border-slate-800 flex items-center justify-between px-4 select-none z-50 relative">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Alternar panel de parámetros"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={() => setActiveTab('inicio')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Orbit className="w-5 h-5 text-cyan-100" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-wider text-base text-white font-mono flex items-center gap-1.5">
              MOON <span className="text-cyan-400">LOVER</span>
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono -mt-1">
              Engineered by f_nord
            </span>
          </div>
        </div>
      </div>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}