export const DEFAULT_SETTINGS = {
  usdRate: 80,
  defaultVatPct: 20,
  defaultMarginPct: 28,
  defaultMarginMode: 'markup',
  targetBudgetIncludesVat: true,
  complexityRules: { ceilingStep: 0.03, zoneStep: 0.03, urgent: 0.12, interactive: 0.08, outdoor: 0.1 },
  logisticsRules: { local: 1, regional: 1.08, remote: 1.18, hard: 1.3 },
  laborRates: { installationPct: 0.12, pnrPct: 0.07, contentPct: 0.1, cablePct: 0.055, logisticsPct: 0.04, servicePct: 0.03 },
  proposalSettings: { companyName: 'ВИЖУ', title: 'Коммерческое предложение', warranty: '12 месяцев', validityDays: 14 }
};
