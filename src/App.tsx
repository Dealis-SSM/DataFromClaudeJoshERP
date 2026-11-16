/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ContradictionsSection } from './components/ContradictionsSection';
import { DataTraceabilitySection } from './components/DataTraceabilitySection';
import { ModelsAndSimulatorSection } from './components/ModelsAndSimulatorSection';
import { OverviewSection } from './components/OverviewSection';
import { SessionsLedgerSection } from './components/SessionsLedgerSection';
import { ShopSmartAuditSection } from './components/ShopSmartAuditSection';
import { TopBar, type ActiveTab } from './components/TopBar';
import { DEFAULT_SHOPSMART_SWITCHES, type ShopSmartSwitches } from './utils/shopSmartAudit';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('resumen');
  const [misusedOnlyTrigger, setMisusedOnlyTrigger] = useState(false);
  const [shopSmartSwitches, setShopSmartSwitches] = useState<ShopSmartSwitches>(
    DEFAULT_SHOPSMART_SWITCHES
  );

  const handleNavigate = (
    tab: ActiveTab,
    options?: { filterMisused?: boolean; focusSimulator?: boolean }
  ) => {
    setMisusedOnlyTrigger(Boolean(options?.filterMisused));
    setActiveTab(tab);

    if (options?.focusSimulator) {
      window.setTimeout(() => {
        document.getElementById('simulador-fabrica')?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      <TopBar
        activeTab={activeTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        onOpenSimulator={() => handleNavigate('modelos', { focusSimulator: true })}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {activeTab === 'resumen' && (
          <OverviewSection
            onNavigate={handleNavigate}
            shopSmartSwitches={shopSmartSwitches}
            onChangeShopSmartSwitches={setShopSmartSwitches}
          />
        )}
        {activeTab === 'shopsmart' && (
          <ShopSmartAuditSection
            switches={shopSmartSwitches}
            onChangeSwitches={setShopSmartSwitches}
            sectionId="auditoria-shopsmart-tab"
          />
        )}
        {activeTab === 'datos' && (
          <DataTraceabilitySection initialOnlyMisused={misusedOnlyTrigger} />
        )}
        {activeTab === 'contradicciones' && <ContradictionsSection />}
        {activeTab === 'modelos' && (
          <ModelsAndSimulatorSection simulatorAnchorId="simulador-fabrica" />
        )}
        {activeTab === 'sesiones' && <SessionsLedgerSection />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Estrumetal · Auditoría de Costeo y Cotizaciones (2011 – Nov 2026)</span>
          <span className="font-mono tabular-nums">
            Fuente auditada: 7 archivos ZIP · 88 chats relevantes / 224 excluidos
          </span>
        </div>
      </footer>
    </div>
  );
}
