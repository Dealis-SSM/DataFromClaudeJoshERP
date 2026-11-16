import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock,
  FileSearch,
  GitCompareArrows,
  Layers,
} from 'lucide-react';
import {
  BUSINESS_DATA_RECORDS,
  CONTRADICTIONS,
  FORMULA_MODELS,
  REPO_TRIAGE_SUMMARY,
  TIMELINE_ERAS,
} from '../data/estrumetalAuditData';
import type { ShopSmartSwitches } from '../utils/shopSmartAudit';
import { MachineModelsComparisonSection } from './MachineModelsComparisonSection';
import { ShopSmartAuditSection } from './ShopSmartAuditSection';
import type { ActiveTab } from './TopBar';

interface OverviewSectionProps {
  onNavigate: (tab: ActiveTab, options?: { filterMisused?: boolean; focusSimulator?: boolean }) => void;
  shopSmartSwitches: ShopSmartSwitches;
  onChangeShopSmartSwitches: (next: ShopSmartSwitches) => void;
}

export function OverviewSection({
  onNavigate,
  shopSmartSwitches,
  onChangeShopSmartSwitches,
}: OverviewSectionProps) {
  const misusedCount = BUSINESS_DATA_RECORDS.filter((r) => r.usageAndAudit.wasMisused).length;
  const openContradictionsCount = CONTRADICTIONS.filter(
    (c) => c.status !== 'resuelta_aplicada'
  ).length;

  return (
    <div className="space-y-8">
      {/* Encabezado Ejecutivo */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#002054]">
              Triaje de Repositorio · {REPO_TRIAGE_SUMMARY.archivesAnalyzed} archivos ZIP analizados
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Auditoría completa de datos, fórmulas y errores de cotización de Estrumetal
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
              Se filtraron únicamente los chats, proyectos, memorias y artefactos vinculados a{' '}
              <strong className="font-semibold text-slate-900">Estrumetal</strong> (y maquila{' '}
              <strong className="font-semibold text-slate-900">Celindi</strong>) sobre cómo costear y
              cotizar. Se excluyeron{' '}
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {REPO_TRIAGE_SUMMARY.excludedConversationsCount}
              </span>{' '}
              chats personales o de cuenta prestada (Albion Online, trading, Beca 18, poesía, etc.).
              Cada hallazgo separa <strong className="text-slate-900">datos brutos</strong>,{' '}
              <strong className="text-slate-900">cómo se usaron o fallaron en sesiones posteriores</strong> y{' '}
              <strong className="text-slate-900">cuál es el producto final vigente</strong>.
            </p>
            <p className="font-mono text-xs text-slate-500 tabular-nums">
              Rango temporal verificado: {REPO_TRIAGE_SUMMARY.dateSpan}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 lg:flex-col lg:items-stretch shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('datos', { filterMisused: true })}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
            >
              <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden="true" />
              <span>Ver {misusedCount} casos con errores / mal uso</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('contradicciones')}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
            >
              <GitCompareArrows className="h-4 w-4 text-amber-600" aria-hidden="true" />
              <span>Revisar {CONTRADICTIONS.length} contradicciones</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('modelos', { focusSimulator: true })}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#002054] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b3175]"
            >
              <Calculator className="h-4 w-4" aria-hidden="true" />
              <span>Abrir Simulador de Costeo</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-200 pt-6 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Chats relevantes vs total</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {REPO_TRIAGE_SUMMARY.relevantConversationsCount}{' '}
              <span className="text-sm font-normal text-slate-500">
                / {REPO_TRIAGE_SUMMARY.totalConversations}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {REPO_TRIAGE_SUMMARY.relevantProjectsCount} proyectos de negocio ·{' '}
              {REPO_TRIAGE_SUMMARY.excludedProjectsCount} proyectos excluidos
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">Bloques de datos auditados</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {BUSINESS_DATA_RECORDS.length}
            </p>
            <p className="mt-1 text-xs font-medium text-rose-700">
              {misusedCount} tuvieron errores o subcosteo
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">Contradicciones temporales</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {CONTRADICTIONS.length}
            </p>
            <p className="mt-1 text-xs font-medium text-amber-700">
              {openContradictionsCount} aún requieren ajuste o decisión
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">Modelos finales vigentes</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {FORMULA_MODELS.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Retail Grist · Pintura Grist · Avícola/Celindi · Desgaste Dual
            </p>
          </div>
        </div>
      </section>

      {/* 4 Hallazgos Críticos que cambian cómo cotizar */}
      <section aria-labelledby="hallazgos-criticos-heading" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="hallazgos-criticos-heading"
              className="font-display text-lg font-bold text-slate-900"
            >
              4 hallazgos críticos que cambian el modelo de cotización de fábrica
            </h2>
            <p className="text-sm text-slate-600">
              Diferencias reales detectadas al cruzar Excels históricos, sesiones de agosto–septiembre y
              las auditorías de octubre 2026.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('datos')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#002054] hover:underline shrink-0"
          >
            <span>Explorar los {BUSINESS_DATA_RECORDS.length} expedientes completos</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                Tarifa HH y Horas Fantasma
              </span>
              <span className="font-mono text-xs text-slate-500 tabular-nums">05–06 oct 2026</span>
            </div>
            <h3 className="mt-2 font-display text-base font-bold text-slate-900">
              S/ 28.06/HH actual en Grist vs S/ 37.33/HH real necesaria (+338.6 HH perdidas)
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              La tarifa vigente al 85% (S/ 28.06/HH) omite consumibles de Gestión (S/ 2,425/mes = +S/ 1.64/HH),
              las horas de supervisión de Jorge (+S/ 2.81/HH) y el 84.4% del fondo de máquinas JFY/MIG (+S/ 4.82/HH).
              Además, en Mobilia septiembre hubo <strong className="font-mono text-slate-900">338.6 HH</strong>{' '}
              pagadas sin explicar en lo entregado.
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Pintura, Horno y Decapado
              </span>
              <span className="font-mono text-xs text-slate-500 tabular-nums">25 ago → 07 oct 2026</span>
            </div>
            <h3 className="mt-2 font-display text-base font-bold text-slate-900">
              SSR1_1.xlsx vendía bajo costo; horno real cuesta S/ 54.59 y decapado pesa 60–65%
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              El Excel antiguo tenía 5 fallas graves (ácido fuera del precio, fila 26/36 multiplicada por 36 en
              vez de 8.50). Al auditar OP-0087/0088 se fijó el horno en{' '}
              <strong className="font-mono text-slate-900">S/ 54.59/horneada</strong> (GLP S/ 23.83 + 35 min
              FROR/luz/aire S/ 30.76), se prohibió sumar merma 4.5% al polvo medido y nació la Cartilla Rev. 2
              por área barrida.
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Escala Comercial y Congelamiento
              </span>
              <span className="font-mono text-xs text-slate-500 tabular-nums">14 ago → 05 oct 2026</span>
            </div>
            <h3 className="mt-2 font-display text-base font-bold text-slate-900">
              Margen sobre venta vs Markup (30% = 23.1%) y fuga al cerrar producción en Grist
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Dealis usa <code className="font-mono text-xs text-slate-900">Costo ÷ (1 - Margen)</code> con 5
              decimales mientras José Puma hablaba de markup sobre costo. En Grist, cerrar una producción solo
              congeló <code className="font-mono text-xs text-slate-900">Tarifa_fija</code>, dejando sueldos,
              precios de acero y desgaste vivos.
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#002054]">
                Deuda, JFY y Equilibrio Real
              </span>
              <span className="font-mono text-xs text-slate-500 tabular-nums">03 ago → 06 oct 2026</span>
            </div>
            <h3 className="mt-2 font-display text-base font-bold text-slate-900">
              Punto de equilibrio bajó de S/ 91k/mes a S/ 45,542/mes fijos, pero hay doble conteo potencial
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              En octubre se comprobó un gasto fijo de S/ 45,542/mes (+S/ 8,422 reposición máquinas) → equilibrio
              de <strong className="font-mono text-slate-900">S/ 65k caja / S/ 77k total</strong>. Sin embargo,
              los S/ 8,500/mes de deuda (S/ 5.24/HH) pueden estar duplicando la reposición de la plegadora JFY
              (S/ 4,917.50/mes).
            </p>
          </article>
        </div>
      </section>

      {/* Línea de tiempo evolutiva en 5 eras */}
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Evolución cronológica del modelo de costeo (2011 – Nov 2026)
            </h2>
            <p className="text-sm text-slate-600">
              Por qué los datos más antiguos se contradicen con los criterios actuales de planta y Grist.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('sesiones')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#002054] hover:underline shrink-0"
          >
            <FileSearch className="h-4 w-4" aria-hidden="true" />
            <span>Ver bitácora de {REPO_TRIAGE_SUMMARY.relevantConversationsCount} chats y exclusiones</span>
          </button>
        </div>

        <ol className="divide-y divide-slate-200">
          {TIMELINE_ERAS.map((era, idx) => (
            <li key={era.period} className="py-5 first:pt-4 last:pb-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs font-bold text-[#002054] tabular-nums">
                    0{idx + 1}
                  </span>
                  <h3 className="font-display text-base font-bold text-slate-900">{era.title}</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-slate-500 tabular-nums shrink-0">
                  <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  {era.period}
                </span>
              </div>

              <p className="mt-1.5 text-sm text-slate-600 sm:pl-7">{era.summary}</p>

              <ul className="mt-3 space-y-1.5 sm:pl-7">
                {era.keyMilestones.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-xs text-slate-700 sm:text-sm">
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
                      aria-hidden="true"
                    />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* Mapa de acceso rápido a las vistas */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => onNavigate('datos')}
          className="group rounded-lg border border-slate-200 bg-white p-5 text-left transition-colors hover:border-[#002054]"
        >
          <div className="flex items-center justify-between">
            <Layers className="h-5 w-5 text-[#002054]" aria-hidden="true" />
            <ArrowRight
              className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#002054]"
              aria-hidden="true"
            />
          </div>
          <h3 className="mt-3 font-display text-base font-bold text-slate-900">
            Datos y Trazabilidad Tripartita
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Inspecciona cada dato bruto, si se usó bien o mal, y qué ocurrió en sesiones posteriores.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('contradicciones')}
          className="group rounded-lg border border-slate-200 bg-white p-5 text-left transition-colors hover:border-[#002054]"
        >
          <div className="flex items-center justify-between">
            <GitCompareArrows className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <ArrowRight
              className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#002054]"
              aria-hidden="true"
            />
          </div>
          <h3 className="mt-3 font-display text-base font-bold text-slate-900">
            Contradicciones Antiguo vs Nuevo
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Compara lado a lado las cifras viejas vs las vigentes y el veredicto para el nuevo modelo.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('maquinas')}
          className="group rounded-lg border border-slate-200 bg-white p-5 text-left transition-colors hover:border-[#002054]"
        >
          <div className="flex items-center justify-between">
            <Layers className="h-5 w-5 text-[#002054]" aria-hidden="true" />
            <ArrowRight
              className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#002054]"
              aria-hidden="true"
            />
          </div>
          <h3 className="mt-3 font-display text-base font-bold text-slate-900">
            Máquinas, Luz BT4 y Propuestas
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Gráficos de cómo afectaba cada método, las 20 máquinas y los 3 modelos propuestos.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('modelos', { focusSimulator: true })}
          className="group rounded-lg border border-slate-200 bg-white p-5 text-left transition-colors hover:border-[#002054]"
        >
          <div className="flex items-center justify-between">
            <Calculator className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            <ArrowRight
              className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#002054]"
              aria-hidden="true"
            />
          </div>
          <h3 className="mt-3 font-display text-base font-bold text-slate-900">
            Fórmulas + Simulador de Fábrica
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Prueba escenarios con tarifa S/ 28.06 vs S/ 37.33, ciclones apagados, decapado y margen/markup.
          </p>
        </button>
      </section>

      {/* Sección tipo presentación al bajar: Auditoría interactiva Excel ShopSmart */}
      <ShopSmartAuditSection
        switches={shopSmartSwitches}
        onChangeSwitches={onChangeShopSmartSwitches}
        sectionId="auditoria-shopsmart"
      />

      {/* Sección gráfica al bajar: Comparativa de métodos de maquinaria, mantenimiento y luz + modelos propuestos */}
      <MachineModelsComparisonSection sectionId="maquinas-y-modelos" />
    </div>
  );
}
