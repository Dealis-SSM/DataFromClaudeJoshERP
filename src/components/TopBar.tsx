import { Calculator, Menu, X } from 'lucide-react';
import { useState } from 'react';

export type ActiveTab =
  | 'resumen'
  | 'shopsmart'
  | 'datos'
  | 'contradicciones'
  | 'modelos'
  | 'sesiones';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenSimulator: () => void;
}

const NAV_ITEMS: Array<{ id: ActiveTab; label: string }> = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'shopsmart', label: 'Caso ShopSmart' },
  { id: 'datos', label: 'Datos y Trazabilidad' },
  { id: 'contradicciones', label: 'Contradicciones' },
  { id: 'modelos', label: 'Fórmulas y Modelos' },
  { id: 'sesiones', label: 'Sesiones' },
];

export function TopBar({ activeTab, onSelectTab, onOpenSimulator }: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        {/* Zona 1: Marca */}
        <button
          type="button"
          onClick={() => handleSelect('resumen')}
          className="flex min-w-0 items-center gap-2 text-left focus:outline-none sm:shrink-0"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#002054] font-display text-sm font-bold tracking-tight text-white">
            EM
          </span>
          <span className="truncate font-display text-sm font-bold tracking-tight text-slate-900 sm:text-base">
            <span className="sm:hidden">Estrumetal</span>
            <span className="hidden sm:inline">Estrumetal · Auditoría de Costeo</span>
          </span>
        </button>

        {/* Zona 2: Navegación escritorio */}
        <nav aria-label="Secciones principales" className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-slate-100 text-[#002054] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zona 3: CTA principal + menú móvil */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onOpenSimulator();
              setMobileMenuOpen(false);
            }}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md bg-[#002054] px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0b3175] sm:gap-2 sm:px-3.5 sm:text-sm"
          >
            <Calculator className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sm:hidden">Simulador</span>
            <span className="hidden sm:inline">Simulador de Fábrica</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {mobileMenuOpen && (
        <nav
          aria-label="Navegación móvil"
          className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-medium ${
                    active
                      ? 'bg-slate-100 text-[#002054] font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && <span className="text-xs font-mono text-[#002054]">Activo</span>}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
