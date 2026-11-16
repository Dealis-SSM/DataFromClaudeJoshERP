import { ArrowDown, CheckCircle2, RotateCcw, SlidersHorizontal, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  ALL_FIXED_SHOPSMART_SWITCHES,
  calculateShopSmartAudit,
  DEFAULT_SHOPSMART_SWITCHES,
  getSingleSwitchIsolatedImpact,
  type ShopSmartSwitches,
} from '../utils/shopSmartAudit';

interface AuditSlideDefinition {
  number: string;
  key: keyof ShopSmartSwitches;
  excelColumnLabel: string;
  title: string;
  whatIsWrongSimple: string;
  whatIsRightSimple: string;
  formulaNote: string;
}

const AUDIT_SLIDES: AuditSlideDefinition[] = [
  {
    number: '01',
    key: 'fixOvertimeJourney',
    excelColumnLabel: 'Tabla 1 · Columna D',
    title: 'Hora extra obligatoria todos los días',
    whatIsWrongSimple:
      'Tu Tabla 1 suma 8.5 h + 1 hora extra (1.25×) = 9.75 horas pagadas por día por defecto, pero luego en K multiplicas los días por 8.5 h.',
    whatIsRightSimple:
      'Cobrar la jornada normal real de 8.5 horas por día (259.68 HH en el lote) y solo cargar horas extra cuando de verdad se hagan.',
    formulaNote: 'Excel: 8.5*H + 1.25*H → Correcto: 8.5*H',
  },
  {
    number: '02',
    key: 'fixIndirectsByHh',
    excelColumnLabel: 'Columna K · Indirectos',
    title: 'Indirectos repartidos por "/17" y no por horas reales',
    whatIsWrongSimple:
      'Repartes gastos indirectos (S/ 2,699) usando fracciones de máquina (5/17, 3.5/17) y un factor "4/12" opaco, en vez de las horas-hombre reales de cada mueble.',
    whatIsRightSimple:
      'Asignar gastos fijos de oficina, supervisión de Jorge y consumibles en proporción directa a las HH de cada mueble (~S/ 16.50/HH).',
    formulaNote: 'Excel: 56.03*8.5*días*4/12 → Correcto: HH_lote × S/ 16.50',
  },
  {
    number: '03',
    key: 'fixLuzRealBt4',
    excelColumnLabel: 'Columna I · Electricidad',
    title: 'Luz inflada a S/ 6,000/mes y cargada al 65% a un cliente',
    whatIsWrongSimple:
      'Supones un recibo de S/ 6,000/mes y le cobras 17 de 26 días de TODA la fábrica (S/ 3,923) a este único pedido. El recibo BT4 real es S/ 4,639/mes.',
    whatIsRightSimple:
      'Cargar solo la proporción real del recibo de Luz del Sur (S/ 4,639/mes) que corresponde a las ~260 HH que ocupa este lote (~S/ 1,450).',
    formulaNote: 'Excel: 6000*(17/26)*(f/17) → Correcto: S/ 1,450 prorrateado por HH',
  },
  {
    number: '04',
    key: 'fixMachineWearJfy',
    excelColumnLabel: 'Columna J · Desgastes',
    title: 'Desgaste de máquinas 85% por debajo del fondo real',
    whatIsWrongSimple:
      'Cargas solo S/ 710.16 en 17 días (equivale a S/ 1,086/mes), cuando el desgaste real de tus 13 máquinas es S/ 8,422/mes (solo la plegadora JFY cuesta S/ 122.94/h).',
    whatIsRightSimple:
      'Sumar el desgaste real de maquinaria de +S/ 4.82 por cada HH trabajada (S/ 1,252 en el lote), según tu auditoría de Grist del 06-oct.',
    formulaNote: 'Excel: 710.16*(f/17) → Correcto: HH_lote × S/ 4.82',
  },
  {
    number: '05',
    key: 'fixLaserDoubleCount',
    excelColumnLabel: 'Columna G · Láser',
    title: 'Doble cobro al operador Rubén dentro de Láser',
    whatIsWrongSimple:
      'En Láser pusiste "14.28 * 4" (4 horas de Rubén Torres a mano), pero en la columna C (Corte) ya cobraste días completos de Rubén, y aun así el láser queda muy bajo (S/ 242).',
    whatIsRightSimple:
      'Sacar el sueldo repetido de Rubén de la columna Láser y cobrar el costo operativo limpio de máquina láser (~S/ 385 proporcionales).',
    formulaNote: 'Excel: (70.8+14.28*4+56.83*2)*(f/17) → Correcto: S/ 385 limpio',
  },
  {
    number: '06',
    key: 'fixGhostQandR',
    excelColumnLabel: 'Columnas Q y R · +S/ 6.00',
    title: 'Columna Q fantasma y +S/ 6.00 escritos a mano en R',
    whatIsWrongSimple:
      'La columna Q calcula "1.5*4*B" pero nadie la lee; luego R vuelve a escribir "+4*1.5" (+S/ 6/mueble = S/ 666) sin título ni saber si es embalaje o error.',
    whatIsRightSimple:
      'Eliminar la fórmula muerta Q y reemplazar el +S/ 6.00 a mano por el costo real estándar de embalaje por mueble (~S/ 1.00/und = S/ 111).',
    formulaNote: 'Excel: R = P + 4*1.5 (Q ignorada) → Correcto: P + S/ 1.00 embalaje',
  },
  {
    number: '07',
    key: 'fixPaintingAndPicklingS',
    excelColumnLabel: 'Columna S · S/ 50 y S/ 80 fijos',
    title: 'Pintura y decapado subestimados a S/ 50–80 fijos',
    whatIsWrongSimple:
      'Si S es pintura/decapado, S/ 50 o S/ 80 por mueble es irreal: en ShopSmart OP-0087 pintar y decapar solo 3 muebles costó S/ 447 (S/ 149 c/u) por ciclones apagados y óxido.',
    whatIsRightSimple:
      'Usar costo realista de pintura + horno (S/ 54.59/horneada) + decapado Rev. 2 (~S/ 115–120 mesas y S/ 145–160 caballetes; o cobrar aparte en Pt_Cotizaciones).',
    formulaNote: 'Excel: S = 50 u 80 fijo → Correcto: S/ 115–160 por mueble',
  },
  {
    number: '08',
    key: 'fixMarginOverSell',
    excelColumnLabel: 'Columna U · "Prec. 1.2" vs 135%',
    title: 'Trampa Markup 135% (solo ganas 25.9% en vez de 35%)',
    whatIsWrongSimple:
      'El título dice "Prec. 1.2", la fórmula multiplica por 135% (markup sobre costo), pero eso solo te deja 25.93% de margen sobre la venta (regalas S/ 5,500+ en el lote).',
    whatIsRightSimple:
      'Usar la regla oficial de Estrumetal: dividir el costo entre (1 - Margen). Para ganar 35% real sobre venta se divide entre 0.65 (equivale a ×1.5385).',
    formulaNote: 'Excel: T * 1.35 (25.93% venta) → Correcto: T / (1 - Margen)',
  },
];

interface ShopSmartAuditSectionProps {
  switches: ShopSmartSwitches;
  onChangeSwitches: (next: ShopSmartSwitches) => void;
  sectionId?: string;
}

function formatDelta(value: number): string {
  const sign = value > 0.005 ? '+' : value < -0.005 ? '-' : '';
  return `${sign}S/ ${Math.abs(value).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function ShopSmartAuditSection({
  switches,
  onChangeSwitches,
  sectionId = 'auditoria-shopsmart',
}: ShopSmartAuditSectionProps) {
  const [targetMarginPct, setTargetMarginPct] = useState<35 | 40>(35);

  const summary = useMemo(
    () => calculateShopSmartAudit(switches, targetMarginPct),
    [switches, targetMarginPct]
  );

  const isolatedImpacts = useMemo(() => {
    const map = {} as Record<keyof ShopSmartSwitches, { costDelta: number; priceDelta: number }>;
    for (const slide of AUDIT_SLIDES) {
      map[slide.key] = getSingleSwitchIsolatedImpact(slide.key, targetMarginPct);
    }
    return map;
  }, [targetMarginPct]);

  const toggleOne = (key: keyof ShopSmartSwitches) => {
    onChangeSwitches({ ...switches, [key]: !switches[key] });
  };

  return (
    <section
      id={sectionId}
      aria-labelledby="shopsmart-audit-heading"
      className="space-y-6 scroll-mt-20"
    >
      {/* Cabecera tipo presentación + Marcador en vivo */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#002054]">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span>Presentación Interactiva · Hoja "Cot" ShopSmart (19/10/2026)</span>
            </div>
            <h2
              id="shopsmart-audit-heading"
              className="mt-1 font-display text-xl font-bold text-slate-900 sm:text-2xl"
            >
              Qué está mal en tu último Excel y cómo cambian las cuentas paso a paso
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Enciende o apaga cada switch <strong>uno por uno</strong> para ver en sencillo qué
              estaba mal en tu hoja y exactamente cuántos soles mueve ese error en el costo y en el
              precio final del lote (111 muebles).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center rounded-md border border-slate-300 bg-slate-50 p-0.5 text-xs">
              <span className="px-2 font-medium text-slate-600">Meta U:</span>
              <button
                type="button"
                onClick={() => setTargetMarginPct(35)}
                className={`rounded px-2 py-1 font-mono font-semibold transition-colors ${
                  targetMarginPct === 35
                    ? 'bg-[#002054] text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                35%
              </button>
              <button
                type="button"
                onClick={() => setTargetMarginPct(40)}
                className={`rounded px-2 py-1 font-mono font-semibold transition-colors ${
                  targetMarginPct === 40
                    ? 'bg-[#002054] text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                40%
              </button>
            </div>

            <button
              type="button"
              onClick={() => onChangeSwitches(DEFAULT_SHOPSMART_SWITCHES)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ver todo como Excel (0/8)</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeSwitches(ALL_FIXED_SHOPSMART_SWITCHES)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#002054] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0b3175]"
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Corregir los 8 (8/8)</span>
            </button>
          </div>
        </div>

        {/* Marcador comparativo en vivo */}
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Costo total del lote (111 pzas)</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              S/ {summary.totalLotCost.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums">
              Excel: S/ {summary.origTotalLotCost.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span
                className={
                  summary.costDeltaVsExcel > 1
                    ? 'font-semibold text-rose-700'
                    : summary.costDeltaVsExcel < -1
                    ? 'font-semibold text-emerald-700'
                    : ''
                }
              >
                ({formatDelta(summary.costDeltaVsExcel)})
              </span>
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">Precio venta lote (sin IGV)</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[#002054] tabular-nums">
              S/ {summary.totalLotPriceNoIgv.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums">
              Excel: S/ {summary.origTotalLotPriceNoIgv.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span
                className={
                  summary.priceDeltaVsExcel > 1
                    ? 'font-semibold text-[#002054]'
                    : summary.priceDeltaVsExcel < -1
                    ? 'font-semibold text-amber-700'
                    : ''
                }
              >
                ({formatDelta(summary.priceDeltaVsExcel)})
              </span>
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">Margen real sobre la venta</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {summary.effectiveMarginOnSellPct.toFixed(2)}%
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums">
              Excel: 25.93% · Markup actual: {summary.effectiveMarkupPct.toFixed(1)}%
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">Correcciones activas</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {summary.activeFixesCount}{' '}
              <span className="text-sm font-normal text-slate-500">/ 8</span>
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {summary.activeFixesCount === 0
                ? 'Mostrando números tal cual tu Excel'
                : summary.activeFixesCount === 8
                ? 'Todos los ajustes Estrumetal activos'
                : 'Simulación parcial paso a paso'}
            </p>
          </div>
        </div>
      </div>

      {/* Grilla tipo presentación (8 tarjetas 2x4 con switch individual) */}
      <div className="grid gap-4 md:grid-cols-2">
        {AUDIT_SLIDES.map((slide) => {
          const isFixed = switches[slide.key];
          const impact = isolatedImpacts[slide.key];

          return (
            <article
              key={slide.key}
              className={`rounded-lg border bg-white p-5 transition-colors ${
                isFixed ? 'border-emerald-600' : 'border-slate-200'
              }`}
            >
              {/* Encabezado de diapositiva + Switch */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                    <span className="font-mono font-bold text-[#002054] tabular-nums">
                      {slide.number}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500">{slide.excelColumnLabel}</span>
                  </div>
                  <h3 className="mt-1 font-display text-base font-bold text-slate-900">
                    {slide.title}
                  </h3>
                </div>

                {/* Switch botón accesible */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isFixed}
                  aria-label={`Cambiar ${slide.title} a ${isFixed ? 'Excel incorrecto' : 'Corregido'}`}
                  onClick={() => toggleOne(slide.key)}
                  className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors shrink-0 ${
                    isFixed
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                      isFixed ? 'bg-emerald-700' : 'bg-rose-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        isFixed ? 'translate-x-3.5' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                  <span>{isFixed ? 'Corregido' : 'Excel (Mal)'}</span>
                </button>
              </div>

              {/* Comparativa sencilla: Mal vs Bien */}
              <div className="mt-4 space-y-2.5 text-xs sm:text-sm">
                <div
                  className={`rounded-md border p-3 ${
                    !isFixed
                      ? 'border-rose-200 bg-rose-50/60 text-slate-900'
                      : 'border-slate-200 bg-slate-50/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rose-700">
                    <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Qué está mal en el Excel</span>
                  </div>
                  <p className="mt-1 leading-relaxed">{slide.whatIsWrongSimple}</p>
                </div>

                <div
                  className={`rounded-md border p-3 ${
                    isFixed
                      ? 'border-emerald-200 bg-emerald-50/60 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Cómo queda al corregirlo</span>
                  </div>
                  <p className="mt-1 leading-relaxed">{slide.whatIsRightSimple}</p>
                </div>
              </div>

              {/* Impacto unitario de este switch */}
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs">
                <span className="font-mono text-slate-500">{slide.formulaNote}</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  Solo este cambio: Costo {formatDelta(impact.costDelta)} · Venta{' '}
                  {formatDelta(impact.priceDelta)}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Tabla en vivo de los 5 productos */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">
              Resultado en vivo por producto según los switches activos
            </h3>
            <p className="text-xs text-slate-600 sm:text-sm">
              Compara cada fila de tu hoja <code>Cot</code> original (T y U) contra el cálculo
              actualizado con los switches que encendiste arriba.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums shrink-0">
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            Total con IGV (18%): S/{' '}
            {summary.totalLotPriceWithIgv.toLocaleString('es-PE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-2.5">Producto (Fila)</th>
                <th className="px-3 py-2.5 text-right">Cant.</th>
                <th className="px-3 py-2.5 text-right">Costo T Excel</th>
                <th className="px-3 py-2.5 text-right">Costo Actual</th>
                <th className="px-3 py-2.5 text-right">Precio U Excel</th>
                <th className="px-3 py-2.5 text-right">Precio Actual</th>
                <th className="px-3 py-2.5 text-right">Dif. Precio / und</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
              {summary.rows.map((r) => {
                const diffPriceUnit = r.unitPriceU - r.origUnitPriceU;
                return (
                  <tr key={r.row} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 font-sans font-semibold text-slate-900">
                      {r.name}{' '}
                      <span className="font-mono text-xs font-normal text-slate-400">
                        (F{r.row})
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-700">{r.qty}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500">
                      S/ {r.origUnitCostT.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                      S/ {r.unitCostT.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-500">
                      S/ {r.origUnitPriceU.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-[#002054]">
                      S/ {r.unitPriceU.toFixed(2)}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-semibold ${
                        diffPriceUnit > 0.05
                          ? 'text-[#002054]'
                          : diffPriceUnit < -0.05
                          ? 'text-amber-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {formatDelta(diffPriceUnit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
