import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ALL_FIXED_SHOPSMART_SWITCHES,
  calculateShopSmartAudit,
  DEFAULT_SHOPSMART_SWITCHES,
  getSingleSwitchIsolatedImpact,
} from './shopSmartAudit.ts';

test('baseline ShopSmart Excel matches user pasted totals (Cost 29,276.92 -> Price 39,524.16)', () => {
  const res = calculateShopSmartAudit(DEFAULT_SHOPSMART_SWITCHES, 35);
  assert.ok(Math.abs(res.totalLotCost - 29276.92) < 1.5);
  assert.ok(Math.abs(res.totalLotPriceNoIgv - 39524.16) < 2.0);
  assert.ok(Math.abs(res.effectiveMarginOnSellPct - 25.93) < 0.1);
  assert.equal(res.activeFixesCount, 0);
});

test('toggling switches one by one modifies only the targeted cost/price component', () => {
  const overtimeImpact = getSingleSwitchIsolatedImpact('fixOvertimeJourney');
  assert.ok(overtimeImpact.costDelta < -500 && overtimeImpact.costDelta > -600);

  const luzImpact = getSingleSwitchIsolatedImpact('fixLuzRealBt4');
  assert.ok(luzImpact.costDelta < -2400 && luzImpact.costDelta > -2550);

  const marginImpact = getSingleSwitchIsolatedImpact('fixMarginOverSell', 35);
  assert.equal(Math.round(marginImpact.costDelta), 0);
  assert.ok(marginImpact.priceDelta > 5500);
});

test('all 8 fixes enabled yields true 35% margin on sell and higher realistic total', () => {
  const fixed = calculateShopSmartAudit(ALL_FIXED_SHOPSMART_SWITCHES, 35);
  assert.equal(fixed.activeFixesCount, 8);
  assert.ok(Math.abs(fixed.effectiveMarginOnSellPct - 35) < 0.05);
  assert.ok(fixed.totalLotCost > fixed.origTotalLotCost);
  assert.ok(fixed.totalLotPriceNoIgv > fixed.origTotalLotPriceNoIgv);
});
