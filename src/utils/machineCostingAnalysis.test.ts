import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BT4_ELECTRICITY_BREAKDOWN,
  calcEffectiveFrorAtHours,
  DEFAULT_CALIBRATION_PARAMS,
  evaluateMethodComparison,
  PLANT_MACHINES,
} from './machineCostingAnalysis';

test('PLANT_MACHINES includes all 20 operational Grist records and exact FROR values', () => {
  assert.equal(PLANT_MACHINES.length, 20);
  const jfy = PLANT_MACHINES.find((m) => m.id === 6);
  assert.ok(jfy);
  assert.equal(Number(jfy.frorPerHour.toFixed(2)), 122.94);

  const horno = PLANT_MACHINES.find((m) => m.id === 5);
  assert.ok(horno);
  assert.equal(horno.usesAir, true);
  assert.equal(Number(horno.frorPerHour.toFixed(2)), 42.38);
});

test('calcEffectiveFrorAtHours lowers hourly FROR inversely with utilization hours', () => {
  const jfy = PLANT_MACHINES.find((m) => m.id === 6)!;
  const at40 = calcEffectiveFrorAtHours(jfy, 40);
  const at120 = calcEffectiveFrorAtHours(jfy, 120);

  assert.equal(at40.frorPurePerHour, 122.94);
  assert.equal(at120.frorPurePerHour, 40.98);
  assert.equal(at40.monthlyFixedReserve, 4917.5);
  assert.equal(at120.monthlyFixedReserve, 4917.5);
});

test('evaluateMethodComparison shows accuracy improving from legacy/current to proposed models', () => {
  const monthly = evaluateMethodComparison('planta_mensual', DEFAULT_CALIBRATION_PARAMS);
  const grist28 = monthly.methods.find((m) => m.id === 'grist_actual_28')!;
  const propA = monthly.methods.find((m) => m.id === 'propuesta_a_hibrida')!;
  const propB = monthly.methods.find((m) => m.id === 'propuesta_b_modo_c')!;
  const propC = monthly.methods.find((m) => m.id === 'propuesta_c_medida')!;

  assert.ok(grist28.deltaVsRealitySoles < -9000);
  assert.ok(propA.accuracyToRealityPct > grist28.accuracyToRealityPct);
  assert.ok(propB.accuracyToRealityPct >= propA.accuracyToRealityPct);
  assert.ok(propC.accuracyToRealityPct >= propB.accuracyToRealityPct);
  assert.ok(propC.accuracyToRealityPct >= 97);
});

test('lote_alambre_retail exposes cross-subsidy penalty of flat S/ 37.33/HH vs Modo C', () => {
  const wire = evaluateMethodComparison('lote_alambre_retail', DEFAULT_CALIBRATION_PARAMS);
  const flat37 = wire.methods.find((m) => m.id === 'grist_corregida_37')!;
  const modoB = wire.methods.find((m) => m.id === 'propuesta_b_modo_c')!;

  // Flat 37.33 charges S/ 96.40 wear vs ~14.05 real wear on wire
  assert.ok(flat37.wearAndReplacementSoles > wire.realityBenchmark.wearAndReplacementSoles * 5);
  assert.ok(modoB.accuracyToRealityPct > flat37.accuracyToRealityPct + 15);
});

test('BT4 calibration toggles reduce realPlantElectricityMonth when separating housing and leaks', () => {
  const raw = evaluateMethodComparison('planta_mensual', {
    ...DEFAULT_CALIBRATION_PARAMS,
    separateHousingFromBt4: false,
    fixCompressorLeaks: false,
  });
  const tuned = evaluateMethodComparison('planta_mensual', {
    ...DEFAULT_CALIBRATION_PARAMS,
    separateHousingFromBt4: true,
    fixCompressorLeaks: true,
  });

  assert.equal(raw.realityBenchmark.electricitySoles, BT4_ELECTRICITY_BREAKDOWN.totalBillSoles);
  assert.ok(tuned.realityBenchmark.electricitySoles < raw.realityBenchmark.electricitySoles - 900);
});
