export const DEFAULT_SETTINGS = {
  usdRate: 80,
  eurRate: 95,
  defaultVatPct: 20,
  defaultMarginPct: 28,
  defaultMarginMode: 'markup',
  targetBudgetIncludesVat: true,
  complexityRules: { ceilingStep: 0.03, zoneStep: 0.03, urgent: 0.12, interactive: 0.08, outdoor: 0.1 },
  logisticsRules: { local: 1, regional: 1.08, remote: 1.18, hard: 1.3 },
  laborRates: { installationPct: 0.12, pnrPct: 0.07, contentPct: 0.1, cablePct: 0.055, logisticsPct: 0.04, servicePct: 0.03 },
  supplierPriority: { 'Аувикс': 10, 'Арис': 9, 'Хайтек медиа': 9, 'Digis': 8, 'CTC': 8, 'АтенПРО': 8, 'IMS': 8, 'Делайт 2000': 7, 'Audio Project': 7, 'CVG': 7, 'Tefra': 7, 'Profdisplay': 7, 'ИМЛАЙТ': 6, 'IPVS': 6, 'АНЛАН': 6, 'СНК-С': 6, 'AT GROUP': 5, 'OCS': 4, 'Треолан': 3, 'Регард': 2 },
  proposalSettings: { companyName: 'ВИЖУ', title: 'Коммерческое предложение', warranty: '12 месяцев', validityDays: 14 }
};
