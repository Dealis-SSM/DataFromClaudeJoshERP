import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcPaintingAndPicklingQuote,
  calcRetailQuote,
  calcSellPriceFromMargin,
  filterAuditItems,
  filterContradictions,
  marginToMarkup,
  markupToMargin,
  wireKgPerMeter,
} from './costingModels';
import { BUSINESS_DATA_RECORDS, CONTRADICTIONS } from '../data/estrumetalAuditData';

test('markupToMargin and marginToMarkup match Estrumetal conversion table (14-ago-2026)', () => {
  // 30% markup sobre costo = 23.08% margen sobre venta
  assert.ok(Math.abs(markupToMargin(30) - 23.076923) < 0.01);
  // 40% margen sobre venta = 66.67% markup sobre costo
  assert.ok(Math.abs(marginToMarkup(40) - 66.666667) < 0.01);
  // 31.4% markup (COT-186) ~ 23.9% margen
  assert.ok(Math.abs(markupToMargin(31.4) - 23.896) < 0.05);
});

test('calcSellPriceFromMargin uses Cost / (1 - Margin) to 5 decimals', () => {
  // From Prodac cuchilla example (11-sep-2026): 0.8628 / (1 - 0.33) = 1.28776
  const p = calcSellPriceFromMargin(0.8628, 33);
  assert.equal(p, 1.28776);
});

test('wireKgPerMeter matches 3mm steel density 7.85 g/cm3 (0.0555 kg/m)', () => {
  const kgM = wireKgPerMeter(3);
  assert.ok(Math.abs(kgM - 0.055488) < 0.0001);
});

test('calcRetailQuote computes 60/40 blend and flags consumables/debt impact', () => {
  const base = calcRetailQuote({
    quantity: 100,
    wireDiameterMm: 3,
    wireLengthMmPerUnit: 1425,
    wirePricePerKg: 3.8,
    wastePct: 6,
    workerHhPer100: 22.02,
    jorgeHhPer100: 12,
    use6040Blend: true,
    hhRate: 28.06,
    includeConsumablesAdder: false,
    excludeDebtFromRate: false,
    machineWearPerUnit: 0.25,
    packagingPer100: 10,
    setupHoursTotal: 1.5,
    targetMarginPct: 40,
  });

  // 0.6 * 22.02 + 0.4 * 12 = 18.012 HH / 100 = 0.18012 HH/und
  assert.ok(Math.abs(base.blendedHhPerUnit - 0.18012) < 0.0001);
  assert.ok(base.absorbedCostPerUnit > base.cashFloorPerUnit);
  assert.ok(base.objectivePricePerUnit > base.absorbedCostPerUnit);

  const corrected = calcRetailQuote({
    quantity: 100,
    wireDiameterMm: 3,
    wireLengthMmPerUnit: 1425,
    wirePricePerKg: 3.8,
    wastePct: 6,
    workerHhPer100: 22.02,
    jorgeHhPer100: 12,
    use6040Blend: true,
    hhRate: 28.06,
    includeConsumablesAdder: true,
    excludeDebtFromRate: false,
    machineWearPerUnit: 0.25,
    packagingPer100: 10,
    setupHoursTotal: 1.5,
    targetMarginPct: 40,
  });

  assert.ok(corrected.objectivePricePerUnit > base.objectivePricePerUnit);
});

test('calcPaintingAndPicklingQuote avoids merma double count on measured powder and models cyclones', () => {
  const cyclonesOff = calcPaintingAndPicklingQuote({
    quantity: 3,
    areaM2PerUnit: 5,
    piecesPerBatch: 3,
    powderPricePerKg: 18,
    cyclonesOperational: false,
    measuredPowderKgTotal: 6,
    paintHhTotal: 1.13,
    hhRate: 28.06,
    entersTina: false,
    oxideGrade: 'G3',
    sweptCoveragePct: 100,
    decapadoRateM2PerHr: 1.43,
    abrasivesPerM2: 3.5,
    targetMarginPct: 40,
  });

  // Measured powder stays exactly 6 kg (rule from 03-sep-2026)
  assert.equal(cyclonesOff.powderKgTotal, 6);
  assert.equal(cyclonesOff.powderCostTotal, 108);
  // G3 (+35) + no tina (+20) = +55%
  assert.equal(cyclonesOff.rev2AdjustmentPct, 55);
  // Without measured powder, cyclones ON uses ~45% less powder than cyclones OFF
  const estOff = calcPaintingAndPicklingQuote({
    quantity: 10,
    areaM2PerUnit: 2,
    piecesPerBatch: 10,
    powderPricePerKg: 18,
    cyclonesOperational: false,
    paintHhTotal: 2,
    hhRate: 28.06,
    entersTina: true,
    oxideGrade: 'G1',
    sweptCoveragePct: 10,
    decapadoRateM2PerHr: 2,
    abrasivesPerM2: 1,
    targetMarginPct: 40,
  });
  const estOn = calcPaintingAndPicklingQuote({
    quantity: 10,
    areaM2PerUnit: 2,
    piecesPerBatch: 10,
    powderPricePerKg: 18,
    cyclonesOperational: true,
    paintHhTotal: 2,
    hhRate: 28.06,
    entersTina: true,
    oxideGrade: 'G1',
    sweptCoveragePct: 10,
    decapadoRateM2PerHr: 2,
    abrasivesPerM2: 1,
    targetMarginPct: 40,
  });
  assert.ok(estOn.powderKgTotal < estOff.powderKgTotal * 0.6);
});

test('audit filtering handles category, misused toggle, and search queries', () => {
  const misused = filterAuditItems(BUSINESS_DATA_RECORDS, {
    category: 'Todas',
    status: 'todos',
    onlyMisused: true,
    query: '',
  });
  assert.ok(misused.length >= 8);
  assert.ok(misused.every((i) => i.usageAndAudit.wasMisused));

  const pt0301 = filterAuditItems(BUSINESS_DATA_RECORDS, {
    category: 'Todas',
    status: 'todos',
    onlyMisused: false,
    query: 'PT-0301',
  });
  assert.ok(pt0301.length >= 1);

  const openContradictions = filterContradictions(CONTRADICTIONS, {
    status: 'decision_abierta',
    query: '',
  });
  assert.ok(openContradictions.length >= 2);
});
