# STAGE12_MINIMAL_LOGIC_UX_HOTFIX_REPORT

## Цель hotfix

Выполнен минимальный logic/UX hotfix для AV-калькулятора ВИЖУ без большого рефакторинга и без изменения общей архитектуры приложения.

## Изменённые файлы

1. `src/data/zoneTaxonomy.js`
2. `src/data/installationTemplates.js`
3. `src/engine/pricing.js`
4. `src/engine/estimate.js`
5. `src/pages/PassportPage.js`
6. `src/components/LibraryFilters.js`
7. `src/pages/LibraryPage.js`
8. `src/components/EquipmentCard.js`
9. `tests/minimalLogicUxHotfix.test.js`
10. `tests/run-tests.js`

## Что исправлено

### 1. Невалидный template id `control-room`

- В default-наборе для project type `control` заменён несуществующий `control-room` на существующий и релевантный `dispatch-room`.
- Дополнительно исправлена связанная ссылка в `src/data/installationTemplates.js`: шаблон `control-room-videowall` теперь ссылается на `dispatch-room`, `situation-center`, `monitoring-video-wall`.
- Добавлены проверки, что все default template id для всех project type существуют и default-зоны создаются без потери шаблонов.

### 2. Ручные коэффициенты `complexityManual` и `logisticsManual`

- В `src/engine/pricing.js` добавлены `resolveComplexityCoef()` и `resolveLogisticsCoef()`.
- Если ручной коэффициент положительный и числовой, он используется вместо автоматического расчёта.
- Пустые, `null`, `undefined`, нечисловые и `<= 0` значения игнорируются, после чего используется старая автоматическая логика.
- Структура totals/pricing summary сохранена: поля `complexity`, `logisticsCoef`, `salePriceGross` и остальные итоговые поля остались на прежних местах.
- В `src/pages/PassportPage.js` добавлено обновление итоговой суммы в сводке паспорта при изменении ручных коэффициентов и связанных коммерческих полей.

### 3. Выбор лучшего кандидата без приоритета самой дорогой позиции

- В `src/engine/estimate.js` изменена логика `selectBestCandidate()`.
- Убрана сортировка `Number(b.unitCost || 0) - Number(a.unitCost || 0)`, которая автоматически выбирала максимальную цену.
- Новый порядок выбора:
  1. близость уровня решения к сценарию;
  2. `priorityScore`;
  3. supplier priority;
  4. наличие валидной цены;
  5. умеренная цена, близкая к медиане валидных цен;
  6. при равенстве — меньшая валидная цена.
- Supplier-first логика сохранена: supplier-пул по-прежнему проверяется раньше fallback-библиотеки.

### 4. Свернуты advanced-фильтры библиотеки

- В `src/components/LibraryFilters.js` фильтры разделены на базовый и расширенный режим.
- По умолчанию отображаются только:
  - поиск;
  - категория;
  - поставщик;
  - зона для добавления.
- Под кнопку `Показать больше фильтров` убраны:
  - подкатегория;
  - уровень;
  - валюта;
  - тип проекта;
  - категория зоны;
  - статус цены;
  - релевантность;
  - проверка / review status.
- В `src/pages/LibraryPage.js` добавлен URL-флаг `advanced=1`, обработчик раскрытия/сворачивания и сохранение выбранных фильтров при переключении режима.
- Панель качества supplier-каталога также скрыта по умолчанию и показывается только в расширенном режиме.

### 5. Убраны catalog-curation actions из обычной карточки оборудования

- В `src/components/EquipmentCard.js` служебные действия модерации скрыты за опцией `showCurationActions`.
- По умолчанию `showCurationActions = false`.
- Обычная карточка оставляет пользовательские действия:
  - `Добавить в смету`;
  - `Подробнее`;
  - зависимости;
  - альтернативы.
- При явном `{ showCurationActions: true }` служебные кнопки могут отображаться, поэтому функциональность модерации не удалена из кода.

## Добавленные / обновлённые тесты

Добавлен файл `tests/minimalLogicUxHotfix.test.js`, подключён в `tests/run-tests.js`.

Покрытие нового теста:

- `control-room` не используется в default-зонах;
- все default template id для всех project type существуют;
- для каждого project type создаются все default-зоны;
- manual complexity реально влияет на расчёт;
- manual logistics реально влияет на расчёт;
- невалидные manual значения игнорируются;
- автоматическая логика работает без manual значений;
- `selectBestCandidate()` не выбирает самую дорогую позицию только из-за цены;
- позиции без цены не получают необоснованный приоритет;
- premium-сценарий сохраняет приоритет уровня решения;
- supplier-first подбор продолжает выбирать supplier-позиции;
- collapsed library filters показывают только базовые фильтры;
- expanded library filters сохраняют расширенные возможности;
- обычная карточка оборудования не показывает catalog-curation actions;
- кнопка добавления и `Подробнее` остаются;
- curation actions доступны при явном включении режима.

## Результаты проверок

### `npm install`

Выполнено успешно.

Результат:

```text
up to date, audited 1 package
found 0 vulnerabilities
```

### `npm test`

Выполнено успешно.

Результат:

```text
Catalog relevance tests passed.
Auto-estimate eligibility tests passed.
Supplier-first selection tests passed.
Minimal logic/UX hotfix tests passed.
Security tests passed. Static scan warnings: 24.
```

Статические security warnings остались предупреждениями существующего сканера и не блокируют тесты (`failOnCritical: true`). Новых критических ошибок тестовый прогон не выявил.

### `npm run build`

Не выполнялся, потому что в `package.json` нет build-скрипта. Доступные scripts:

```json
{
  "test": "node tests/run-tests.js",
  "check": "node tests/run-tests.js"
}
```

### `npm run dev`

Не выполнялся, потому что в `package.json` нет dev-скрипта. Проект остаётся статическим frontend-приложением с входной точкой `index.html`.

## Известные ограничения

- Большой редизайн не выполнялся намеренно: hotfix ограничен логикой расчёта, выбором кандидатов и упрощением интерфейса библиотеки.
- Полный browser smoke-test через `npm run dev` не запускался из-за отсутствия dev-скрипта в проекте.
- Статический security scan по-прежнему выводит warnings по существующим местам template-string/innerHTML, но критических findings в текущей конфигурации нет.
