# ВИЖУ AV calculator — Stage 10 catalog quality hotfix

## Что изменено

- Добавлена расширяемая модель релевантности supplier-позиций: `relevance`, `relevanceScore`, `relevanceReason`, `requiresCatalogReview`, `hiddenByDefault`, `approvedForAutoEstimate`.
- Добавлены словари и конфликтные правила в `src/data/catalogRelevanceRules.js`.
- Полностью заменён классификатор в `src/engine/catalogRelevance.js`.
- Добавлены правила допуска в автосмету в `src/engine/autoEstimateEligibility.js`.
- Добавлен отчёт качества каталога в `src/engine/catalogQualityReport.js`.
- Добавлены localStorage override в `src/storage/catalogRelevanceOverrides.js`.
- На странице библиотеки добавлены быстрые вкладки качества, счётчики, бейджи, причины классификации и экспертные действия.
- Автогенерация сметы теперь использует только позиции, прошедшие фильтр релевантности.
- IT-позиции допускаются в автосмету только при явной связи с шаблоном/медиасерверным контекстом и ручном/шаблонном разрешении.
- Спорные и скрытые позиции не используются в автоматической генерации.
- Добавлены тесты `tests/catalogRelevance.test.js` и `tests/autoEstimateEligibility.test.js`.

## Проверка supplier-каталога

Полный supplier-каталог загружен в Node-проверке: 57 098 позиций.

Текущая автоматическая классификация:

- AV core: 5 435
- AV infrastructure: 20 750
- IT related: 2 979
- Consumables: 1 242
- Questionable / requires review: 24 710
- Hidden: 280
- Service: 1 702
- Hidden by default: 29 211

Большая доля `questionable` ожидаема для прайсов с короткими или плохо нормализованными названиями. Эти позиции не удалены и доступны для экспертной ручной проверки.

## Пройденные проверки

- `npm test` — пройден.
- Security tests — пройдены.
- Catalog relevance tests — пройдены.
- Auto-estimate eligibility tests — пройдены.
- Static security scan — критичных ошибок нет, осталось 23 warning по существующим template-string/innerHTML местам из предыдущего этапа.

## Важные ограничения

- Supplier-позиции физически не удалялись.
- Backend не добавлялся.
- Lazy loading supplier-каталога сохранён.
- По умолчанию библиотека показывает AV-релевантное и инфраструктуру; IT, расходники, спорные и скрытые позиции включаются отдельно.
