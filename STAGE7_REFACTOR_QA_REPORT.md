# Stage 7 — рефакторинг кодовой базы и QA

## Что сделано

### Созданы файлы
- `package.json` — минимальные команды `npm test` и `npm run check`.
- `src/data/zoneCategories.js` — отдельный экспорт категорий зон.
- `src/data/zoneTemplates.js` — отдельный экспорт шаблонов зон.
- `src/data/workNorms.js` — отдельный источник норм работ.
- `src/engine/avSystemModel.js` — модель AV-системы по зонам.
- `src/engine/avDependencies.js` — единая точка входа для AV-зависимостей.
- `src/engine/avValidation.js` — инженерные AV-проверки.
- `src/engine/workCalculation.js` — расчётная витрина работ.
- `src/engine/cabling.js` — расчёт кабельной части.
- `src/engine/logistics.js` — отдельный экспорт логистического коэффициента.
- `tests/*` — тестовый runner, fixtures и набор тестов.
- `src/styles/base.css`, `layout.css`, `components.css`, `pages.css` — базовое разделение общего CSS.

### Изменены файлы
- `src/app/storage.js`
- `src/app/router.js`
- `src/engine/projectFactory.js`
- `src/engine/validation.js`
- `src/export/exportJson.js`
- `src/pages/PassportPage.js`
- `src/components/WelcomeIntro.js`
- `src/styles.css` и файлы в `src/styles/`

## Вынесенные данные
- Категории зон доступны из `src/data/zoneCategories.js`.
- Шаблоны зон доступны из `src/data/zoneTemplates.js`.
- Нормы работ доступны из `src/data/workNorms.js`.
- Каталог, зависимости, альтернативы, настройки и шаблоны инсталляций уже были вынесены в `src/data` на предыдущих этапах.

## Расчётные модули
- `pricing.js` — единая функция итогов `calculateProjectTotals`.
- `currency.js` — валюта и режимы цен.
- `estimate.js` — генерация сметы, сохранение manual-строк, dedupe derived-строк.
- `budget.js` — бюджет и отклонения.
- `validation.js` — паспорт, зоны, смета, коммерческие параметры.
- `avValidation.js` — инженерные AV-предупреждения.
- `proposalBuilder.js` — клиентское КП и внутренняя смета.
- `workCalculation.js`, `cabling.js`, `logistics.js` — отдельные витрины для работ, кабелей и логистики.

## Компоненты
Компонентная структура уже была создана ранее в `src/components` и `src/pages`. На этапе 7 дополнительно стабилизирован `WelcomeIntro`, а `PassportPage` получил защиту от XSS в пользовательских строках полей паспорта.

## Удалённые / нейтрализованные патчи
- Отдельных runtime-патчей в конце монолитного HTML не обнаружено: `index.html` уже является лёгкой точкой входа.
- Убрана зависимость router от глобального `location` без проверки окружения.
- Welcome-анимация больше не ломает приложение при недоступном `sessionStorage`.

## Найденные и исправленные ошибки
1. Ошибка «не хватает заказчик», когда заказчик хранится в `passport.customerName` / legacy-поле: добавлена нормализация alias-полей и проверка через единый customer resolver.
2. `storage.js` падал в средах без `localStorage`: добавлен safe wrapper.
3. Импорт JSON / сохранение проекта теперь проходят через `normalizeProject` и schemaVersion повышается до `7`.
4. Router больше не падает при отсутствии глобального `location`.
5. Welcome-анимация безопасно пропускается/завершается при недоступном storage.
6. Неизвестная валюта теперь даёт предупреждение в проверке сметы.
7. Добавлена отдельная AV-validation точка входа для инженерных связок.
8. Добавлены проверки, что клиентское КП не содержит закупку, поставщика и маржинальные поля.

## Добавленные тесты
- `pricing.test.js`
- `currency.test.js`
- `estimate.test.js`
- `budget.test.js`
- `validation.test.js`
- `avValidation.test.js`
- `proposalBuilder.test.js`
- `storage.test.js`
- `export.test.js`
- `catalogValidation.test.js`

Результат: `10 passed, 0 failed`.

## Как запустить приложение
Открыть `index.html` как статический сайт или через любой локальный static server, например:

```bash
python3 -m http.server 8080
```

Затем открыть `http://localhost:8080` из папки проекта.

## Как запустить тесты

```bash
npm test
```

или:

```bash
npm run check
```

## Что проверено
- Автоматические тесты расчётов, валют, бюджета, сметы, validation, AV-validation, КП, storage, JSON/Excel export и целостности каталога.
- Импорт всех JS-модулей в Node-like окружении с mock DOM/storage.
- Поиск inline event handlers в `index.html` и `src`.

## Что осталось на следующий этап
- Полноценный browser e2e smoke-test через Playwright/Cypress, если будет добавлен сборщик или тестовое окружение браузера.
- Более глубокая автоматическая XSS-проверка всех компонентов, где используются template strings.
- Более тонкая декомпозиция CSS по каждому компоненту, если проект перейдёт на сборщик или компонентный фреймворк.
