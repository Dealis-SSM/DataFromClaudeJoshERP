import { AlertTriangle, Calculator, CheckCircle2, FileCode2, Flame, Layers } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FORMULA_MODELS } from '../data/estrumetalAuditData';
import type { FormulaModel } from '../types/audit';
import {
  calcPaintingAndPicklingQuote,
  calcRetailQuote,
  marginToMarkup,
  markupToMargin,
  type OxideGradeCode,
  type PaintingQuoteInput,
  type RetailQuoteInput,
} from '../utils/costingModels';

type SimMode = 'retail' | 'pintura' | 'margen';

const MATURITY_LABEL: Record<
  FormulaModel['maturity'],
  { label: string; textClass: string }
> = {
  produccion_grist: { label: 'En producción (Grist)', textClass: 'text-emerald-700' },
  en_calibracion: { label: 'En calibración / referencia', textClass: 'text-amber-700' },
  referencia_historica: { label: 'Referencia histórica', textClass: 'text-slate-600' },
};

const RETAIL_PRESETS: Array<{ label: string; values: RetailQuoteInput }> = [
  {
    label: 'Cesto Continuo (base 60/40)',
    values: {
      quantity: 100,
      wireDiameterMm: 4,
      wireLengthMmPerUnit: 8200,
      wirePricePerKg: 3.85,
      wastePct: 6,
      workerHhPer100: 22.02,
      jorgeHhPer100: 12.0,
      use6040Blend: true,
      hhRate: 28.06,
      includeConsumablesAdder: false,
      excludeDebtFromRate: false,
      machineWearPerUnit: 0.42,
      packagingPer100: 10,
      setupHoursTotal: 0,
      targetMarginPct: 40,
      acceptedPriceCap: null,
    },
  },
  {
    label: 'Malla Cross (con Setup 1.5h + alambre 6mm)',
    values: {
      quantity: 60,
      wireDiameterMm: 6,
      wireLengthMmPerUnit: 6400,
      wirePricePerKg: 4.74,
      wastePct: 4.5,
      workerHhPer100: 42.0,
      jorgeHhPer100: 28.0,
      use6040Blend: true,
      hhRate: 28.06,
      includeConsumablesAdder: true,
      excludeDebtFromRate: false,
      machineWearPerUnit: 1.15,
      packagingPer100: 10,
      setupHoursTotal: 1.5,
      targetMarginPct: 40,
      acceptedPriceCap: null,
    },
  },
  {
    label: 'Colgador estándar (tarifa corregida S/ 37.33)',
    values: {
      quantity: 250,
      wireDiameterMm: 3,
      wireLengthMmPerUnit: 2900,
      wirePricePerKg: 3.8,
      wastePct: 6,
      workerHhPer100: 6.5,
      jorgeHhPer100: 4.5,
      use6040Blend: true,
      hhRate: 37.33,
      includeConsumablesAdder: false,
      excludeDebtFromRate: false,
      machineWearPerUnit: 0.18,
      packagingPer100: 10,
      setupHoursTotal: 0,
      targetMarginPct: 40,
      acceptedPriceCap: null,
    },
  },
];

const PAINTING_PRESETS: Array<{ label: string; values: PaintingQuoteInput }> = [
  {
    label: 'OP-2026-0087 Shop Smart (6 kg medidos + decapado)',
    values: {
      quantity: 3,
      areaM2PerUnit: 6.2,
      piecesPerBatch: 3,
      powderPricePerKg: 18,
      cyclonesOperational: false,
      measuredPowderKgTotal: 6,
      paintHhTotal: 5.2,
      hhRate: 28.06,
      entersTina: false,
      oxideGrade: 'G3',
      sweptCoveragePct: 100,
      decapadoRateM2PerHr: 1.77,
      abrasivesPerM2: 2.1,
      targetMarginPct: 40,
    },
  },
  {
    label: 'Lote estándar G2 en Tina (ciclones apagados)',
    values: {
      quantity: 20,
      areaM2PerUnit: 1.8,
      piecesPerBatch: 10,
      powderPricePerKg: 18,
      cyclonesOperational: false,
      measuredPowderKgTotal: 0,
      paintHhTotal: 6.0,
      hhRate: 28.06,
      entersTina: true,
      oxideGrade: 'G2',
      sweptCoveragePct: 35,
      decapadoRateM2PerHr: 2.2,
      abrasivesPerM2: 1.5,
      targetMarginPct: 40,
    },
  },
  {
    label: 'Escenario futuro con Ciclones Operativos (G1 limpio)',
    values: {
      quantity: 20,
      areaM2PerUnit: 1.8,
      piecesPerBatch: 10,
      powderPricePerKg: 18,
      cyclonesOperational: true,
      measuredPowderKgTotal: 0,
      paintHhTotal: 6.0,
      hhRate: 37.33,
      entersTina: true,
      oxideGrade: 'G1',
      sweptCoveragePct: 8,
      decapadoRateM2PerHr: 3.0,
      abrasivesPerM2: 0.8,
      targetMarginPct: 40,
    },
  },
];

const MARGIN_REFERENCE_ROWS = [20, 25, 30, 35, 38.7, 40, 44];

export function ModelsAndSimulatorSection({ simulatorAnchorId }: { simulatorAnchorId?: string }) {
  const [simMode, setSimMode] = useState<SimMode>('retail');

  // Estado Retail
  const [retailInput, setRetailInput] = useState<RetailQuoteInput>(RETAIL_PRESETS[0].values);
  const retailResult = useMemo(() => calcRetailQuote(retailInput), [retailInput]);

  // Estado Pintura + Decapado
  const [paintInput, setPaintInput] = useState<PaintingQuoteInput>(PAINTING_PRESETS[0].values);
  const paintResult = useMemo(() => calcPaintingAndPicklingQuote(paintInput), [paintInput]);

  // Estado Conversor Margen ↔ Markup
  const [markupInput, setMarkupInput] = useState<number>(30);
  const [marginInput, setMarginInput] = useState<number>(40);
  const [sampleCost, setSampleCost] = useState<number>(100);

  return (
    <div className="space-y-8">
      {/* Simulador Interactivo de Fábrica */}
      <section
        id={simulatorAnchorId}
        className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 scroll-mt-20"
      >
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#002054]">
              <Calculator className="h-4 w-4" aria-hidden="true" />
              <span>Simulador de Costeo de Fábrica (con reglas auditadas)</span>
            </div>
            <h1 className="mt-1 font-display text-xl font-bold text-slate-900 sm:text-2xl">
              Modelos de cotización y laboratorio de tarifas reales
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Prueba en tiempo real el impacto de la tarifa HH (S/ 28.06 vs S/ 37.33), consumibles
              omitidos (+S/ 1.64), deuda (-S/ 5.24), ciclones apagados y escala Dealis vs José Puma.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Modo del simulador"
            className="flex flex-wrap gap-1.5 shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={simMode === 'retail'}
              onClick={() => setSimMode('retail')}
              className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                simMode === 'retail'
                  ? 'border-[#002054] bg-[#002054] text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Retail / Alambre
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={simMode === 'pintura'}
              onClick={() => setSimMode('pintura')}
              className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                simMode === 'pintura'
                  ? 'border-[#002054] bg-[#002054] text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Pintura + Decapado
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={simMode === 'margen'}
              onClick={() => setSimMode('margen')}
              className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                simMode === 'margen'
                  ? 'border-[#002054] bg-[#002054] text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Margen ↔ Markup
            </button>
          </div>
        </div>

        {/* MODO 1: RETAIL / ALAMBRE */}
        {simMode === 'retail' && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Presets reales:
              </span>
              {RETAIL_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setRetailInput(preset.values)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-[#002054] hover:text-[#002054]"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              {/* Inputs */}
              <div className="min-w-0 lg:col-span-7 grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-700">
                  Cantidad del pedido (und)
                  <input
                    type="number"
                    min={1}
                    value={retailInput.quantity}
                    onChange={(e) =>
                      setRetailInput((p) => ({ ...p, quantity: Number(e.target.value) || 1 }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Calibre de alambre (mm)
                  <select
                    value={retailInput.wireDiameterMm}
                    onChange={(e) =>
                      setRetailInput((p) => ({
                        ...p,
                        wireDiameterMm: Number(e.target.value) as 3 | 4 | 5 | 6 | 8,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900"
                  >
                    <option value={3}>3 mm (0.0555 kg/m · rollo)</option>
                    <option value={4}>4 mm (0.0986 kg/m · rollo)</option>
                    <option value={5}>5 mm (0.1541 kg/m)</option>
                    <option value={6}>6 mm (0.2220 kg/m · varilla 6m)</option>
                    <option value={8}>8 mm (0.3946 kg/m · varilla 6m)</option>
                  </select>
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Longitud neta por unidad (mm)
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={retailInput.wireLengthMmPerUnit}
                    onChange={(e) =>
                      setRetailInput((p) => ({
                        ...p,
                        wireLengthMmPerUnit: Number(e.target.value) || 0,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Precio acero (S//kg)
                    <input
                      type="number"
                      min={0}
                      step={0.05}
                      value={retailInput.wirePricePerKg}
                      onChange={(e) =>
                        setRetailInput((p) => ({
                          ...p,
                          wirePricePerKg: Number(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 font-mono text-sm text-slate-900"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Merma (%)
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={retailInput.wastePct}
                      onChange={(e) =>
                        setRetailInput((p) => ({ ...p, wastePct: Number(e.target.value) || 0 }))
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 font-mono text-sm text-slate-900"
                    />
                  </label>
                </div>

                <label className="block text-xs font-medium text-slate-700">
                  HH Operarios / 100 und
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={retailInput.workerHhPer100}
                    onChange={(e) =>
                      setRetailInput((p) => ({
                        ...p,
                        workerHhPer100: Number(e.target.value) || 0,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  HH Jorge (supervisor) / 100 und
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={retailInput.jorgeHhPer100}
                    onChange={(e) =>
                      setRetailInput((p) => ({
                        ...p,
                        jorgeHhPer100: Number(e.target.value) || 0,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Tarifa HH base (S//HH)
                  <select
                    value={retailInput.hhRate}
                    onChange={(e) =>
                      setRetailInput((p) => ({ ...p, hhRate: Number(e.target.value) }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900"
                  >
                    <option value={28.06}>S/ 28.06 · Grist 85% ocupación</option>
                    <option value={37.33}>S/ 37.33 · Tarifa real corregida</option>
                    <option value={23.85}>S/ 23.85 · Grist 100% capacidad</option>
                    <option value={24.05}>S/ 24.05 · Histórica sep (MP Store)</option>
                    <option value={22.67}>S/ 22.67 · Histórica ago-2026</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Desgaste/und (S/)
                    <input
                      type="number"
                      min={0}
                      step={0.05}
                      value={retailInput.machineWearPerUnit}
                      onChange={(e) =>
                        setRetailInput((p) => ({
                          ...p,
                          machineWearPerUnit: Number(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 font-mono text-sm text-slate-900"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Margen s/venta (%)
                    <input
                      type="number"
                      min={1}
                      max={85}
                      step={1}
                      value={retailInput.targetMarginPct}
                      onChange={(e) =>
                        setRetailInput((p) => ({
                          ...p,
                          targetMarginPct: Number(e.target.value) || 40,
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 font-mono text-sm text-slate-900"
                    />
                  </label>
                </div>

                {/* Checkboxes de reglas auditadas */}
                <div className="sm:col-span-2 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3.5 text-xs">
                  <label className="flex items-center gap-2 font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={retailInput.use6040Blend}
                      onChange={(e) =>
                        setRetailInput((p) => ({ ...p, use6040Blend: e.target.checked }))
                      }
                      className="h-4 w-4 accent-[#002054]"
                    />
                    <span>Aplicar ponderación 60% operarios + 40% Jorge (regla 13-ago)</span>
                  </label>
                  <label className="flex items-center gap-2 font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={retailInput.includeConsumablesAdder}
                      onChange={(e) =>
                        setRetailInput((p) => ({
                          ...p,
                          includeConsumablesAdder: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-[#002054]"
                    />
                    <span>
                      Sumar +S/ 1.64/HH por Config.CIF_consumibles_mes omitidos (S/ 2,425/mes)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={retailInput.excludeDebtFromRate}
                      onChange={(e) =>
                        setRetailInput((p) => ({ ...p, excludeDebtFromRate: e.target.checked }))
                      }
                      className="h-4 w-4 accent-[#002054]"
                    />
                    <span>
                      Descontar deuda S/ 5.24/HH (simular tarifa sin S/ 8,500/mes deuda)
                    </span>
                  </label>
                </div>
              </div>

              {/* Resultados */}
              <div className="min-w-0 lg:col-span-5 rounded-md border border-slate-200 bg-slate-50 p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Precio Objetivo (5 decimales)
                      </p>
                      <p className="mt-1 font-mono text-3xl font-bold text-[#002054] tabular-nums">
                        S/ {retailResult.objectivePricePerUnit.toFixed(5)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Piso de caja / und</p>
                      <p className="font-mono text-base font-bold text-slate-900 tabular-nums">
                        S/ {retailResult.cashFloorPerUnit.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  <dl className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Tarifa HH efectiva aplicada</dt>
                      <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                        S/ {retailResult.effectiveHhRate.toFixed(2)} / HH
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Tiempo mezclado por unidad</dt>
                      <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                        {(retailResult.blendedHhPerUnit * 100).toFixed(2)} HH/100 ({retailResult.blendedHhPerUnit.toFixed(4)} HH/u)
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Peso acero c/merma</dt>
                      <dd className="font-mono text-slate-800 tabular-nums">
                        {retailResult.wireKgWithWastePerUnit.toFixed(4)} kg → S/{' '}
                        {retailResult.materialCostPerUnit.toFixed(4)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Mano de obra + CIF absorbido</dt>
                      <dd className="font-mono text-slate-800 tabular-nums">
                        S/ {retailResult.laborAndOverheadPerUnit.toFixed(4)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Embalaje + desgaste + setup</dt>
                      <dd className="font-mono text-slate-800 tabular-nums">
                        S/{' '}
                        {(
                          retailResult.packagingPerUnit +
                          retailInput.machineWearPerUnit +
                          retailResult.setupCostPerUnit
                        ).toFixed(4)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                      <dt className="text-slate-900">Costo total absorbido / und</dt>
                      <dd className="font-mono text-slate-900 tabular-nums">
                        S/ {retailResult.absorbedCostPerUnit.toFixed(5)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Equivalencia en escala José Puma</dt>
                      <dd className="font-mono font-semibold text-emerald-700 tabular-nums">
                        {retailResult.equivalentMarkupPct.toFixed(1)}% markup sobre costo
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Total lote sin IGV ({retailInput.quantity} und)</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      S/ {retailResult.totalOrderValueNoIgv.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-600">
                    <span>Total lote con IGV (18%)</span>
                    <span className="font-mono font-semibold text-slate-800 tabular-nums">
                      S/ {retailResult.totalOrderValueWithIgv.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODO 2: PINTURA + DECAPADO */}
        {simMode === 'pintura' && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Presets reales:
              </span>
              {PAINTING_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setPaintInput(preset.values)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-[#002054] hover:text-[#002054]"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="min-w-0 lg:col-span-7 grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-700">
                  Cantidad de piezas
                  <input
                    type="number"
                    min={1}
                    value={paintInput.quantity}
                    onChange={(e) =>
                      setPaintInput((p) => ({ ...p, quantity: Number(e.target.value) || 1 }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Área desarrollada por pieza (m²)
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={paintInput.areaM2PerUnit}
                    onChange={(e) =>
                      setPaintInput((p) => ({
                        ...p,
                        areaM2PerUnit: Number(e.target.value) || 0.1,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Piezas que entran por horneada
                  <input
                    type="number"
                    min={1}
                    value={paintInput.piecesPerBatch}
                    onChange={(e) =>
                      setPaintInput((p) => ({
                        ...p,
                        piecesPerBatch: Number(e.target.value) || 1,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Polvo medido total en caja (kg, 0 = estimar por m²)
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={paintInput.measuredPowderKgTotal ?? 0}
                    onChange={(e) =>
                      setPaintInput((p) => ({
                        ...p,
                        measuredPowderKgTotal: Number(e.target.value) || 0,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  HH de pintado + colgado + embalaje (total lote)
                  <input
                    type="number"
                    min={0}
                    step={0.2}
                    value={paintInput.paintHhTotal}
                    onChange={(e) =>
                      setPaintInput((p) => ({
                        ...p,
                        paintHhTotal: Number(e.target.value) || 0,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Precio polvo (S//kg)
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={paintInput.powderPricePerKg}
                    onChange={(e) =>
                      setPaintInput((p) => ({
                        ...p,
                        powderPricePerKg: Number(e.target.value) || 0,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Grado Óxido Rev. 2
                  <select
                    value={paintInput.oxideGrade}
                    onChange={(e) => {
                      const g = e.target.value as OxideGradeCode;
                      setPaintInput((p) => ({
                        ...p,
                        oxideGrade: g,
                        sweptCoveragePct: g === 'G0' ? 0 : g === 'G1' ? 8 : g === 'G2' ? 35 : 100,
                      }));
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900"
                  >
                    <option value="G0">G0 · Limpio sin óxido (-10%)</option>
                    <option value="G1">G1 · Mancha ligera M-L (0% base)</option>
                    <option value="G2">G2 · Puntos ralos P-L (+15%)</option>
                    <option value="G3">G3 · Puntos densos / Paño L (+35%)</option>
                    <option value="G4">G4 · Ampolla / uña + (*-A +60%)</option>
                  </select>
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Área barrida por óxido (% f_cobertura)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    value={paintInput.sweptCoveragePct}
                    onChange={(e) =>
                      setPaintInput((p) => ({
                        ...p,
                        sweptCoveragePct: Number(e.target.value) || 0,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <div className="sm:col-span-2 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3.5 text-xs">
                  <label className="flex items-center gap-2 font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paintInput.cyclonesOperational}
                      onChange={(e) =>
                        setPaintInput((p) => ({
                          ...p,
                          cyclonesOperational: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-[#002054]"
                    />
                    <span>
                      Ciclones operativos (desmarcado = 0.182 kg/m² castigado al 55%; marcado =
                      0.100 kg/m²)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paintInput.entersTina}
                      onChange={(e) =>
                        setPaintInput((p) => ({ ...p, entersTina: e.target.checked }))
                      }
                      className="h-4 w-4 accent-[#002054]"
                    />
                    <span>
                      Entra a triple tina química (S/ 32 Pharus + 1 HH/tanda; si NO entra: +20%
                      recargo Rev. 2)
                    </span>
                  </label>
                </div>
              </div>

              {/* Resultados Pintura */}
              <div className="min-w-0 lg:col-span-5 rounded-md border border-slate-200 bg-slate-50 p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Total Sugerido Lote (sin IGV)
                      </p>
                      <p className="mt-1 font-mono text-3xl font-bold text-[#002054] tabular-nums">
                        S/ {paintResult.totalSuggestedPriceNoIgv.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Precio unitario</p>
                      <p className="font-mono text-base font-bold text-slate-900 tabular-nums">
                        S/ {paintResult.unitPriceNoIgv.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <dl className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Polvo usado (sin doble merma)</dt>
                      <dd className="font-mono text-slate-900 tabular-nums">
                        {paintResult.powderKgTotal.toFixed(2)} kg → S/{' '}
                        {paintResult.powderCostTotal.toFixed(2)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">
                        Horno prorrateado ({paintResult.batchesNeeded.toFixed(2)} horneadas × S/ 54.59)
                      </dt>
                      <dd className="font-mono text-slate-900 tabular-nums">
                        S/ {paintResult.ovenProratedCost.toFixed(2)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Tina química + Pintado HH</dt>
                      <dd className="font-mono text-slate-900 tabular-nums">
                        S/ {(paintResult.tinaCost + paintResult.paintLaborCost).toFixed(2)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">
                        Decapado ({paintResult.sweptAreaTotalM2.toFixed(2)} m² barridos ·{' '}
                        {paintResult.decapadoHhTotal.toFixed(2)} HH)
                      </dt>
                      <dd className="font-mono font-semibold text-amber-800 tabular-nums">
                        S/ {paintResult.decapadoAbsorbedCost.toFixed(2)} (
                        {paintResult.decapadoSharePct.toFixed(1)}%)
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <dt className="font-semibold text-slate-900">Costo absorbido total</dt>
                      <dd className="font-mono font-bold text-slate-900 tabular-nums">
                        S/ {paintResult.totalAbsorbedCost.toFixed(2)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Desglose Pintado / Decapado sugerido</dt>
                      <dd className="font-mono text-slate-900 tabular-nums">
                        S/ {paintResult.paintingSuggestedPrice.toFixed(2)} + S/{' '}
                        {paintResult.decapadoSuggestedPrice.toFixed(2)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 border-t border-slate-200 pt-4 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Flame className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                      Recargo comercial cartilla Rev. 2
                    </span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {paintResult.rev2AdjustmentPct >= 0 ? '+' : ''}
                      {paintResult.rev2AdjustmentPct}%
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-slate-600">
                    <span>Piso de caja directo / Total c/IGV</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      S/ {paintResult.totalCashFloor.toFixed(2)} · S/{' '}
                      {paintResult.totalWithIgv.toFixed(2)} c/IGV
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODO 3: MARGEN VS MARKUP */}
        {simMode === 'margen' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-700">
                  Escala José Puma (Markup % sobre costo)
                  <input
                    type="number"
                    min={0}
                    max={400}
                    step={0.5}
                    value={markupInput}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setMarkupInput(val);
                      setMarginInput(Number(markupToMargin(val).toFixed(2)));
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Escala Dealis / Grist (Margen % sobre venta)
                  <input
                    type="number"
                    min={0}
                    max={90}
                    step={0.5}
                    value={marginInput}
                    onChange={(e) => {
                      const val = Math.min(90, Number(e.target.value) || 0);
                      setMarginInput(val);
                      setMarkupInput(Number(marginToMarkup(val).toFixed(2)));
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                  />
                </label>
              </div>

              <label className="block text-xs font-medium text-slate-700">
                Costo ejemplo de prueba (S/)
                <input
                  type="number"
                  min={1}
                  step={5}
                  value={sampleCost}
                  onChange={(e) => setSampleCost(Number(e.target.value) || 1)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                />
              </label>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Con Costo × (1 + {markupInput.toFixed(1)}% markup):
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    S/ {(sampleCost * (1 + markupInput / 100)).toFixed(5)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Con Costo ÷ (1 - {marginInput.toFixed(1)}% sobre venta):
                  </span>
                  <span className="font-mono font-bold text-[#002054] tabular-nums">
                    S/ {(sampleCost / (1 - Math.min(0.95, marginInput / 100))).toFixed(5)}
                  </span>
                </div>
                <p className="pt-1 text-xs text-slate-500">
                  Regla descubierta el 14-ago-2026: cuando José Puma temía pasar del 30% de markup,
                  en realidad estaba cotizando al 23.1% sobre venta mientras Dealis cotiza 35%–44%.
                </p>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-6 overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-3 py-2.5">Margen s/ Venta (Dealis)</th>
                    <th className="px-3 py-2.5">Markup s/ Costo (José Puma)</th>
                    <th className="px-3 py-2.5">Factor Multiplicador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                  {MARGIN_REFERENCE_ROWS.map((m) => {
                    const mk = marginToMarkup(m);
                    return (
                      <tr key={m}>
                        <td className="px-3 py-2 font-semibold text-slate-900">{m.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-[#002054]">{mk.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-slate-600">× {(1 + mk / 100).toFixed(4)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Los 4 Modelos Oficiales Extraídos */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Los {FORMULA_MODELS.length} modelos finales extraídos de Grist, Excel y manuales
          </h2>
          <p className="text-sm text-slate-600">
            Ecuación maestra, variables vigentes, brechas técnicas abiertas y flujo operativo de
            cada modelo.
          </p>
        </div>

        <div className="space-y-5">
          {FORMULA_MODELS.map((model) => {
            const mat = MATURITY_LABEL[model.maturity];
            return (
              <article
                key={model.id}
                className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6"
              >
                <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className={`font-semibold ${mat.textClass}`}>{mat.label}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        Actualizado: {model.lastUpdated}
                      </span>
                    </div>
                    <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                      {model.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{model.scope}</p>
                  </div>
                  <span className="font-mono text-xs text-slate-500 shrink-0">
                    {model.sourceDoc}
                  </span>
                </div>

                {/* Ecuación Maestra */}
                <div className="mt-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <FileCode2 className="h-3.5 w-3.5 text-[#002054]" aria-hidden="true" />
                    <span>Ecuación maestra vigente</span>
                  </div>
                  <div className="mt-1.5 overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs font-medium text-slate-900 sm:text-sm">
                    {model.coreEquation}
                  </div>
                </div>

                {/* Tabla de Variables */}
                <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Variable</th>
                        <th className="px-3 py-2">Regla / Significado</th>
                        <th className="px-3 py-2">Valor / Ejemplo actual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {model.variables.map((v) => (
                        <tr key={v.symbol}>
                          <td className="px-3 py-2 font-mono font-bold text-[#002054] whitespace-nowrap">
                            {v.symbol}
                          </td>
                          <td className="px-3 py-2 text-slate-700">{v.meaning}</td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-900 tabular-nums">
                            {v.currentValue}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Brechas y Flujo */}
                <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Brechas o puntos a corregir en tu nuevo modelo</span>
                    </h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-700 sm:text-sm">
                      {model.knownGaps.map((gap) => (
                        <li key={gap} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" />
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700">
                      <Layers className="h-3.5 w-3.5 text-[#002054]" aria-hidden="true" />
                      <span>Flujo operativo paso a paso</span>
                    </h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-700 sm:text-sm">
                      {model.workflowSteps.map((step) => (
                        <li key={step} className="flex items-start gap-2">
                          <CheckCircle2
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700"
                            aria-hidden="true"
                          />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
