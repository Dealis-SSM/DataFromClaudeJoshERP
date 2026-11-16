import { CheckCircle2, Clock, GitCompareArrows, HelpCircle, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CONTRADICTIONS } from '../data/estrumetalAuditData';
import type { ContradictionStatus } from '../types/audit';
import { filterContradictions } from '../utils/costingModels';

const STATUS_FILTERS: Array<{ id: ContradictionStatus | 'todas'; label: string }> = [
  { id: 'todas', label: 'Todas (12)' },
  { id: 'resuelta_aplicada', label: 'Resueltas y aplicadas en Grist' },
  { id: 'resuelta_pendiente_aplicar', label: 'Resueltas, pendiente aplicar' },
  { id: 'decision_abierta', label: 'Decisión gerencial abierta' },
];

const STATUS_BADGE: Record<
  ContradictionStatus,
  { label: string; textClass: string; Icon: typeof CheckCircle2 }
> = {
  resuelta_aplicada: {
    label: 'Resuelta y aplicada',
    textClass: 'text-emerald-700',
    Icon: CheckCircle2,
  },
  resuelta_pendiente_aplicar: {
    label: 'Resuelta, pendiente en sistema',
    textClass: 'text-amber-700',
    Icon: Clock,
  },
  decision_abierta: {
    label: 'Decisión abierta (Josué)',
    textClass: 'text-rose-700',
    Icon: HelpCircle,
  },
};

export function ContradictionsSection() {
  const [status, setStatus] = useState<ContradictionStatus | 'todas'>('todas');
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => filterContradictions(CONTRADICTIONS, { status, query }),
    [status, query]
  );

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
              Contradicciones cronológicas: Dato Antiguo vs Dato Nuevo
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Cifras y criterios que cambiaron entre 2011/2021, julio–agosto 2026 y las auditorías
              de septiembre–octubre 2026, junto con el veredicto para tu modelo definitivo.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums shrink-0">
            {filtered.length} de {CONTRADICTIONS.length} contradicciones
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
            {STATUS_FILTERS.map((f) => {
              const active = status === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatus(f.id)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-[#002054] bg-[#002054] text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tema, tarifa, horno, deuda, USD..."
              aria-label="Buscar en contradicciones"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#002054] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Lista de contradicciones */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-800">
            Ninguna contradicción coincide con la búsqueda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const meta = STATUS_BADGE[item.status];
            const Icon = meta.Icon;
            return (
              <article
                key={item.id}
                className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6"
              >
                <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <GitCompareArrows className="h-3.5 w-3.5 text-[#002054]" aria-hidden="true" />
                      <span className="font-semibold uppercase tracking-wide text-[#002054]">
                        {item.category}
                      </span>
                    </div>
                    <h2 className="mt-1 font-display text-base font-bold text-slate-900 sm:text-lg">
                      {item.topic}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 ${meta.textClass}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {meta.label}
                  </span>
                </div>

                {/* Comparativa Lado a Lado */}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-rose-200 bg-rose-50/40 p-4">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold uppercase tracking-wide text-rose-800">
                        Dato / Criterio Antiguo
                      </span>
                      <span className="font-mono text-rose-700 tabular-nums">{item.older.date}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {item.older.claimOrValue}
                    </p>
                    <p className="mt-1.5 font-mono text-xs text-slate-500">
                      Fuente: {item.older.source}
                    </p>
                  </div>

                  <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold uppercase tracking-wide text-emerald-800">
                        Dato / Criterio Nuevo
                      </span>
                      <span className="font-mono text-emerald-700 tabular-nums">
                        {item.newer.date}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {item.newer.claimOrValue}
                    </p>
                    <p className="mt-1.5 font-mono text-xs text-slate-500">
                      Fuente: {item.newer.source}
                    </p>
                  </div>
                </div>

                {/* Explicación y Veredicto */}
                <dl className="mt-4 grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Por qué se contradicen
                    </dt>
                    <dd className="mt-1 text-slate-700">{item.whyContradicts}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Impacto en cotización
                    </dt>
                    <dd className="mt-1 text-slate-700">{item.impactOnQuoting}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#002054]">
                      Veredicto para el modelo de fábrica
                    </dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {item.verdictForFactoryModel}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
