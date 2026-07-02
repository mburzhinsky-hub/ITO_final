# STAGE13_ROLE_SCORING_VALIDATION_UX_MODES_REPORT

## Цель hotfix

Выполнен normal product/catalog/validation/UX hotfix для AV-калькулятора ВИЖУ без полного переписывания архитектуры. Основные изменения: supplier-first автоподбор теперь проходит через deterministic role-based scoring, проверка проекта закрывает AV-группы по инженерным признакам, dependency warnings группируются, а интерфейс разделён на режимы «Быстрый пресейл» и «Инженерная проверка».

## Изменённые и добавленные файлы

### Добавлены

- `src/data/roleScoringRules.js`
- `src/engine/roleScoring.js`
- `src/engine/systemGroupCoverage.js`
- `scripts/build-supplier-template-index.js`
- `tests/stage13RoleScoringValidationUx.test.js`
- `STAGE13_ROLE_SCORING_VALIDATION_UX_MODES_REPORT.md`

### Изменены

- `src/data/supplierTemplateIndex.js`
- `src/data/defaultSettings.js`
- `src/engine/estimate.js`
- `src/engine/projectFactory.js`
- `src/engine/validation.js`
- `src/app/state.js`
- `src/components/AppLayout.js`
- `src/components/GroupedEstimateTable.js`
- `src/components/LibraryFilters.js`
- `src/components/WarningCard.js`
- `src/components/WarningList.js`
- `src/pages/CheckPage.js`
- `src/pages/EstimatePage.js`
- `src/pages/LibraryPage.js`
- `src/components/StepNav.js`
- `src/components/ProjectSummaryBar.js`
- `tests/run-tests.js`

## Role-based scoring

Добавлен отдельный deterministic scoring слой:

- правила ролей лежат в `src/data/roleScoringRules.js`;
- scoring engine лежит в `src/engine/roleScoring.js`;
- для позиции собирается нормализованный role text из `name`, `brand`, `model`, `category`, `supplierCategory`, `categoryId`, `subcategoryId`, `description`, `note`, `tags`, `systemGroups`;
- для роли считаются:
  - positive keyword hits;
  - contextual hits;
  - category hints;
  - brand hints, если заданы;
  - negative keyword penalties;
  - accessory penalties для ролей, где требуется основное устройство;
  - relevance/approved bonuses;
- итоговые поля:
  - `templateRole`;
  - `templateRoleId`;
  - `roleFitScore`;
  - `roleFitMinScore`;
  - `roleFitReason`;
  - `needsEngineerReview`.

Позиция не допускается в auto-estimate для роли, если `roleFitScore < roleFitMinScore`.

## Добавленные AV-роли и rules

В `AV_ROLE_SCORING_RULES` добавлены правила для ролей:

1. `display-panel` — LCD / display panel
2. `projector` — Projector
3. `projection-screen` — Projection screen
4. `led-wall` — LED screen / LED wall
5. `ptz-camera` — PTZ camera
6. `webcam-usb-camera` — Webcam / USB camera
7. `microphone` — Microphone
8. `speaker` — Speaker / acoustic system
9. `dsp-audio-processor` — DSP / audio processor
10. `amplifier` — Amplifier
11. `video-switcher-matrix-scaler` — Video switcher / matrix / scaler
12. `control-processor` — Control processor
13. `touch-panel-control-panel` — Touch panel / control panel
14. `network-switch` — Network switch
15. `rack-cabinet` — Rack / cabinet
16. `mount-bracket` — Mount / bracket
17. `cable-infrastructure` — Cable infrastructure
18. `power-ups-pdu` — Power / UPS / PDU
19. `media-player` — Media player
20. `videoconference-codec` — Videoconference codec
21. `interactive-display` — Interactive display
22. `digital-signage` — Digital signage
23. `lighting` — Lighting
24. `vr-ar` — VR / AR
25. `works-installation-commissioning` — Works / installation / commissioning

Для каждой роли есть positive/negative keywords, category hints, минимальный score и accessory policy. Например:

- LED role отсекает `wall mount`, `bracket`, `touch panel`, `audio processor`, `microphone`, `speaker`, `case`.
- Projection screen отсекает touch panels, projectors, displays, mounts and speakers.
- LCD/display role отсекает акустику, микрофоны, усилители, крепления, control/touch panels и Dante/RS485 wall panels.
- Microphone role отсекает speakers, amplifiers, displays and cameras.
- Speaker role отсекает amplifiers and mounting accessories.
- Rack/cabinet role отсекает displays, projectors, microphones and cameras.
- Mount/bracket и cable infrastructure являются accessory-friendly ролями.

## Пересборка `supplierTemplateIndex.js`

Добавлен воспроизводимый скрипт:

```bash
node scripts/build-supplier-template-index.js
```

Скрипт:

1. читает `public/data/suppliers/*.json`;
2. классифицирует supplier-позиции через существующий `classifySupplierItem`;
3. применяет role-based scoring из `roleScoring.js`;
4. исключает позиции ниже `roleFitMinScore`;
5. формирует compact supplier index без загрузки полного supplier-каталога на старте;
6. пишет результат в `src/data/supplierTemplateIndex.js`.

Индекс был пересобран из `57098` supplier rows. Сводка по числу compact-позиций:

```json
{
  "LCD-панели": 2,
  "Мониторы": 2,
  "Проекторы": 18,
  "Проекционные экраны": 0,
  "LED-экраны": 18,
  "Видеостены": 18,
  "Камеры": 18,
  "PTZ-камеры": 18,
  "Микрофоны": 18,
  "Конференц-системы": 18,
  "Акустика": 18,
  "DSP и усилители": 18,
  "Коммутация": 18,
  "Системы управления": 13,
  "Сеть": 0,
  "AV-стойки": 18,
  "Доп. оборудование": 18,
  "Крепления и конструкции": 18,
  "Кабельная инфраструктура": 18,
  "Питание": 18,
  "ИБП": 18,
  "Медиасерверы": 18,
  "ПК": 18,
  "ВКС-системы": 18,
  "Интерактивные панели": 18,
  "Свет": 5,
  "VR / AR": 0
}
```

Текущий важный нюанс: по строгим rules для `Проекционные экраны`, `Сеть` и `VR / AR` в текущих supplier-прайсах не нашлось достаточно надёжных supplier-позиций. Для этих ролей продолжает работать fallback-библиотека или ручное добавление. Это лучше, чем протаскивать аксессуары/ошибочные позиции в основные устройства.

## Изменение выбора supplier-кандидатов

В `src/engine/estimate.js` изменена логика supplier-first auto-estimate:

- supplier candidate теперь дополнительно обогащается через `enrichItemRoleFit`;
- `selectSupplierCandidate` фильтрует кандидатов по `roleFitScore >= roleFitMinScore`;
- fallback-библиотека также проходит role scoring, чтобы fallback не подставлял неверный тип устройства;
- `selectBestCandidate` сортирует по:
  1. role fit score;
  2. supplier-first при равном role fit;
  3. solution level distance;
  4. priority score;
  5. supplier priority;
  6. наличие цены;
  7. разумная цена около медианы;
  8. цена;
  9. имя.

В сметные строки теперь сохраняются диагностические поля `source`, `supplier`, `templateRole`, `templateRoleId`, `replacementGroup`, `systemGroups`, `roleFitScore`, `roleFitMinScore`, `roleFitReason`, `needsEngineerReview`.

## Проверка закрытия AV-групп

Добавлен слой `src/engine/systemGroupCoverage.js`.

Теперь validation не полагается только на текстовое совпадение `category`. Покрытие считается через:

- `replacementGroup`;
- `templateRole` / `templateRoleId`;
- `systemGroups`;
- `category` / `supplierCategory` как fallback;
- нормализованные coverage groups.

Примеры покрытия:

- `video` закрывается LCD/display, LED, projector, projection screen, camera, video switcher, media player, VCS codec.
- `audio` закрывается microphone, speaker, DSP, amplifier, conference system.
- `control` закрывается control processor, touch/control panel, VCS codec, interactive display.
- `network` закрывается network switch, AV-over-IP/video switching, media player/network infrastructure.
- `cabling` закрывается cable infrastructure and signal infrastructure.
- `power` закрывается UPS/PDU/power distribution.

В `src/engine/validation.js` добавлены `estimateLineCoversGroup` и `requiredGroupCoverageKeys` для проверки required groups зоны.

## Дедупликация warnings

В `src/engine/validation.js` добавлен `deduplicateWarnings`.

Группируются инженерные warnings по:

- типу проблемы;
- зоне;
- отсутствующей роли / AV-группе;
- required/recommended dependency.

Grouped warning сохраняет:

- `groupedCount`;
- `affectedZones`;
- `affectedEntityIds`;
- severity;
- recommended action.

Severity нормализуется к новой модели:

- `critical` вместо старого `error`;
- `warning`;
- `review` вместо старого `recommendation`;
- `info`.

UI-компоненты обновлены так, чтобы учитывать и старые, и новые значения severity.

## UX-режимы

Добавлены два режима интерфейса:

1. `quick` — «Быстрый пресейл»;
2. `engineering` — «Инженерная проверка».

Настройка хранится в `settings.uiMode`, дефолт — `quick`.

### Быстрый пресейл

В быстром режиме:

- активен компактный вид сметы;
- скрыты roleFit/replacementGroup/systemGroups diagnostics;
- скрыты advanced-фильтры библиотеки;
- скрыты catalog curation controls;
- WarningList показывает только critical/warning, а review/info уводит в инженерный режим;
- пользователь видит простую цепочку: паспорт → зоны → смета → проверка → КП.

### Инженерная проверка

В инженерном режиме:

- доступен detailed view сметы;
- показываются `roleFitScore`, `roleFitReason`, `templateRole`, `replacementGroup`, `systemGroups`;
- показываются grouped warning details;
- доступны advanced filters библиотеки;
- доступны catalog curation controls;
- режим переключается без сброса проекта, сметы или фильтров.

Переключатель добавлен в `AppLayout`.

## Добавленные и обновлённые тесты

Добавлен `tests/stage13RoleScoringValidationUx.test.js`.

Покрыты сценарии:

- LED role reject для mounts/touch/audio accessories;
- projection screen reject для touch panel;
- LCD role reject для acoustics/control panels;
- microphone reject для speaker;
- speaker reject для amplifier;
- rack reject для display/projector;
- cable infrastructure допускает cables;
- mount/bracket допускает brackets, но не main displays;
- questionable rows получают `needsEngineerReview`;
- roleFitScore влияет на `selectBestCandidate`;
- supplier-first сохраняется при равном role fit;
- плохой supplier role fit не выигрывает только из-за supplier source;
- generated supplier rows сохраняют role diagnostics;
- AV-группы закрываются через `templateRole`, `replacementGroup`, `systemGroups`;
- false zone-group warning не появляется при корректном coverage;
- dependency warnings дедуплицируются;
- severity `critical` выставляется для error-level validation;
- default/quick UX mode скрывает engineering fields;
- engineering mode показывает roleFit diagnostics and advanced filters;
- switching mode does not reset the current project.

Также обновлён `tests/run-tests.js`.

## Результаты проверок

### `npm install`

Результат:

```text
up to date, audited 1 package
found 0 vulnerabilities
```

### `npm test`

Результат: успешно.

```text
Catalog relevance tests passed.
Auto-estimate eligibility tests passed.
Supplier-first selection tests passed.
Minimal logic/UX hotfix tests passed.
Stage13 role scoring / validation / UX mode tests passed.
Security tests passed. Static scan warnings: 24.
```

Static security scan вывел существующие WARN по template string / innerHTML usage. Критичных ошибок scan не вернул, тестовый раннер завершился успешно.

### `npm run build`

Не запускался: в `package.json` нет `build` script.

### `npm run dev`

Не запускался: в `package.json` нет `dev` script.

## Известные ограничения

1. Scoring deterministic и keyword-based, не AI-классификация. Он намеренно консервативен: если supplier-позиция спорная или недостаточно похожа на роль, она не попадает в auto-estimate.
2. В текущих прайсах для некоторых ролей строгий scorer не нашёл надёжных supplier-позиций (`Проекционные экраны`, `Сеть`, `VR / AR`). Для этих случаев работает fallback-библиотека или ручной подбор.
3. Full supplier catalog по-прежнему lazy-loaded; stage13 не меняет механизм полной загрузки supplier-прайсов.
4. Static security scan сохраняет предупреждения по существующим template string render paths; они не являются новыми fatal findings stage13 и не ломают тесты.
