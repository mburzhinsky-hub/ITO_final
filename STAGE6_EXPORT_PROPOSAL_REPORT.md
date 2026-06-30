# Stage 6: КП и экспорт

## Что сделано

1. Разделены представления данных:
   - `InternalEstimateView` — внутренняя инженерно-коммерческая смета с закупкой, поставщиками, маржей, источниками цены, предупреждениями и параметрами расчёта.
   - `ClientProposalView` — безопасное клиентское КП без закупки, маржи, поставщиков, source/debug-полей, технических id и raw dependency warnings.

2. Добавлен слой построения КП:
   - `src/engine/proposalBuilder.js`
   - `src/engine/proposalOptions.js`

3. Переделана страница `КП / экспорт`:
   - полноценный документный предпросмотр КП;
   - панель настроек детализации;
   - пресеты: краткое КП, КП по зонам, подробное КП, внутреннее согласование;
   - предупреждения перед экспортом при критичных ошибках;
   - понятное пустое состояние, если смета не заполнена.

4. Добавлены компоненты:
   - `ProposalPreview`;
   - `ProposalOptionsPanel`;
   - `ExportActions`;
   - `ImportProjectDialog`.

5. Улучшен HTML / PDF / печать:
   - standalone HTML-документ КП;
   - CSS для печати;
   - печать через браузер без тяжёлых PDF-библиотек;
   - из print-view убирается интерфейс приложения.

6. Улучшен Excel-экспорт:
   - формируется Excel-compatible XML workbook с листами:
     - Summary;
     - Client Proposal;
     - Internal Estimate;
     - Equipment;
     - Works;
     - Warnings;
     - Parameters.
   - Добавлены шапки, ширины колонок, freeze header, фильтры, денежные форматы и перенос текста.
   - Так как проект остаётся статическим без внешних зависимостей, файл выгружается как `.xls` SpreadsheetML, который открывается в Excel. Это безопасный fallback без подключения тяжёлой XLSX-библиотеки.

7. Улучшен JSON экспорт / импорт:
   - `exportProjectJson`;
   - `downloadProjectJson`;
   - `parseProjectJson`;
   - `validateImportedProject`;
   - `migrateProjectSchema`;
   - `importProject`.
   - JSON содержит `passport`, `zones`, `estimateItems`, `acceptedWarnings`, `proposalOptions`, `settingsOverrides`, `notes`, `schemaVersion`, `exportedAt`, `appVersion`.
   - Runtime/DOM-состояния не экспортируются.
   - Старые схемы нормализуются и мигрируют до schemaVersion 6.
   - При конфликте id можно импортировать копию.

## Важная проверка безопасности клиентского КП

Проверено smoke-тестом: клиентское представление и standalone HTML не содержат supplier/source-поля и не выводят себестоимость. Внутренняя смета при этом сохраняет поставщика и коммерческие параметры.

## Проверки

Выполнено:

```bash
find src -name '*.js' -print0 | xargs -0 -n1 node --check
node tmp-test.mjs
node stage6-test.mjs
```

Результат smoke-теста:

```text
stage6 smoke ok
```
