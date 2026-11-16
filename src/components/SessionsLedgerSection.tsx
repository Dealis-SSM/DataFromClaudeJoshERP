import { Ban, FileText, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EXCLUDED_CLUSTERS, RELEVANT_SESSIONS, REPO_TRIAGE_SUMMARY } from '../data/estrumetalAuditData';
import type { SessionRecord } from '../types/audit';

const DOMAINS: Array<SessionRecord['domain'] | 'Todos'> = [
  'Todos',
  'Estrumetal Cotización',
  'Pintura y Decapado',
  'Grist / Sistemas',
  'Mano de Obra y Tarifa HH',
  'Energía / Planta',
];

export function SessionsLedgerSection() {
  const [domain, setDomain] = useState<SessionRecord['domain'] | 'Todos'>('Todos');
  const [query, setQuery] = useState('');

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RELEVANT_SESSIONS.filter((s) => {
      if (domain !== 'Todos' && s.domain !== domain) return false;
      if (!q) return true;
      return [
        s.title,
        s.uuidPrefix,
        s.rawInputs,
        s.whatWasDone,
        s.errorsOrCorrections,
        s.finalOutput,
        s.date,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [domain, query]);

  return (
    <div className="space-y-8">
      {/* Bitácora de sesiones relevantes */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#002054]">
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>Sesiones relevantes seleccionadas de conversations-000.zip</span>
            </div>
            <h1 className="mt-1 font-display text-xl font-bold text-slate-900 sm:text-2xl">
              Bitácora cronológica de sesiones y auditoría de exclusión
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Resumen trazable de las sesiones clave sobre cotización, tarifas y Grist, más el
              desglose de los{' '}
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {REPO_TRIAGE_SUMMARY.excludedConversationsCount}
              </span>{' '}
              chats excluidos (cuenta prestada y vida personal).
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums shrink-0">
            {filteredSessions.length} de {RELEVANT_SESSIONS.length} sesiones clave
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por dominio">
            {DOMAINS.map((d) => {
              const active = domain === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDomain(d)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-[#002054] bg-[#002054] text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar chat, Prodac, Mobilia, SSR1..."
              aria-label="Buscar en sesiones"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#002054] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-2.5 whitespace-nowrap">Fecha / ID</th>
                <th className="px-3 py-2.5">Sesión y Dominio</th>
                <th className="px-3 py-2.5">Datos Brutos</th>
                <th className="px-3 py-2.5">Qué se hizo / Errores</th>
                <th className="px-3 py-2.5">Producto Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 align-top">
              {filteredSessions.map((s) => (
                <tr key={s.uuidPrefix} className="hover:bg-slate-50/70">
                  <td className="px-3 py-3 font-mono text-xs text-slate-600 whitespace-nowrap tabular-nums">
                    <div className="font-semibold text-slate-900">{s.date}</div>
                    <div className="text-slate-400">{s.uuidPrefix}</div>
                    <div className="text-slate-400">{s.msgCount} msgs</div>
                  </td>
                  <td className="px-3 py-3 min-w-[200px]">
                    <div className="text-xs font-semibold text-[#002054]">{s.domain}</div>
                    <div className="mt-0.5 font-display font-bold text-slate-900">{s.title}</div>
                  </td>
                  <td className="px-3 py-3 min-w-[210px] text-slate-700">{s.rawInputs}</td>
                  <td className="px-3 py-3 min-w-[240px] space-y-1.5">
                    <p className="text-slate-700">{s.whatWasDone}</p>
                    <p className="text-xs font-medium text-rose-700">
                      <strong>Ajuste/Error:</strong> {s.errorsOrCorrections}
                    </p>
                  </td>
                  <td className="px-3 py-3 min-w-[180px] font-medium text-emerald-800">
                    {s.finalOutput}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabla de Clusters Excluidos */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700">
          <Ban className="h-4 w-4" aria-hidden="true" />
          <span>Material filtrado y excluido del análisis</span>
        </div>
        <h2 className="mt-1 font-display text-lg font-bold text-slate-900">
          {REPO_TRIAGE_SUMMARY.excludedConversationsCount} chats y{' '}
          {REPO_TRIAGE_SUMMARY.excludedProjectsCount} proyectos descartados (cuenta prestada y uso
          personal)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Se inspeccionaron los índices y proyectos completos para garantizar que ninguna cifra
          ajena contamine tus modelos de Estrumetal.
        </p>

        <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-2.5">Grupo excluido</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Volumen estimado</th>
                <th className="px-3 py-2.5">Ejemplos verificados en ZIPs</th>
                <th className="px-3 py-2.5">Motivo de exclusión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 align-top">
              {EXCLUDED_CLUSTERS.map((cluster) => (
                <tr key={cluster.label}>
                  <td className="px-3 py-3 font-semibold text-slate-900">{cluster.label}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-600 whitespace-nowrap tabular-nums">
                    {cluster.countEstimate}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{cluster.examples.join(' · ')}</td>
                  <td className="px-3 py-3 text-slate-600">{cluster.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
