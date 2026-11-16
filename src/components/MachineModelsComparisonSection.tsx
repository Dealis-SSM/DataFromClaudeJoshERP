import { Activity, CheckCircle2, Cpu, Gauge, Search, Sliders, Wrench, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  BT4_ELECTRICITY_BREAKDOWN,
  calcEffectiveFrorAtHours,
  DEFAULT_CALIBRATION_PARAMS,
  evaluateMethodComparison,
  NON_GRIST_PAINT_AND_TOOL_ASSETS,
  PLANT_MACHINES,
  type MethodOutcomeRow,
  type PlantCalibrationParams,
  type RotationTier,
  type ScenarioId,
} from '../utils/machineCostingAnalysis';

const SCENARIO_TABS: Array<{ id: ScenarioId; label: string }> = [
  { id: 'planta_mensual', label: 'Planta Mensual (1,650 HH)' },
  { id: 'lote_chapa_jfy', label: 'Chapa + JFY + Láser (60 HH)' },
  { id: 'lote_alambre_retail', label: 'Alambre Retail (20 HH)' },
  { id: 'lote_horno_pintura', label: 'Horno + Pintura (10 tandas)' },
];

const PROPOSED_MODELS = [
  {
    code: 'Propuesta A',
    title: 'Híbrido Práctico (HH Base + 5 Máquinas Críticas)',
    accuracyRange: '88% – 92%',
    effort: 'Bajo · 1 día de ajuste en Grist',
    targetUse: 'Cotización rápida diaria (Retail + Mobiliario)',
    equation:
      'Costo_Maq_y_Energia = (HH_lote × S/ 3.45 [mant.+luz+menores]) + Suma(Horas_5_Pesadas × FROR_ajustada)',
    whatChanges:
      'Deja de intentar cronometrar 20 máquinas pequeñas (esmeril S/ 0.12/h, punto S/ 3.97/h) y pasa mantenimiento/consumibles (S/ 1.64/HH) + desgaste menor a la tarifa HH; pero activa eventos obligatorios para JFY, Durmas, Láser y Horno.',
    whyImproves:
      'Elimina de golpe el 84.4% de fuga de desgaste en chapa/plegado sin castigar el alambre retail con S/ 4.82/HH planos, y retira la duplicidad entre deuda (S/ 8,500) y reposición JFY (S/ 4,917.50).',
  },
  {
    code: 'Propuesta B',
    title: 'Modo C Dual + Mantenimiento % + BT4 Desacoplada',
    accuracyRange: '94% – 96%',
    effort: 'Medio · 1 semana de calibración',
    targetUse: 'Estándar oficial de fábrica para cotizar y planificar',
    equation:
      'Tarifa_Maq = [FROR_Uso + Mant_Prev/h + (kW × S/ 0.37)] ; Obsolescencia_Tiempo + Demanda_kW_BT4 → Bolsa Fija Mensual',
    whatChanges:
      'Parte el FROR en dos: (1) Tiempo calendario (obsolescencia) a costos fijos según ocupación real, y (2) Uso mecánico + mantenimiento preventivo por hora trabajada. Separa la energía marginal (S/ 0.37/kWh) de la potencia pico (63% del recibo).',
    whyImproves:
      'Resuelve la paradoja de la Plegadora JFY: a 40 h/mes la tarifa plena (S/ 122.94/h) puede sacarte de mercado, pero Modo C cobra el desgaste mecánico real sin regalarla ni espantar al cliente cuando sube la producción.',
  },
  {
    code: 'Propuesta C',
    title: 'Ingeniería Medida (Pinza + Pico 7am + Submedidor)',
    accuracyRange: '97% – 99%',
    effort: 'Alto · Pinza S/ 150 + submedidor',
    targetUse: 'Auditoría fina, maquilas de alto consumo y control BT4',
    equation:
      'Luz_Maq = (kW_pinza × h × S/ 0.37) + Factor_Pico_7am(kW_arranque × S/ 111 ÷ h_mes) ; Recibo_Planta = BT4 - Vivienda - Fugas',
    whatChanges:
      'Mide amperios reales con pinza (trifásico kW = 0.30 × A), descuenta el submedidor de la vivienda de 2 pisos (~S/ 420/mes), corrige el factor de potencia (cos φ 0.77 → 0.96 ahorrando S/ 105.55/mes) y asigna demanda pico a arranques fuertes como el Atlas Copco 11 kW.',
    whyImproves:
      'Convierte la electricidad de un supuesto ciego (S/ 6,000 en Excel o S/ 3,892 fijos) en un costo técnico medido al 98%, exponiendo exactamente cuánto desperdicio venía de fugas de aire y de la vivienda.',
  },
];

function formatMoney(v: number): string {
  return `S/ ${v.toLocaleString('es-PE', {
    minimumFractionDigits: v >= 1000 ? 0 : 2,
    maximumFractionDigits: v >= 1000 ? 0 : 2,
  })}`;
}

function formatMoneyPrecise(v: number): string {
  return `S/ ${v.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatSignedMoney(v: number): string {
  const sign = v > 0.5 ? '+' : v < -0.5 ? '-' : '';
  return `${sign}S/ ${Math.abs(v).toLocaleString('es-PE', {
    minimumFractionDigits: v >= 1000 || v <= -1000 ? 0 : 2,
    maximumFractionDigits: v >= 1000 || v <= -1000 ? 0 : 2,
  })}`;
}

export function MachineModelsComparisonSection({ sectionId = 'maquinas-y-modelos' }: { sectionId?: string }) {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('planta_mensual');
  const [params, setParams] = useState<PlantCalibrationParams>(DEFAULT_CALIBRATION_PARAMS);
  const [selectedMethodId, setSelectedMethodId] = useState<MethodOutcomeRow['id']>('propuesta_b_modo_c');
  const [rotationFilter, setRotationFilter] = useState<RotationTier | 'todas'>('todas');
  const [machineQuery, setMachineQuery] = useState('');

  const comparison = useMemo(
    () => evaluateMethodComparison(scenarioId, params),
    [scenarioId, params]
  );

  const selectedMethod = useMemo(
    () => comparison.methods.find((m) => m.id === selectedMethodId) ?? comparison.methods[4],
    [comparison, selectedMethodId]
  );

  const maxChartValue = useMemo(() => {
    const allTotals = [
      comparison.realityBenchmark.totalSoles,
      ...comparison.methods.map((m) => m.totalSoles),
    ];
    return Math.max(...allTotals, 1) * 1.15;
  }, [comparison]);

  // Curva FROR vs Horas/mes para las 3 máquinas críticas
  const utilizationPoints = [20, 40, 60, 80, 100, 120, 160];
  const jfy = PLANT_MACHINES.find((m) => m.id === 6)!;
  const laser = PLANT_MACHINES.find((m) => m.id === 1)!;
  const horno = PLANT_MACHINES.find((m) => m.id === 5)!;

  const jfyLive = calcEffectiveFrorAtHours(jfy, params.jfyMonthlyHours);
  const laserLive = calcEffectiveFrorAtHours(laser, params.laserMonthlyHours);
  const hornoLive = calcEffectiveFrorAtHours(horno, params.hornoMonthlyHours);

  const filteredMachines = useMemo(() => {
    const q = machineQuery.trim().toLowerCase();
    return PLANT_MACHINES.filter((m) => {
      if (rotationFilter !== 'todas' && m.rotationTier !== rotationFilter) return false;
      if (!q) return true;
      return `${m.name} ${m.group} ${m.statusNote}`.toLowerCase().includes(q);
    });
  }, [rotationFilter, machineQuery]);

  // Coordenadas SVG para la curva de utilización (viewBox 0 0 560 220)
  const curvePaths = useMemo(() => {
    const xForHrs = (h: number) => 52 + ((h - 20) / (160 - 20)) * 476;
    const yForRate = (r: number) => 182 - (Math.min(260, r) / 260) * 156;

    const buildLine = (machine: typeof jfy) =>
      utilizationPoints
        .map((h, i) => {
          const res = calcEffectiveFrorAtHours(machine, h);
          return `${i === 0 ? 'M' : 'L'} ${xForHrs(h).toFixed(1)} ${yForRate(res.frorPurePerHour).toFixed(1)}`;
        })
        .join(' ');

    return {
      xForHrs,
      yForRate,
      jfyPath: buildLine(jfy),
      laserPath: buildLine(laser),
      hornoPath: buildLine(horno),
    };
  }, [jfy, laser, horno]);

  return (
    <section
      id={sectionId}
      aria-labelledby="maquinas-modelos-heading"
      className="space-y-8 scroll-mt-20"
    >
      {/* Cabecera principal + Controles de escenario */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#002054]">
              <Gauge className="h-4 w-4" aria-hidden="true" />
              <span>Comparativa Gráfica de Métodos y Parque de 20 Máquinas</span>
            </div>
            <h2
              id="maquinas-modelos-heading"
              className="mt-1 font-display text-xl font-bold text-slate-900 sm:text-2xl"
            >
              Cómo afectaba usar cada método (desgaste, mantenimiento y luz) y los 3 modelos propuestos
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Cambia el escenario o mueve las horas mensuales reales de la planta para ver gráficamente
              por qué el Excel y el Grist actual subcostean o distorsionan el precio, y cuánto se
              aproximan a la realidad los 3 modelos nuevos.
            </p>
          </div>
        </div>

        {/* Selector de escenario */}
        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Escenario de comparación">
          {SCENARIO_TABS.map((tab) => {
            const active = scenarioId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setScenarioId(tab.id)}
                className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  active
                    ? 'border-[#002054] bg-[#002054] text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sliders de calibración de planta */}
        <div className="mt-5 grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
              <label htmlFor="slider-jfy">Horas Plegadora JFY / mes</label>
              <span className="font-mono font-bold text-[#002054] tabular-nums">
                {params.jfyMonthlyHours} h (S/ {jfyLive.frorPurePerHour.toFixed(2)}/h)
              </span>
            </div>
            <input
              id="slider-jfy"
              type="range"
              min={20}
              max={160}
              step={5}
              value={params.jfyMonthlyHours}
              onChange={(e) =>
                setParams((p) => ({ ...p, jfyMonthlyHours: Number(e.target.value) }))
              }
              className="mt-2 w-full accent-[#002054]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
              <label htmlFor="slider-laser">Horas Láser / mes</label>
              <span className="font-mono font-bold text-[#002054] tabular-nums">
                {params.laserMonthlyHours} h (S/ {laserLive.frorPurePerHour.toFixed(2)}/h)
              </span>
            </div>
            <input
              id="slider-laser"
              type="range"
              min={20}
              max={160}
              step={5}
              value={params.laserMonthlyHours}
              onChange={(e) =>
                setParams((p) => ({ ...p, laserMonthlyHours: Number(e.target.value) }))
              }
              className="mt-2 w-full accent-[#002054]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
              <label htmlFor="slider-horno">Horas Horno / mes</label>
              <span className="font-mono font-bold text-[#002054] tabular-nums">
                {params.hornoMonthlyHours} h (S/ {hornoLive.frorPurePerHour.toFixed(2)}/h)
              </span>
            </div>
            <input
              id="slider-horno"
              type="range"
              min={15}
              max={120}
              step={5}
              value={params.hornoMonthlyHours}
              onChange={(e) =>
                setParams((p) => ({ ...p, hornoMonthlyHours: Number(e.target.value) }))
              }
              className="mt-2 w-full accent-[#002054]"
            />
          </div>

          <div className="flex flex-col justify-center">
            <button
              type="button"
              role="switch"
              aria-checked={params.separateHousingFromBt4}
              onClick={() =>
                setParams((p) => ({ ...p, separateHousingFromBt4: !p.separateHousingFromBt4 }))
              }
              className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                params.separateHousingFromBt4
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <span>Separar vivienda BT4 (-S/ 420)</span>
              <span className="font-mono tabular-nums">
                {params.separateHousingFromBt4 ? 'SÍ' : 'NO'}
              </span>
            </button>
          </div>

          <div className="flex flex-col justify-center">
            <button
              type="button"
              role="switch"
              aria-checked={params.fixCompressorLeaks}
              onClick={() =>
                setParams((p) => ({ ...p, fixCompressorLeaks: !p.fixCompressorLeaks }))
              }
              className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                params.fixCompressorLeaks
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <span>Corregir fugas Atlas Copco (-S/ 570)</span>
              <span className="font-mono tabular-nums">
                {params.fixCompressorLeaks ? 'SÍ' : 'NO'}
              </span>
            </button>
          </div>
        </div>

        {/* GRÁFICO PRINCIPAL SVG: Barras Apiladas Comparativas + Precisión vs Realidad */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {comparison.scenarioTitle}
                </h3>
                <p className="text-xs text-slate-600">{comparison.scenarioContext}</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs shrink-0">
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#002054]" />
                  Desgaste / FROR
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-600" />
                  Mantenimiento
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-600" />
                  Luz BT4
                </span>
              </div>
            </div>

            {/* Gráfico de barras interactivo en SVG */}
            <div className="mt-4 overflow-x-auto rounded-md border border-slate-200 bg-white p-4">
              <svg
                viewBox="0 0 780 315"
                className="h-auto w-full min-w-[600px]"
                role="img"
                aria-label={`Comparativa gráfica de costos en ${comparison.scenarioTitle}`}
              >
                {/* Líneas verticales guía */}
                {[0.25, 0.5, 0.75, 1].map((frac) => {
                  const x = 158 + frac * 340;
                  const val = maxChartValue * frac;
                  return (
                    <g key={frac}>
                      <line
                        x1={x}
                        y1={14}
                        x2={x}
                        y2={278}
                        stroke="#e2e8f0"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={x}
                        y={296}
                        textAnchor="middle"
                        className="fill-slate-400 font-mono text-[10px]"
                      >
                        {formatMoney(val)}
                      </text>
                    </g>
                  );
                })}

                {/* Línea de referencia Realidad Auditada 100% */}
                {(() => {
                  const rx = 158 + (comparison.realityBenchmark.totalSoles / maxChartValue) * 340;
                  return (
                    <g>
                      <line
                        x1={rx}
                        y1={10}
                        x2={rx}
                        y2={280}
                        stroke="#0f172a"
                        strokeWidth={1.75}
                        strokeDasharray="5 3"
                      />
                      <text
                        x={rx}
                        y={8}
                        textAnchor="middle"
                        className="fill-slate-900 font-mono text-[10px] font-semibold"
                      >
                        Realidad 100% ({formatMoney(comparison.realityBenchmark.totalSoles)})
                      </text>
                    </g>
                  );
                })()}

                {/* Fila 0: Meta Realidad Física */}
                {(() => {
                  const b = comparison.realityBenchmark;
                  const wWear = (b.wearAndReplacementSoles / maxChartValue) * 340;
                  const wMaint = (b.maintenanceSoles / maxChartValue) * 340;
                  const wLuz = (b.electricitySoles / maxChartValue) * 340;
                  const totalW = wWear + wMaint + wLuz;
                  return (
                    <g transform="translate(0, 20)">
                      <rect x={4} y={0} width={772} height={30} rx={4} fill="#f1f5f9" />
                      <text x={12} y={19} className="fill-slate-900 font-sans text-[11px] font-bold">
                        Realidad Física
                      </text>
                      <rect x={158} y={6} width={wWear} height={18} fill="#002054" rx={2} />
                      <rect x={158 + wWear} y={6} width={wMaint} height={18} fill="#d97706" />
                      <rect x={158 + wWear + wMaint} y={6} width={wLuz} height={18} fill="#059669" rx={2} />
                      <text
                        x={158 + totalW + 10}
                        y={19}
                        className="fill-slate-900 font-mono text-[11px] font-bold"
                      >
                        {formatMoney(b.totalSoles)} · Meta 100%
                      </text>
                    </g>
                  );
                })()}

                {/* Filas 1..6: Métodos históricos y propuestos */}
                {comparison.methods.map((m, idx) => {
                  const y = 60 + idx * 36;
                  const wWear = (m.wearAndReplacementSoles / maxChartValue) * 340;
                  const wMaint = (m.maintenanceSoles / maxChartValue) * 340;
                  const wLuz = (m.electricitySoles / maxChartValue) * 340;
                  const totalW = wWear + wMaint + wLuz;
                  const isSelected = m.id === selectedMethod.id;
                  const accColor =
                    m.accuracyToRealityPct >= 93
                      ? '#047857'
                      : m.accuracyToRealityPct >= 80
                      ? '#b45309'
                      : '#be123c';

                  return (
                    <g
                      key={m.id}
                      transform={`translate(0, ${y})`}
                      onClick={() => setSelectedMethodId(m.id)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={4}
                        y={0}
                        width={772}
                        height={30}
                        rx={4}
                        fill={isSelected ? '#eff6ff' : '#ffffff'}
                        stroke={isSelected ? '#002054' : '#e2e8f0'}
                        strokeWidth={isSelected ? 1.25 : 0.75}
                      />
                      <text
                        x={12}
                        y={19}
                        className={`font-sans text-[11px] ${
                          isSelected ? 'fill-[#002054] font-bold' : 'fill-slate-800 font-medium'
                        }`}
                      >
                        {m.shortLabel}
                      </text>

                      <rect x={158} y={6} width={Math.max(1, wWear)} height={18} fill="#002054" />
                      <rect
                        x={158 + wWear}
                        y={6}
                        width={Math.max(0, wMaint)}
                        height={18}
                        fill="#d97706"
                      />
                      <rect
                        x={158 + wWear + wMaint}
                        y={6}
                        width={Math.max(1, wLuz)}
                        height={18}
                        fill="#059669"
                      />

                      <text
                        x={158 + totalW + 10}
                        y={19}
                        className="fill-slate-800 font-mono text-[10.5px] font-semibold"
                      >
                        {formatMoney(m.totalSoles)} ({formatSignedMoney(m.deltaVsRealitySoles)})
                      </text>

                      <text
                        x={768}
                        y={19}
                        textAnchor="end"
                        fill={accColor}
                        className="font-mono text-[11px] font-bold"
                      >
                        {m.accuracyToRealityPct.toFixed(1)}% real
                      </text>
                    </g>
                  );
                })}
              </svg>
              <p className="mt-2 text-xs text-slate-500">
                Haz clic en cualquier barra para inspeccionar su desglose exacto y por qué gana o pierde precisión.
              </p>
            </div>
          </div>

          {/* Panel lateral: Inspección del método seleccionado + Realidad */}
          <div className="min-w-0 lg:col-span-4 flex flex-col justify-between rounded-md border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wide text-[#002054]">
                    Método inspeccionado
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {selectedMethod.accuracyToRealityPct.toFixed(1)}% aproximación
                  </span>
                </div>
                <h4 className="mt-1 font-display text-base font-bold text-slate-900">
                  {selectedMethod.fullName}
                </h4>
              </div>

              <dl className="space-y-2.5 text-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-slate-600">Desgaste / FROR</dt>
                  <dd className="whitespace-nowrap font-mono font-semibold text-slate-900 tabular-nums">
                    {formatMoney(selectedMethod.wearAndReplacementSoles)}{' '}
                    <span className="font-normal text-slate-500">
                      / {formatMoney(comparison.realityBenchmark.wearAndReplacementSoles)}
                    </span>
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-slate-600">Mantenimiento</dt>
                  <dd className="whitespace-nowrap font-mono font-semibold text-slate-900 tabular-nums">
                    {formatMoney(selectedMethod.maintenanceSoles)}{' '}
                    <span className="font-normal text-slate-500">
                      / {formatMoney(comparison.realityBenchmark.maintenanceSoles)}
                    </span>
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-slate-600">Electricidad BT4</dt>
                  <dd className="whitespace-nowrap font-mono font-semibold text-slate-900 tabular-nums">
                    {formatMoney(selectedMethod.electricitySoles)}{' '}
                    <span className="font-normal text-slate-500">
                      / {formatMoney(comparison.realityBenchmark.electricitySoles)}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                  <dt className="text-slate-900">Total capturado ({comparison.unitLabel})</dt>
                  <dd className="font-mono text-[#002054] tabular-nums">
                    {formatMoneyPrecise(selectedMethod.totalSoles)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Desviación frente a la realidad</dt>
                  <dd
                    className={`font-mono font-bold tabular-nums ${
                      Math.abs(selectedMethod.deltaVsRealitySoles) < 250
                        ? 'text-emerald-700'
                        : selectedMethod.deltaVsRealitySoles < 0
                        ? 'text-rose-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {formatSignedMoney(selectedMethod.deltaVsRealitySoles)}
                  </dd>
                </div>
              </dl>

              <div className="rounded-md border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700">
                <p className="font-semibold text-slate-900">Diagnóstico técnico:</p>
                <p className="mt-1">{selectedMethod.distortionNote}</p>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-600">
              <strong className="text-slate-900">Base física 100%:</strong>{' '}
              {comparison.realityBenchmark.explanation}
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO 2: Curva FROR vs Horas/mes + Anatomía Recibo Luz BT4 */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Curva de horas/mes */}
        <article className="min-w-0 lg:col-span-7 rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#002054]">
                Efecto de la baja utilización (Plegadora JFY / Láser / Horno)
              </span>
              <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                Cómo cae la tarifa FROR (S//h) al usar más horas la máquina en el mes
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                El fondo mensual es fijo por calendario (JFY S/ 4,917.50/mes). A 40 h/mes la tarifa
                explota a S/ 122.94/h; a 120 h/mes baja a S/ 40.98/h. Por eso Modo C divide Tiempo y Uso.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <svg
              viewBox="0 0 560 220"
              className="h-auto w-full min-w-[420px]"
              role="img"
              aria-label="Curva de tarifa horaria FROR según horas de uso al mes"
            >
              {[50, 100, 150, 200, 250].map((rate) => {
                const y = curvePaths.yForRate(rate);
                return (
                  <g key={rate}>
                    <line x1={52} y1={y} x2={528} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <text
                      x={46}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-400 font-mono text-[10px]"
                    >
                      S/{rate}
                    </text>
                  </g>
                );
              })}

              {utilizationPoints.map((h) => {
                const x = curvePaths.xForHrs(h);
                return (
                  <text
                    key={h}
                    x={x}
                    y={202}
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[10px]"
                  >
                    {h}h/m
                  </text>
                );
              })}

              {/* Curvas */}
              <path d={curvePaths.jfyPath} fill="none" stroke="#002054" strokeWidth={2.5} />
              <path d={curvePaths.laserPath} fill="none" stroke="#d97706" strokeWidth={2.2} />
              <path d={curvePaths.hornoPath} fill="none" stroke="#059669" strokeWidth={2.2} />

              {/* Puntos activos actuales según los sliders */}
              <circle
                cx={curvePaths.xForHrs(Math.min(160, Math.max(20, params.jfyMonthlyHours)))}
                cy={curvePaths.yForRate(jfyLive.frorPurePerHour)}
                r={5}
                fill="#002054"
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              <circle
                cx={curvePaths.xForHrs(Math.min(160, Math.max(20, params.laserMonthlyHours)))}
                cy={curvePaths.yForRate(laserLive.frorPurePerHour)}
                r={4.5}
                fill="#d97706"
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              <circle
                cx={curvePaths.xForHrs(Math.min(160, Math.max(20, params.hornoMonthlyHours)))}
                cy={curvePaths.yForRate(hornoLive.frorPurePerHour)}
                r={4.5}
                fill="#059669"
                stroke="#ffffff"
                strokeWidth={1.5}
              />
            </svg>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 pt-3 text-xs">
            <span className="inline-flex items-center gap-1.5 font-mono text-slate-800 tabular-nums">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#002054]" />
              JFY ({params.jfyMonthlyHours}h): <strong>S/ {jfyLive.frorPurePerHour.toFixed(2)}/h</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-slate-800 tabular-nums">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-600" />
              Láser ({params.laserMonthlyHours}h): <strong>S/ {laserLive.frorPurePerHour.toFixed(2)}/h</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-slate-800 tabular-nums">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" />
              Horno ({params.hornoMonthlyHours}h): <strong>S/ {hornoLive.frorPurePerHour.toFixed(2)}/h</strong>
            </span>
          </div>
        </article>

        {/* Desglose Luz del Sur BT4 */}
        <article className="min-w-0 lg:col-span-5 rounded-lg border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Zap className="h-4 w-4" aria-hidden="true" />
              <span>Anatomía real del recibo BT4 (S/ 4,639 / mes)</span>
            </div>
            <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
              Por qué cobrar kWh directo falla si ignoras el pico de 27.26 kW
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              El 63% de tu factura eléctrica no depende de cuántas horas trabaje la máquina sino de
              la máxima demanda simultánea al arranque (7:00 am).
            </p>

            {/* Barra apilada horizontal 100% */}
            <div className="mt-4">
              <div className="flex h-7 w-full overflow-hidden rounded-md border border-slate-200">
                <div
                  style={{ width: '63%' }}
                  className="bg-[#002054] flex items-center justify-center font-mono text-[10px] font-bold text-white"
                  title="Demanda Máxima 27.26 kW (63%)"
                >
                  63% Potencia
                </div>
                <div
                  style={{ width: '16.2%' }}
                  className="bg-emerald-600 flex items-center justify-center font-mono text-[10px] font-bold text-white"
                  title="Energía productiva kWh (~16.2%)"
                >
                  kWh
                </div>
                <div
                  style={{ width: '11.7%' }}
                  className="bg-amber-600 flex items-center justify-center font-mono text-[10px] font-bold text-white"
                  title="Fugas aire / standby (~11.7%)"
                >
                  Fugas
                </div>
                <div
                  style={{ width: '9.1%' }}
                  className="bg-rose-600 flex items-center justify-center font-mono text-[10px] font-bold text-white"
                  title="Vivienda 2 pisos (~9.1%)"
                >
                  Viv.
                </div>
              </div>
            </div>

            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <dt className="text-slate-600">Potencia / Demanda Máx. (27.26 kW × ~S/ 111)</dt>
                <dd className="font-mono font-bold text-slate-900 tabular-nums">S/ 2,922.57 (63.0%)</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <dt className="text-slate-600">Energía productiva real en turno (~S/ 0.37/kWh)</dt>
                <dd className="font-mono font-semibold text-emerald-700 tabular-nums">~S/ 751.43 (16.2%)</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <dt className="text-slate-600">Carga fantasma + Fugas Atlas Copco 11 kW</dt>
                <dd className="font-mono font-semibold text-amber-700 tabular-nums">~S/ 545.00 (11.7%)</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <dt className="text-slate-600">Vivienda 2 pisos en medidor industrial BT4</dt>
                <dd className="font-mono font-semibold text-rose-700 tabular-nums">~S/ 420.00 (9.1%)</dd>
              </div>
              <div className="flex justify-between pt-0.5">
                <dt className="text-slate-600">Multa Factor Potencia (cos φ = 0.77)</dt>
                <dd className="font-mono font-semibold text-slate-900 tabular-nums">S/ 105.55/mes</dd>
              </div>
            </dl>
          </div>

          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <strong className="text-slate-900">Fórmula pinza amperimétrica para máquinas sin placa:</strong>{' '}
            <span className="font-mono">Trifásico 220V: kW ≈ 0.30 × A · Monofásico: kW ≈ 0.18 × A</span>
          </div>
        </article>
      </div>

      {/* LOS 3 MODELOS PROPUESTOS */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#002054]">
            <Sliders className="h-4 w-4" aria-hidden="true" />
            <span>Propuestas de arquitectura para cotizar y planificar</span>
          </div>
          <h3 className="mt-1 font-display text-lg font-bold text-slate-900 sm:text-xl">
            3 modelos recomendados: cómo mejoran el cálculo y qué tanto se acercan a la realidad
          </h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {PROPOSED_MODELS.map((prop) => (
            <article
              key={prop.code}
              className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="space-y-3">
                <div className="flex items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-[#002054]">
                    {prop.code}
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-700 tabular-nums">
                    {prop.accuracyRange} realidad
                  </span>
                </div>

                <h4 className="font-display text-base font-bold text-slate-900">{prop.title}</h4>
                <p className="text-xs text-slate-500">
                  {prop.effort} · {prop.targetUse}
                </p>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 font-mono text-[11px] leading-relaxed text-slate-800">
                  {prop.equation}
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-slate-700">
                  <p>
                    <strong className="text-slate-900">Cómo funciona:</strong> {prop.whatChanges}
                  </p>
                  <p>
                    <strong className="text-emerald-800">Por qué mejora:</strong> {prop.whyImproves}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 border-t border-slate-200 pt-3 text-xs font-semibold text-slate-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>Aproximación estimada a planta real: {prop.accuracyRange}</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* INVENTARIO COMPLETO DE LAS 20 MÁQUINAS DE GRIST + ACTIVOS PINTURA */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#002054]">
              <Cpu className="h-4 w-4" aria-hidden="true" />
              <span>Tabla Maestra Verificada (Grist Maquinaria + Inventario fdea9c88)</span>
            </div>
            <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
              Las {PLANT_MACHINES.length} máquinas operativas de la planta con FROR, Modo C, Mantenimiento y Luz
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['todas', 'Todas (20)'],
                ['alta', 'Rotación Alta'],
                ['media', 'Rotación Media'],
                ['baja', 'Baja'],
                ['auxiliar', 'Auxiliar'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setRotationFilter(key)}
                className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  rotationFilter === key
                    ? 'border-[#002054] bg-[#002054] text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={machineQuery}
                onChange={(e) => setMachineQuery(e.target.value)}
                placeholder="Buscar máquina..."
                aria-label="Buscar máquina en inventario"
                className="rounded-md border border-slate-300 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-[#002054] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-2.5">ID · Máquina</th>
                <th className="px-3 py-2.5">Rotación</th>
                <th className="px-3 py-2.5 text-right">Capital Rep.</th>
                <th className="px-3 py-2.5 text-right">FROR Grist (S//h)</th>
                <th className="px-3 py-2.5 text-right">Modo C (Uso/h)</th>
                <th className="px-3 py-2.5 text-right">Mant. Est. (S//h)</th>
                <th className="px-3 py-2.5 text-right">Luz Grist (S//h)</th>
                <th className="px-3 py-2.5 text-right">kW Est.</th>
                <th className="px-3 py-2.5 text-center">Aire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
              {filteredMachines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center font-sans text-sm text-slate-500">
                    Ninguna máquina coincide con el filtro actual.
                  </td>
                </tr>
              ) : (
                filteredMachines.map((m) => {
                  const customHours =
                    m.id === 6
                      ? params.jfyMonthlyHours
                      : m.id === 1
                      ? params.laserMonthlyHours
                      : m.id === 5
                      ? params.hornoMonthlyHours
                      : m.baseMonthlyHours ?? 40;
                  const calc = calcEffectiveFrorAtHours(m, customHours);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2.5 font-sans">
                        <div className="font-semibold text-slate-900">
                          <span className="font-mono text-slate-400">#{m.id}</span> · {m.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{m.statusNote}</div>
                      </td>
                      <td className="px-3 py-2.5 font-sans capitalize text-slate-700">
                        {m.rotationTier}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-700">
                        {m.replacementCapitalSoles
                          ? formatMoney(m.replacementCapitalSoles)
                          : 'N/D'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-[#002054]">
                        S/ {m.frorPerHour.toFixed(2)}
                        {(m.id === 6 || m.id === 1 || m.id === 5) &&
                          customHours !== m.baseMonthlyHours && (
                            <div className="text-[10px] text-emerald-700">
                              ({customHours}h: S/ {calc.frorPurePerHour.toFixed(2)})
                            </div>
                          )}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-800">
                        S/ {calc.frorModoCUsagePerHour.toFixed(2)}
                        <div className="text-[10px] text-slate-500">
                          ({100 - m.modoCTimePct}% uso / {m.modoCTimePct}% t)
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right text-amber-800">
                        S/ {m.preventiveMaintPerHour.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-emerald-700">
                        S/ {m.luzPerHour.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-700">
                        {m.estimatedKw > 0 ? `${m.estimatedKw.toFixed(1)} kW` : '0 kW'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-sans">
                        {m.usesAir ? (
                          <span className="font-mono font-semibold text-amber-700">+S/ 8.99</span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Activos adicionales fuera de la tabla de 20 de Grist */}
        <div className="mt-5 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <Wrench className="h-3.5 w-3.5 text-[#002054]" aria-hidden="true" />
            <span>Equipos de pintura, tinas y activos físicos complementarios documentados:</span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {NON_GRIST_PAINT_AND_TOOL_ASSETS.map((item) => (
              <div
                key={item.name}
                className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs"
              >
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="mt-1 font-mono font-bold text-[#002054] tabular-nums">{item.value}</p>
                <p className="mt-1 text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nota metodológica de cómo se aproximan los porcentajes */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 flex items-start gap-2.5">
        <Activity className="mt-0.5 h-4 w-4 text-[#002054] shrink-0" aria-hidden="true" />
        <p>
          <strong className="text-slate-900">Sobre el % de aproximación a la realidad:</strong> combina
          dos errores reales verificados en tus archivos: (1) desviación total en soles frente al gasto
          físico auditado (<span className="font-mono">General_maquinas S/ 8,422 + CIF S/ 2,425 + BT4</span>),
          y (2) subsidio cruzado por tipo de pieza (por ejemplo, una tarifa plana de S/ 37.33/HH cuadra
          el mes en papel pero cobra S/ 96 de plegadora a un cesto de alambre y subcostea el mueble con JFY).
        </p>
      </div>
    </section>
  );
}
