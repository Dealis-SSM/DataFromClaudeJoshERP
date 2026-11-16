import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  FileCode2,
  History,
  Search,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BUSINESS_DATA_RECORDS } from '../data/estrumetalAuditData';
import type { BusinessDataRecord, DataCategory, EvolutionStep, UsageStatus } from '../types/audit';
import { filterAuditItems } from '../utils/costingModels';

const CATEGORIES: Array<DataCategory | 'Todas'> = [
  'Todas',
  'Mano de Obra y Tarifa HH',
  'Maquinaria y Desgaste',
  'Materiales y Mermas',
  'Pintura, Horno y Ciclones',
  'Decapado y Óxido',
  'Energía y Costos Fijos',
  'Reglas Comerciales y Márgenes',
  'Clientes y Lotes Reales',
];

const STATUS_META: Record<
  UsageStatus,
  { label: string; textClass: string; Icon: typeof CheckCircle2 }
> = {
  vigente: { label: 'Vigente / Usado bien', textClass: 'text-emerald-700', Icon: CheckCircle2 },
  corregido: { label: 'Corregido en sesión posterior', textClass: 'text-[#002054]', Icon: Wrench },
  mal_usado: { label: 'Mal usado / Subcosteado', textClass: 'text-rose-700', Icon: AlertOctagon },
  pendiente: { label: 'Pendiente de decisión', textClass: 'text-amber-700', Icon: Clock },
};

const OUTCOME_LABEL: Record<
  EvolutionStep['outcome'],
  { text: string; textClass: string }
> = {
  usado_bien: { text: 'Usado correctamente', textClass: 'text-emerald-700' },
  mal_usado: { text: 'Error / Mal uso detectado', textClass: 'text-rose-700' },
  corregido: { text: 'Corregido / Actualizado', textClass: 'text-[#002054]' },
  pendiente: { text: 'Brecha abierta', textClass: 'text-amber-700' },
};

interface DataTraceabilitySectionProps {
  initialOnlyMisused?: boolean;
}

export function DataTraceabilitySection({
  initialOnlyMisused = false,
}: DataTraceabilitySectionProps) {
  const [category, setCategory] = useState<DataCategory | 'Todas'>('Todas');
  const [status, setStatus] = useState<UsageStatus | 'todos'>('todos');
  const [onlyMisused, setOnlyMisused] = useState<boolean>(initialOnlyMisused);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(BUSINESS_DATA_RECORDS[0]?.id ?? '');

  useEffect(() => {
    if (initialOnlyMisused) {
      setOnlyMisused(true);
    }
  }, [initialOnlyMisused]);

  const filteredRecords = useMemo(
    () =>
      filterAuditItems(BUSINESS_DATA_RECORDS, {
        category,
        status,
        onlyMisused,
        query,
      }),
    [category, status, onlyMisused, query]
  );

  const selectedRecord: BusinessDataRecord | undefined = useMemo(() => {
    const found = filteredRecords.find((r) => r.id === selectedId);
    return found ?? filteredRecords[0];
  }, [filteredRecords, selectedId]);

  const misusedTotal = useMemo(
    () => BUSINESS_DATA_RECORDS.filter((r) => r.usageAndAudit.wasMisused).length,
    []
  );

  return (
    <div className="space-y-6">
      {/* Cabecera y Filtros */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
              Datos de negocio y trazabilidad cronológica
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Cada registro separa explícitamente: <strong>1) Datos brutos</strong>,{' '}
              <strong>2) Cómo se usaron, errores y evolución en otras sesiones</strong> y{' '}
              <strong>3) Producto final resultante</strong>.
            </p>
          </div>
          <div className="font-mono text-xs text-slate-500 tabular-nums shrink-0">
            Mostrando {filteredRecords.length} de {BUSINESS_DATA_RECORDS.length} expedientes
          </div>
        </div>

        {/* Barra de búsqueda + estado + toggle errores */}
        <div className="mt-5 grid gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tarifa, S/ 28.06, JFY, SSR1, PT-0301, Mobilia..."
              aria-label="Buscar en datos de negocio"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#002054] focus:outline-none"
            />
          </div>

          <div className="lg:col-span-4">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UsageStatus | 'todos')}
              aria-label="Filtrar por estado"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#002054] focus:outline-none"
            >
              <option value="todos">Todos los estados</option>
              <option value="mal_usado">Mal usado / Subcosteado actualmente</option>
              <option value="corregido">Corregido en sesiones posteriores</option>
              <option value="vigente">Vigente / Usado bien desde inicio</option>
              <option value="pendiente">Pendiente de decisión</option>
            </select>
          </div>

          <div className="lg:col-span-3 flex items-center">
            <button
              type="button"
              onClick={() => setOnlyMisused((prev) => !prev)}
              aria-pressed={onlyMisused}
              className={`flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                onlyMisused
                  ? 'border-rose-700 bg-rose-50 text-rose-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Con error histórico ({misusedTotal})</span>
            </button>
          </div>
        </div>

        {/* Botones de categoría (rectangulares, sin píldoras) */}
        <div
          role="group"
          aria-label="Categorías de datos"
          className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-200 pt-4"
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-[#002054] bg-[#002054] text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Master-Detail Split */}
      {filteredRecords.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-800">
            No se encontraron expedientes con los filtros actuales.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('Todas');
              setStatus('todos');
              setOnlyMisused(false);
              setQuery('');
            }}
            className="mt-3 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* Lista maestra izquierda */}
          <div className="min-w-0 lg:col-span-5 rounded-lg border border-slate-200 bg-white divide-y divide-slate-200">
            {filteredRecords.map((item) => {
              const isSelected = selectedRecord?.id === item.id;
              const meta = STATUS_META[item.status];
              const StatusIcon = meta.Icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`block w-full p-4 text-left transition-colors ${
                    isSelected ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">{item.category}</span>
                    <span className="font-mono text-xs text-slate-500 tabular-nums shrink-0">
                      {item.firstSeenDate} → {item.lastUpdatedDate}
                    </span>
                  </div>
                  <h2 className="mt-1 font-display text-sm font-bold text-slate-900">
                    {item.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className={`inline-flex items-center gap-1 font-semibold ${meta.textClass}`}>
                      <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {meta.label}
                    </span>
                    {item.usageAndAudit.wasMisused && (
                      <span className="font-medium text-rose-700">· Tuvo mal uso/error</span>
                    )}
                    <span className="font-mono text-slate-500 tabular-nums">
                      · {item.usageAndAudit.laterSessionsTimeline.length} sesiones
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalle tripartito derecha */}
          {selectedRecord && (
            <article className="min-w-0 lg:col-span-7 rounded-lg border border-slate-200 bg-white">
              {/* Encabezado del expediente */}
              <div className="border-b border-slate-200 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="font-semibold uppercase tracking-wide text-[#002054]">
                    {selectedRecord.category}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="font-mono text-slate-500 tabular-nums">
                    Primera vez: {selectedRecord.firstSeenDate} · Último cambio:{' '}
                    {selectedRecord.lastUpdatedDate}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-xl font-bold text-slate-900">
                  {selectedRecord.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  {(() => {
                    const meta = STATUS_META[selectedRecord.status];
                    const Icon = meta.Icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 font-semibold ${meta.textClass}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        Estado actual: {meta.label}
                      </span>
                    );
                  })()}
                  <span className="text-slate-600">
                    Uso inicial: <strong>{selectedRecord.usageAndAudit.wasUsed ? 'Sí se usó' : 'No conectado'}</strong>
                  </span>
                  <span className="text-slate-600">
                    ¿Mal usado o erróneo?:{' '}
                    <strong className={selectedRecord.usageAndAudit.wasMisused ? 'text-rose-700' : 'text-emerald-700'}>
                      {selectedRecord.usageAndAudit.wasMisused ? 'Sí' : 'No'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Bloque 1: Datos Brutos */}
              <section className="border-b border-slate-200 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Database className="h-4 w-4 text-[#002054]" aria-hidden="true" />
                  <span>1. Datos brutos extraídos de los archivos</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{selectedRecord.rawData.summary}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  Origen: {selectedRecord.rawData.origin}
                </p>

                <div className="mt-4 overflow-x-auto border border-slate-200 rounded-md">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Dato / Concepto</th>
                        <th className="px-3 py-2">Valor bruto</th>
                        <th className="px-3 py-2">Unidad / Contexto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedRecord.rawData.values.map((row) => (
                        <tr key={row.label}>
                          <td className="px-3 py-2 font-medium text-slate-800">{row.label}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-slate-900 tabular-nums">
                            {row.value}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-500">{row.unit || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Bloque 2: Uso, errores y sesiones posteriores */}
              <section className="border-b border-slate-200 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <History className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  <span>2. Qué se hizo con ellos, errores y evolución posterior</span>
                </div>

                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-slate-900">Cómo se aplicaron: </span>
                    <span className="text-slate-700">{selectedRecord.usageAndAudit.howUsed}</span>
                  </div>

                  {selectedRecord.usageAndAudit.wasMisused &&
                    selectedRecord.usageAndAudit.misuseDetail && (
                      <div className="rounded-md border border-rose-200 bg-rose-50/70 p-3.5 text-sm text-rose-950">
                        <p className="font-semibold text-rose-800">
                          Diagnóstico de mal uso / subcosteo / error de fórmula:
                        </p>
                        <p className="mt-1 leading-relaxed">
                          {selectedRecord.usageAndAudit.misuseDetail}
                        </p>
                      </div>
                    )}
                </div>

                {/* Cronología de sesiones */}
                <div className="mt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Trazabilidad cronológica en otras sesiones
                  </h3>
                  <ol className="mt-2.5 divide-y divide-slate-200 border border-slate-200 rounded-md">
                    {selectedRecord.usageAndAudit.laterSessionsTimeline.map((step) => {
                      const out = OUTCOME_LABEL[step.outcome];
                      return (
                        <li key={`${step.date}-${step.sourceId}`} className="p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-mono font-semibold text-slate-900 tabular-nums">
                              {step.date} · {step.sessionTitle}
                            </span>
                            <span className={`font-semibold ${out.textClass}`}>{out.text}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-700">{step.action}</p>
                          <p className="mt-1 font-mono text-xs text-slate-400">
                            Ref: {step.sourceId}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </section>

              {/* Bloque 3: Producto final */}
              <section className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <FileCode2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                    <span>3. Producto final (Fórmula, tabla o regla resultante)</span>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      selectedRecord.finalProduct.isCurrentTruth
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {selectedRecord.finalProduct.isCurrentTruth
                      ? 'Verdad vigente'
                      : 'Requiere implementación pendiente'}
                  </span>
                </div>

                <h3 className="mt-2 font-display text-base font-bold text-slate-900">
                  {selectedRecord.finalProduct.name}
                </h3>

                <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-900 sm:text-sm">
                  {selectedRecord.finalProduct.formulaOrRule}
                </div>

                <p className="mt-2.5 text-xs text-slate-600">
                  <strong>Dónde vive hoy:</strong> {selectedRecord.finalProduct.whereItLives}
                </p>

                {selectedRecord.finalProduct.caveat && (
                  <p className="mt-2 text-xs font-medium text-amber-800">
                    <strong>Atención / Pendiente:</strong> {selectedRecord.finalProduct.caveat}
                  </p>
                )}
              </section>
            </article>
          )}
        </div>
      )}
    </div>
  );
}
