export type DataCategory =
  | 'Mano de Obra y Tarifa HH'
  | 'Maquinaria y Desgaste'
  | 'Materiales y Mermas'
  | 'Pintura, Horno y Ciclones'
  | 'Decapado y Óxido'
  | 'Energía y Costos Fijos'
  | 'Reglas Comerciales y Márgenes'
  | 'Clientes y Lotes Reales';

export type UsageStatus =
  | 'vigente'
  | 'corregido'
  | 'mal_usado'
  | 'pendiente';

export interface EvolutionStep {
  date: string;
  sessionTitle: string;
  sourceId: string;
  action: string;
  outcome: 'usado_bien' | 'mal_usado' | 'corregido' | 'pendiente';
}

export interface BusinessDataRecord {
  id: string;
  title: string;
  category: DataCategory;
  status: UsageStatus;
  firstSeenDate: string;
  lastUpdatedDate: string;
  /** 1. Datos brutos */
  rawData: {
    summary: string;
    values: Array<{ label: string; value: string; unit?: string }>;
    origin: string;
  };
  /** 2. Qué se hizo con ellos */
  usageAndAudit: {
    wasUsed: boolean;
    howUsed: string;
    wasMisused: boolean;
    misuseDetail?: string;
    laterSessionsTimeline: EvolutionStep[];
  };
  /** 3. Producto final */
  finalProduct: {
    name: string;
    formulaOrRule: string;
    whereItLives: string;
    isCurrentTruth: boolean;
    caveat?: string;
  };
}

export type ContradictionStatus =
  | 'resuelta_aplicada'
  | 'resuelta_pendiente_aplicar'
  | 'decision_abierta';

export interface ContradictionRecord {
  id: string;
  topic: string;
  category: DataCategory;
  status: ContradictionStatus;
  older: {
    date: string;
    source: string;
    claimOrValue: string;
  };
  newer: {
    date: string;
    source: string;
    claimOrValue: string;
  };
  whyContradicts: string;
  impactOnQuoting: string;
  verdictForFactoryModel: string;
}

export interface FormulaModel {
  id: string;
  name: string;
  scope: string;
  lastUpdated: string;
  sourceDoc: string;
  maturity: 'produccion_grist' | 'en_calibracion' | 'referencia_historica';
  coreEquation: string;
  variables: Array<{ symbol: string; meaning: string; currentValue: string }>;
  knownGaps: string[];
  workflowSteps: string[];
}

export interface SessionRecord {
  uuidPrefix: string;
  date: string;
  updatedDate: string;
  title: string;
  msgCount: number;
  domain: 'Estrumetal Cotización' | 'Pintura y Decapado' | 'Grist / Sistemas' | 'Celindi / Maquila' | 'Energía / Planta' | 'Mano de Obra y Tarifa HH';
  rawInputs: string;
  whatWasDone: string;
  errorsOrCorrections: string;
  finalOutput: string;
}

export interface ExcludedCluster {
  label: string;
  countEstimate: string;
  examples: string[];
  reason: string;
}

export interface TimelineEra {
  period: string;
  title: string;
  summary: string;
  keyMilestones: string[];
}
