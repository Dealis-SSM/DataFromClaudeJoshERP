import type { BusinessDataRecord, ContradictionRecord, DataCategory, UsageStatus } from '../types/audit';

export type OxideGradeCode = 'G0' | 'G1' | 'G2' | 'G3' | 'G4';

export interface RetailQuoteInput {
  quantity: number;
  wireDiameterMm: 3 | 4 | 5 | 6 | 8;
  wireLengthMmPerUnit: number;
  wirePricePerKg: number;
  wastePct: number; // e.g., 4.5 or 6.0
  workerHhPer100: number;
  jorgeHhPer100: number;
  use6040Blend: boolean;
  hhRate: number; // e.g. 28.06 (85% Grist actual) or 37.33 (corregida)
  includeConsumablesAdder: boolean; // +1.64 S/HH if rate is 28.06
  excludeDebtFromRate: boolean; // -5.24 S/HH on 28.06 rate
  machineWearPerUnit: number; // e.g., FROR/uso
  packagingPer100: number; // e.g., 10 S/100 und
  setupHoursTotal: number; // e.g., 1.5 h for Malla Cross
  targetMarginPct: number; // margin on sell price, e.g., 40
  acceptedPriceCap?: number | null;
}

export interface RetailQuoteResult {
  wireKgNetPerUnit: number;
  wireKgWithWastePerUnit: number;
  materialCostPerUnit: number;
  blendedHhPerUnit: number;
  effectiveHhRate: number;
  laborAndOverheadPerUnit: number;
  packagingPerUnit: number;
  setupCostPerUnit: number;
  cashFloorPerUnit: number; // Piso de caja (solo material + consumibles/embalaje directos)
  absorbedCostPerUnit: number;
  objectivePricePerUnit: number; // 5 decimals
  suggestedPricePerUnit: number;
  totalOrderValueNoIgv: number;
  totalOrderValueWithIgv: number;
  effectiveMarginOnSellPct: number;
  equivalentMarkupPct: number;
  belowFloor: boolean;
  belowObjective: boolean;
}

export interface PaintingQuoteInput {
  quantity: number;
  areaM2PerUnit: number;
  piecesPerBatch: number; // piezas por horneada
  powderPricePerKg: number; // e.g., 18.00 (RAL 7021) or 24.00 (dorados)
  cyclonesOperational: boolean; // false = 55% castigo (0.182 kg/m2 vs ~0.100 kg/m2)
  measuredPowderKgTotal?: number | null; // if > 0, no merma double-count
  paintHhTotal: number; // colgar + pintar + embalar
  hhRate: number; // 28.06
  entersTina: boolean;
  oxideGrade: OxideGradeCode;
  sweptCoveragePct: number; // f_cobertura (e.g., 8% for M-L, 100% for P-L / C-L)
  decapadoRateM2PerHr: number; // e.g., 1.8 m2/h for P80, 0.9 m2/h for esmeril
  abrasivesPerM2: number; // lija + discos + trapo + quimico
  targetMarginPct: number; // e.g., 40
}

export interface PaintingQuoteResult {
  powderKgTotal: number;
  powderCostTotal: number;
  batchesNeeded: number;
  ovenProratedCost: number; // S/ 54.59 per horneada * fraction
  tinaCost: number; // S/ 32 quimicos + 1 HH if entersTina
  paintLaborCost: number;
  paintingAbsorbedCost: number;
  sweptAreaTotalM2: number;
  decapadoHhTotal: number;
  decapadoAbsorbedCost: number;
  totalCashFloor: number;
  totalAbsorbedCost: number;
  decapadoSharePct: number;
  paintingSuggestedPrice: number;
  decapadoSuggestedPrice: number;
  totalSuggestedPriceNoIgv: number;
  totalWithIgv: number;
  unitPriceNoIgv: number;
  rev2AdjustmentPct: number;
}

const STEEL_DENSITY_G_CM3 = 7.85;
const IGV_RATE = 0.18;

export function roundTo5(value: number): number {
  return Math.round(value * 100000) / 100000;
}

export function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Converts markup over cost (José Puma's scale) to margin on sell price (Dealis's scale).
 * Formula: margin = markup / (1 + markup)
 */
export function markupToMargin(markupPct: number): number {
  const m = markupPct / 100;
  if (1 + m <= 0) return 0;
  return (m / (1 + m)) * 100;
}

/**
 * Converts margin on sell price to markup over cost.
 * Formula: markup = margin / (1 - margin)
 */
export function marginToMarkup(marginPct: number): number {
  const m = marginPct / 100;
  if (m >= 1) return Infinity;
  return (m / (1 - m)) * 100;
}

/**
 * Sell price from absorbed cost and margin on sell price.
 * Formula: P = Cost / (1 - margin)
 */
export function calcSellPriceFromMargin(cost: number, marginPct: number): number {
  const m = Math.min(Math.max(marginPct / 100, 0), 0.95);
  return roundTo5(cost / (1 - m));
}

/**
 * Steel wire linear mass in kg/m: pi * (d_mm / 2)^2 * 7.85 / 1000
 */
export function wireKgPerMeter(diameterMm: number): number {
  const r = diameterMm / 2;
  return (Math.PI * r * r * STEEL_DENSITY_G_CM3) / 1000;
}

export function calcRetailQuote(input: RetailQuoteInput): RetailQuoteResult {
  const qty = Math.max(1, input.quantity);
  const lengthMeters = Math.max(0, input.wireLengthMmPerUnit) / 1000;
  const wireKgNetPerUnit = lengthMeters * wireKgPerMeter(input.wireDiameterMm);
  const wireKgWithWastePerUnit = wireKgNetPerUnit * (1 + Math.max(0, input.wastePct) / 100);
  const materialCostPerUnit = wireKgWithWastePerUnit * Math.max(0, input.wirePricePerKg);

  const hhPer100 = input.use6040Blend
    ? 0.6 * input.workerHhPer100 + 0.4 * input.jorgeHhPer100
    : input.workerHhPer100;
  const blendedHhPerUnit = Math.max(0, hhPer100) / 100;

  let effectiveHhRate = Math.max(0, input.hhRate);
  if (input.includeConsumablesAdder) effectiveHhRate += 1.64;
  if (input.excludeDebtFromRate) effectiveHhRate = Math.max(0, effectiveHhRate - 5.24);

  const laborAndOverheadPerUnit = blendedHhPerUnit * effectiveHhRate;
  const packagingPerUnit = Math.max(0, input.packagingPer100) / 100;
  const setupCostPerUnit = (Math.max(0, input.setupHoursTotal) * effectiveHhRate) / qty;

  // Piso de caja (costo variable directo): material + embalaje (planilla planta es fija mensual)
  const cashFloorPerUnit = materialCostPerUnit + packagingPerUnit;

  const absorbedCostPerUnit =
    materialCostPerUnit +
    laborAndOverheadPerUnit +
    Math.max(0, input.machineWearPerUnit) +
    packagingPerUnit +
    setupCostPerUnit;

  const objectivePricePerUnit = calcSellPriceFromMargin(absorbedCostPerUnit, input.targetMarginPct);

  // Regla de Grist: Precio sugerido = último aceptado si supera el objetivo (o el objetivo si no)
  const hasCap = typeof input.acceptedPriceCap === 'number' && input.acceptedPriceCap > 0;
  const suggestedPricePerUnit =
    hasCap && (input.acceptedPriceCap as number) > objectivePricePerUnit
      ? roundTo5(input.acceptedPriceCap as number)
      : objectivePricePerUnit;

  const totalOrderValueNoIgv = roundTo2(suggestedPricePerUnit * qty);
  const totalOrderValueWithIgv = roundTo2(totalOrderValueNoIgv * (1 + IGV_RATE));

  const effectiveMarginOnSellPct =
    suggestedPricePerUnit > 0
      ? ((suggestedPricePerUnit - absorbedCostPerUnit) / suggestedPricePerUnit) * 100
      : 0;

  const equivalentMarkupPct =
    absorbedCostPerUnit > 0
      ? ((suggestedPricePerUnit - absorbedCostPerUnit) / absorbedCostPerUnit) * 100
      : 0;

  return {
    wireKgNetPerUnit,
    wireKgWithWastePerUnit,
    materialCostPerUnit,
    blendedHhPerUnit,
    effectiveHhRate,
    laborAndOverheadPerUnit,
    packagingPerUnit,
    setupCostPerUnit,
    cashFloorPerUnit,
    absorbedCostPerUnit,
    objectivePricePerUnit,
    suggestedPricePerUnit,
    totalOrderValueNoIgv,
    totalOrderValueWithIgv,
    effectiveMarginOnSellPct,
    equivalentMarkupPct,
    belowFloor: suggestedPricePerUnit < cashFloorPerUnit,
    belowObjective: suggestedPricePerUnit < objectivePricePerUnit,
  };
}

/**
 * Powder coating + pickling/decapado model from Grist Pt_Cotizaciones (07-oct-2026)
 * & Rev. 2 Oxide Criteria (23-sep-2026).
 */
export function calcPaintingAndPicklingQuote(input: PaintingQuoteInput): PaintingQuoteResult {
  const qty = Math.max(1, input.quantity);
  const totalAreaM2 = Math.max(0, input.areaM2PerUnit) * qty;

  // Ciclones apagados: 0.182 kg/m2 (rendimiento castigado al 55%). Ciclones operativos: ~0.100 kg/m2.
  const kgPerM2 = input.cyclonesOperational ? 0.1001 : 0.182;
  const usesMeasuredPowder = typeof input.measuredPowderKgTotal === 'number' && input.measuredPowderKgTotal > 0;
  // Regla 03-sep-2026: la merma NO se aplica sobre consumo real medido (evitar doble conteo).
  const powderKgTotal = usesMeasuredPowder
    ? (input.measuredPowderKgTotal as number)
    : totalAreaM2 * kgPerM2;

  const powderCostTotal = powderKgTotal * Math.max(0, input.powderPricePerKg);

  // Horno por horneada (07-oct-2026): GLP S/ 23.83 (1300/60*1.10) + 35 min FROR+luz+aire S/ 30.76 (52.73/h) = S/ 54.59
  const OVEN_COST_PER_BATCH = 23.83 + 30.76;
  const piecesPerBatch = Math.max(1, input.piecesPerBatch);
  const batchesNeeded = qty / piecesPerBatch;
  const ovenProratedCost = batchesNeeded * OVEN_COST_PER_BATCH;

  // Tina: S/ 32 químicos por pasada (Pharus) + 1 HH supuesta
  const tinaBatches = input.entersTina ? Math.ceil(batchesNeeded) : 0;
  const tinaChemicalsCost = tinaBatches * 32;
  const tinaCost = input.entersTina ? tinaChemicalsCost + tinaBatches * input.hhRate : 0;

  const paintLaborCost = Math.max(0, input.paintHhTotal) * Math.max(0, input.hhRate);
  const paintingAbsorbedCost = powderCostTotal + ovenProratedCost + tinaCost + paintLaborCost;

  // Decapado: A_barrida = A_desarrollada * f_cobertura
  const coverageFraction =
    input.oxideGrade === 'G0' ? 0 : Math.min(Math.max(input.sweptCoveragePct, 0), 100) / 100;
  const sweptAreaTotalM2 = totalAreaM2 * coverageFraction;
  const rate = Math.max(0.1, input.decapadoRateM2PerHr);
  const decapadoHhTotal = sweptAreaTotalM2 > 0 ? sweptAreaTotalM2 / rate : 0;
  const abrasivesTotal = sweptAreaTotalM2 * Math.max(0, input.abrasivesPerM2);
  const decapadoAbsorbedCost = decapadoHhTotal * Math.max(0, input.hhRate) + abrasivesTotal;

  // Piso de caja = polvo + GLP/luz horno (54.59 excluye FROR? Simplificado: polvo + GLP 23.83 + químicos + abrasivos)
  const totalCashFloor =
    powderCostTotal + batchesNeeded * 23.83 + tinaChemicalsCost + abrasivesTotal;

  const totalAbsorbedCost = paintingAbsorbedCost + decapadoAbsorbedCost;
  const decapadoSharePct = totalAbsorbedCost > 0 ? (decapadoAbsorbedCost / totalAbsorbedCost) * 100 : 0;

  const paintingSuggestedPrice = calcSellPriceFromMargin(paintingAbsorbedCost, input.targetMarginPct);
  const decapadoSuggestedPrice = calcSellPriceFromMargin(decapadoAbsorbedCost, input.targetMarginPct);
  const totalSuggestedPriceNoIgv = roundTo2(paintingSuggestedPrice + decapadoSuggestedPrice);
  const totalWithIgv = roundTo2(totalSuggestedPriceNoIgv * (1 + IGV_RATE));
  const unitPriceNoIgv = roundTo5(totalSuggestedPriceNoIgv / qty);

  const baseCodeAdj: Record<OxideGradeCode, number> = {
    G0: -10,
    G1: 0,
    G2: 15,
    G3: 35,
    G4: 60,
  };
  const rev2AdjustmentPct = baseCodeAdj[input.oxideGrade] + (input.entersTina ? 0 : 20);

  return {
    powderKgTotal,
    powderCostTotal,
    batchesNeeded,
    ovenProratedCost,
    tinaCost,
    paintLaborCost,
    paintingAbsorbedCost,
    sweptAreaTotalM2,
    decapadoHhTotal,
    decapadoAbsorbedCost,
    totalCashFloor,
    totalAbsorbedCost,
    decapadoSharePct,
    paintingSuggestedPrice,
    decapadoSuggestedPrice,
    totalSuggestedPriceNoIgv,
    totalWithIgv,
    unitPriceNoIgv,
    rev2AdjustmentPct,
  };
}

export function filterAuditItems(
  items: BusinessDataRecord[],
  options: {
    category: DataCategory | 'Todas';
    status: UsageStatus | 'todos';
    onlyMisused: boolean;
    query: string;
  }
): BusinessDataRecord[] {
  const q = options.query.trim().toLowerCase();
  return items.filter((item) => {
    if (options.category !== 'Todas' && item.category !== options.category) return false;
    if (options.status !== 'todos' && item.status !== options.status) return false;
    if (options.onlyMisused && !item.usageAndAudit.wasMisused) return false;
    if (!q) return true;
    const haystack = [
      item.title,
      item.category,
      item.rawData.summary,
      item.rawData.origin,
      item.usageAndAudit.howUsed,
      item.usageAndAudit.misuseDetail || '',
      item.finalProduct.name,
      item.finalProduct.formulaOrRule,
      ...item.rawData.values.map((v) => `${v.label} ${v.value}`),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function filterContradictions(
  items: ContradictionRecord[],
  options: {
    status: ContradictionRecord['status'] | 'todas';
    query: string;
  }
): ContradictionRecord[] {
  const q = options.query.trim().toLowerCase();
  return items.filter((item) => {
    if (options.status !== 'todas' && item.status !== options.status) return false;
    if (!q) return true;
    return [
      item.topic,
      item.category,
      item.older.claimOrValue,
      item.newer.claimOrValue,
      item.whyContradicts,
      item.verdictForFactoryModel,
    ]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
}
