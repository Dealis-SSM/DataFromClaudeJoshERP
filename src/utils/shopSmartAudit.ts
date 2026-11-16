export interface ShopSmartProduct {
  row: number;
  name: string;
  qty: number;
  frac17: number; // e.g. 5/17
  daysByRole: {
    torres: number; // Corte
    peña: number; // Armado
    rodrigo: number; // Soldado
    litano: number; // Acabado
  };
  hFactor: number; // 3, 1, 0.5, 0.6, 1
  materialL: number; // L fijo
  sExcelUnit: number; // 50 u 80 fijo
  sRealisticPaintUnit: number; // estimado realista pintura + horno + decapado por mueble
  origP: number;
  origT: number;
  origU: number;
}

export interface ShopSmartSwitches {
  fixOvertimeJourney: boolean; // Switch 1: 8.5h reales vs 9.75h con HE automática
  fixIndirectsByHh: boolean; // Switch 2: Indirectos repartidos por HH reales vs /17
  fixLuzRealBt4: boolean; // Switch 3: Recibo Luz BT4 real proporcional vs S/ 6,000 * 17/26
  fixMachineWearJfy: boolean; // Switch 4: Desgaste JFY/MIG real (+S/ 4.82/HH) vs S/ 710.16
  fixLaserDoubleCount: boolean; // Switch 5: Quitar doble cobro a Rubén en Láser y ajustar uso láser
  fixGhostQandR: boolean; // Switch 6: Quitar Q muerta / +S/ 6.00 manual en R y usar embalaje real
  fixPaintingAndPicklingS: boolean; // Switch 7: Reemplazar S/ 50-80 fijos por pintura + horno + decapado real
  fixMarginOverSell: boolean; // Switch 8: Usar Costo / (1 - 0.35) (35% sobre venta) en vez de * 135% (25.93%)
}

export const DEFAULT_SHOPSMART_SWITCHES: ShopSmartSwitches = {
  fixOvertimeJourney: false,
  fixIndirectsByHh: false,
  fixLuzRealBt4: false,
  fixMachineWearJfy: false,
  fixLaserDoubleCount: false,
  fixGhostQandR: false,
  fixPaintingAndPicklingS: false,
  fixMarginOverSell: false,
};

export const ALL_FIXED_SHOPSMART_SWITCHES: ShopSmartSwitches = {
  fixOvertimeJourney: true,
  fixIndirectsByHh: true,
  fixLuzRealBt4: true,
  fixMachineWearJfy: true,
  fixLaserDoubleCount: true,
  fixGhostQandR: true,
  fixPaintingAndPicklingS: true,
  fixMarginOverSell: true,
};

export const SHOPSMART_PRODUCTS: ShopSmartProduct[] = [
  {
    row: 12,
    name: 'Mesa primer nivel',
    qty: 54,
    frac17: 5 / 17,
    daysByRole: { torres: 1, peña: 2.2, rodrigo: 2, litano: 3.6 },
    hFactor: 3,
    materialL: 4103.7,
    sExcelUnit: 50,
    sRealisticPaintUnit: 120,
    origP: 151.99,
    origT: 207.99,
    origU: 280.79,
  },
  {
    row: 13,
    name: 'Cabecera Mesa Baja',
    qty: 15,
    frac17: 3.5 / 17,
    daysByRole: { torres: 2, peña: 1.5, rodrigo: 1.5, litano: 1 },
    hFactor: 1,
    materialL: 957.65,
    sExcelUnit: 50,
    sRealisticPaintUnit: 115,
    origP: 237.54,
    origT: 293.54,
    origU: 396.28,
  },
  {
    row: 14,
    name: 'Cabecera Mesa Alta',
    qty: 15,
    frac17: 2 / 17,
    daysByRole: { torres: 1, peña: 1, rodrigo: 0.75, litano: 1 },
    hFactor: 0.5,
    materialL: 607.56,
    sExcelUnit: 50,
    sRealisticPaintUnit: 115,
    origP: 142.42,
    origT: 198.42,
    origU: 267.87,
  },
  {
    row: 15,
    name: 'Caballete Alto',
    qty: 17,
    frac17: 3.5 / 17,
    daysByRole: { torres: 2, peña: 2, rodrigo: 1.5, litano: 1 },
    hFactor: 0.6,
    materialL: 2065.69,
    sExcelUnit: 80,
    sRealisticPaintUnit: 145,
    origP: 274.48,
    origT: 360.48,
    origU: 486.65,
  },
  {
    row: 16,
    name: 'Caballete Alto Con Bandeja Superior',
    qty: 10,
    frac17: 3 / 17,
    daysByRole: { torres: 1.5, peña: 2, rodrigo: 1, litano: 1 },
    hFactor: 1,
    materialL: 1351.96,
    sExcelUnit: 80,
    sRealisticPaintUnit: 160,
    origP: 367.79,
    origT: 453.79,
    origU: 612.62,
  },
];

// Tarifas Tabla 1 del Excel (Costo-Hora-Anual y Día 9.75h vs 8.5h)
const RATES = {
  torres: { hr: 14.28, dayWithHe: 139.23 },
  peña: { hr: 15.45, dayWithHe: 150.64 },
  rodrigo: { hr: 12.8, dayWithHe: 124.8 },
  litano: { hr: 15.79, dayWithHe: 153.95 },
};

export interface ShopSmartRowResult {
  row: number;
  name: string;
  qty: number;
  hhTotal: number;
  laborLot: number;
  indirectsLot: number;
  luzLot: number;
  wearLot: number;
  laserLot: number;
  consumablesLot: number;
  materialLot: number;
  extraRUnit: number;
  paintSUnit: number;
  unitCostT: number;
  unitPriceU: number;
  lotCost: number;
  lotPrice: number;
  origUnitCostT: number;
  origUnitPriceU: number;
}

export interface ShopSmartAuditSummary {
  rows: ShopSmartRowResult[];
  totalLotCost: number;
  totalLotPriceNoIgv: number;
  totalLotPriceWithIgv: number;
  effectiveMarginOnSellPct: number;
  effectiveMarkupPct: number;
  origTotalLotCost: number;
  origTotalLotPriceNoIgv: number;
  origMarginOnSellPct: number;
  costDeltaVsExcel: number;
  priceDeltaVsExcel: number;
  activeFixesCount: number;
}

export function calculateShopSmartAudit(
  switches: ShopSmartSwitches,
  targetMarginOnSellPct = 35
): ShopSmartAuditSummary {
  const totalHhAllRows = SHOPSMART_PRODUCTS.reduce((acc, p) => {
    const days =
      p.daysByRole.torres + p.daysByRole.peña + p.daysByRole.rodrigo + p.daysByRole.litano;
    return acc + days * 8.5;
  }, 0);

  const rows: ShopSmartRowResult[] = SHOPSMART_PRODUCTS.map((p) => {
    const totalDays =
      p.daysByRole.torres + p.daysByRole.peña + p.daysByRole.rodrigo + p.daysByRole.litano;
    const hhTotal = totalDays * 8.5;

    // 1. Mano de obra directa (C:F)
    const laborLot = switches.fixOvertimeJourney
      ? (p.daysByRole.torres * RATES.torres.hr +
          p.daysByRole.peña * RATES.peña.hr +
          p.daysByRole.rodrigo * RATES.rodrigo.hr +
          p.daysByRole.litano * RATES.litano.hr) *
        8.5
      : p.daysByRole.torres * RATES.torres.dayWithHe +
        p.daysByRole.peña * RATES.peña.dayWithHe +
        p.daysByRole.rodrigo * RATES.rodrigo.dayWithHe +
        p.daysByRole.litano * RATES.litano.dayWithHe;

    // 2. Indirectos (K): Excel usaba 56.03 * 8.5 * (frac * 17) * 4 / 12.
    // Corregido: prorrateo por HH reales usando componente fijo + supervisión de Rt_Tarifa (~S/ 16.50/HH)
    const indirectsLot = switches.fixIndirectsByHh
      ? hhTotal * 16.5
      : 56.03 * 8.5 * (p.frac17 * 17) * (4 / 12);

    // 3. Luz (I): Excel = 6000 * (17/26) * frac17 (S/ 3,923.08 total).
    // Corregido: recibo real BT4 (S/ 4,639/mes) prorrateado al uso real de planta (~260/1650 HH ≈ S/ 1,450 repartidos por HH)
    const luzLot = switches.fixLuzRealBt4
      ? (hhTotal / totalHhAllRows) * 1450
      : 6000 * (17 / 26) * p.frac17;

    // 4. Desgastes (J): Excel = 710.16 * frac17.
    // Corregido: fondo real máquinas JFY/MIG (+S/ 4.82/HH según auditoría 06-oct) -> S/ 1,251.63 total repartidos por HH
    const wearLot = switches.fixMachineWearJfy ? hhTotal * 4.82 : 710.16 * p.frac17;

    // 5. Láser (G): Excel = (70.8 + 14.28*4 + 56.83*2) * frac17 = 241.58 * frac17 (incluía 4h de Rubén ya cobradas en C).
    // Corregido: sin sueldo duplicado de Rubén, costo operativo real máquina láser (S/ 385 total proporcional)
    const laserLot = switches.fixLaserDoubleCount
      ? 385 * p.frac17
      : (70.8 + 14.28 * 4 + 56.83 * 2) * p.frac17;

    // 6. Consumibles (H)
    const consumablesLot = p.hFactor * 200.6;

    // 7. Columna Q/R: Excel suma +S/ 6.00/und a mano sin nombre. Corregido = S/ 1.00/und embalaje real documentado
    const extraRUnit = switches.fixGhostQandR ? 1.0 : 4 * 1.5;

    // 8. Columna S: Excel usa S/ 50 u S/ 80 fijo. Corregido = pintura + horno (S/ 54.59) + decapado Rev. 2 estimado
    const paintSUnit = switches.fixPaintingAndPicklingS ? p.sRealisticPaintUnit : p.sExcelUnit;

    const sumCtoL =
      laborLot +
      indirectsLot +
      luzLot +
      wearLot +
      laserLot +
      consumablesLot +
      p.materialL;

    const unitCostP = sumCtoL / p.qty;
    const unitCostT = unitCostP + extraRUnit + paintSUnit;

    // 9. Columna U: Excel = T * 1.35 (25.93% sobre venta). Corregido = T / (1 - targetMargin)
    const marginFraction = Math.min(0.85, Math.max(0.05, targetMarginOnSellPct / 100));
    const unitPriceU = switches.fixMarginOverSell
      ? unitCostT / (1 - marginFraction)
      : unitCostT * 1.35;

    const lotCost = unitCostT * p.qty;
    const lotPrice = unitPriceU * p.qty;

    return {
      row: p.row,
      name: p.name,
      qty: p.qty,
      hhTotal,
      laborLot,
      indirectsLot,
      luzLot,
      wearLot,
      laserLot,
      consumablesLot,
      materialLot: p.materialL,
      extraRUnit,
      paintSUnit,
      unitCostT,
      unitPriceU,
      lotCost,
      lotPrice,
      origUnitCostT: p.origT,
      origUnitPriceU: p.origU,
    };
  });

  const totalLotCost = rows.reduce((a, r) => a + r.lotCost, 0);
  const totalLotPriceNoIgv = rows.reduce((a, r) => a + r.lotPrice, 0);
  const totalLotPriceWithIgv = totalLotPriceNoIgv * 1.18;

  const origTotalLotCost = SHOPSMART_PRODUCTS.reduce((a, p) => a + p.origT * p.qty, 0);
  const origTotalLotPriceNoIgv = SHOPSMART_PRODUCTS.reduce((a, p) => a + p.origU * p.qty, 0);

  const effectiveMarginOnSellPct =
    totalLotPriceNoIgv > 0
      ? ((totalLotPriceNoIgv - totalLotCost) / totalLotPriceNoIgv) * 100
      : 0;
  const effectiveMarkupPct =
    totalLotCost > 0 ? ((totalLotPriceNoIgv - totalLotCost) / totalLotCost) * 100 : 0;

  const origMarginOnSellPct =
    ((origTotalLotPriceNoIgv - origTotalLotCost) / origTotalLotPriceNoIgv) * 100;

  const activeFixesCount = Object.values(switches).filter(Boolean).length;

  return {
    rows,
    totalLotCost,
    totalLotPriceNoIgv,
    totalLotPriceWithIgv,
    effectiveMarginOnSellPct,
    effectiveMarkupPct,
    origTotalLotCost,
    origTotalLotPriceNoIgv,
    origMarginOnSellPct,
    costDeltaVsExcel: totalLotCost - origTotalLotCost,
    priceDeltaVsExcel: totalLotPriceNoIgv - origTotalLotPriceNoIgv,
    activeFixesCount,
  };
}

/**
 * Measures the isolated impact on Lot Cost and Lot Price when flipping ONLY one switch ON
 * from the baseline Excel state.
 */
export function getSingleSwitchIsolatedImpact(
  key: keyof ShopSmartSwitches,
  targetMarginOnSellPct = 35
): { costDelta: number; priceDelta: number } {
  const base = calculateShopSmartAudit(DEFAULT_SHOPSMART_SWITCHES, targetMarginOnSellPct);
  const withSingleFix = calculateShopSmartAudit(
    { ...DEFAULT_SHOPSMART_SWITCHES, [key]: true },
    targetMarginOnSellPct
  );
  return {
    costDelta: withSingleFix.totalLotCost - base.totalLotCost,
    priceDelta: withSingleFix.totalLotPriceNoIgv - base.totalLotPriceNoIgv,
  };
}
