# Инструкция: как добавить новый процесс в портал

Этот документ описывает полный алгоритм добавления нового процесса — от определения уровня до регистрации в индексах. Следуй ему при каждом добавлении/обновлении процесса.

Правила написания процессов — в `prompt.md` (корень проекта).

---

## 1. Определи уровень процесса

| Уровень | Вопрос | Пример |
|---------|--------|--------|
| **L1** — домен | Как устроена операционная система компании в этой области? | «Операционное управление», «Выручка и коммерция» |
| **L2** — ключевой процесс | Какой основной механизм обеспечивает работу домена? | «Управление партнёрствами», «ORM: Управління review-сторінками бренду» |
| **L3** — подпроцесс / routine | Каким повторяемым способом реально выполняется L2? | «Створення review-сторінки бренду», «Сканирование рынка» |
| **SOP** — инструкция | Как именно выполнить конкретную операцию? | «Як зареєструвати review-сторінку бренду» |

**Правило**: не смешивай уровни. L2 не должен содержать пошаговую инструкцию, SOP не должен описывать архитектуру.

---

## 2. Структура файлов и папок

```
public/processes/
├── index.json                          ← master index (все домены)
├── {domain-id}/
│   ├── index.json                      ← domain index (L2, L3, SOP)
│   ├── process.json                    ← L1 process
│   ├── {NN}-{l2-slug}/
│   │   ├── process.json                ← L2 process
│   │   ├── {NN}-{l3-slug}/
│   │   │   ├── process.json            ← L3 process
│   │   │   ├── sop-01.json             ← SOP
│   │   │   ├── sop-02.json
│   │   │   └── ...
```

### Правила именования

- **Domain ID**: `kebab-case`, англ. Пример: `revenue-operations`, `operational-management`
- **Папки L2/L3**: `{NN}-{kebab-case-slug}`. `NN` — порядковый номер с ведущим нулём. Пример: `04-orm-review-management`, `01-review-page-creation`
- **SOP-файлы**: `sop-{NN}.json`. Пример: `sop-01.json`, `sop-02.json`
- **process.json** — всегда именно `process.json` (для L1, L2, L3)

---

## 3. Пошаговый алгоритм добавления

### Сценарий A: добавить новый L2 в существующий домен

1. **Определи следующий номер** L2 в домене. Посмотри существующие папки:
   ```
   ls public/processes/{domain-id}/
   ```
   Если последний — `03-revenue-analysis`, новый будет `04-...`.

2. **Создай папку** L2:
   ```
   mkdir -p public/processes/{domain-id}/{NN}-{l2-slug}
   ```

3. **Создай `process.json`** на основе `templates/template-l2.json`. Замени все поля `___REQUIRED___` и `___OPTIONAL___` реальными данными.

4. **Создай L3-подпроцессы** (см. Сценарий B ниже).

5. **Обнови `{domain-id}/index.json`** — добавь новый L2 в массив `l2_processes`:
   ```json
   {
     "name": "Название L2",
     "folder": "{NN}-{l2-slug}",
     "path": "processes/{domain-id}/{NN}-{l2-slug}/process.json",
     "type": "process_l2",
     "l3_processes": [ ... ]
   }
   ```

6. **Обнови `summary`** в `{domain-id}/index.json` — пересчитай `total_l2`, `total_l3`, `total_sop`, `total_files`.

### Сценарий B: добавить L3 в существующий L2

1. **Определи следующий номер** L3.

2. **Создай папку**:
   ```
   mkdir -p public/processes/{domain-id}/{l2-folder}/{NN}-{l3-slug}
   ```

3. **Создай `process.json`** на основе `templates/template-l3.json`.

4. **Создай SOP-файлы** (см. Сценарий C ниже).

5. **Обнови `{domain-id}/index.json`** — добавь L3 в `l3_processes` соответствующего L2:
   ```json
   {
     "name": "Название L3",
     "folder": "{NN}-{l3-slug}",
     "path": "processes/{domain-id}/{l2-folder}/{NN}-{l3-slug}/process.json",
     "type": "process_l3",
     "sops": [ ... ]
   }
   ```

6. **Обнови `linked_l3_subprocesses`** в L2 `process.json` — добавь название нового L3.

7. **Обнови `summary`** в domain `index.json`.

### Сценарий C: добавить SOP в существующий L3

1. **Определи следующий номер** SOP в папке L3.

2. **Создай `sop-{NN}.json`** на основе `templates/template-sop.json`.

3. **Обнови `{domain-id}/index.json`** — добавь SOP в `sops` массив соответствующего L3:
   ```json
   {
     "name": "Название SOP",
     "file": "sop-{NN}.json",
     "path": "processes/{domain-id}/{l2-folder}/{l3-folder}/sop-{NN}.json",
     "type": "sop"
   }
   ```

4. **Обнови `linked_sop`** в:
   - L3 `process.json` — добавь название SOP
   - L2 `process.json` — добавь название SOP (L2 содержит полный список всех SOP)

5. **Обнови `summary`** в domain `index.json`.

### Сценарий D: добавить новый домен (L1)

1. **Определи `domain-id`** в `kebab-case`.

2. **Создай структуру папок**:
   ```
   mkdir -p public/processes/{domain-id}
   ```

3. **Создай `process.json`** (L1) на основе `templates/template-l1.json`.

4. **Создай `index.json`** в папке домена по образцу существующих (см. `revenue-operations/index.json`).

5. **Обнови `public/processes/index.json`** (master index) — добавь новый домен в массив `domains`:
   ```json
   {
     "id": "{domain-id}",
     "name": "English Name",
     "name_ru": "Название на русском",
     "category": "Category",
     "description_ru": "Краткое описание...",
     "index_path": "processes/{domain-id}/index.json",
     "color": "#hex"
   }
   ```

6. Далее добавь L2, L3 и SOP по сценариям A–C.

---

## 4. Блок «Схема процесса» (ProcessDiagram)

Компонент `ProcessDiagram` строит визуальную цепочку:

```
[Триггер] → [Этап 1] → [Этап 2] → ... → [Результат]
```

Данные берутся из JSON:
- **Триггер**: `triggers[0]` (массив строк, обязательное поле на всех уровнях)
- **Этапы**: `process_steps[].step` — только поле `step`, поле `description` используется в блоке «Логика процесса»
- **Результат**: `outputs[0]`

### Рекомендации по `process_steps`

- **L2**: 5–8 шагов, верхнеуровневые этапы
- **L3**: 4–6 шагов, операционные шаги
- **SOP**: каждый шаг — одно конкретное действие (императив), `description` опционально
- Формулируй шаг глаголом: «Отримати задачу», «Перевірити політику», «Зафіксувати результат»
- Шаг должен быть коротким (3–5 слов) — он отображается в компактном блоке
- `description` — 1 предложение, раскрывающее что происходит на этом шаге

---

## 5. Файлы-индексы: формат

### Master index (`public/processes/index.json`)

```json
{
  "type": "master_index",
  "domains": [
    {
      "id": "domain-id",
      "name": "English Name",
      "name_ru": "Русское название",
      "category": "Category",
      "description_ru": "Описание домена",
      "index_path": "processes/{domain-id}/index.json",
      "color": "#hex"
    }
  ]
}
```

### Domain index (`public/processes/{domain-id}/index.json`)

```json
{
  "name": "Domain Name",
  "type": "process_index",
  "description": "Index of all processes and SOPs for ...",
  "base_path": "processes/{domain-id}",
  "l1": {
    "name": "Domain Name",
    "path": "processes/{domain-id}/process.json",
    "type": "process_l1"
  },
  "l2_processes": [
    {
      "name": "L2 Name",
      "folder": "01-l2-slug",
      "path": "processes/{domain-id}/01-l2-slug/process.json",
      "type": "process_l2",
      "l3_processes": [
        {
          "name": "L3 Name",
          "folder": "01-l3-slug",
          "path": "processes/{domain-id}/01-l2-slug/01-l3-slug/process.json",
          "type": "process_l3",
          "sops": [
            {
              "name": "SOP Name",
              "file": "sop-01.json",
              "path": "processes/{domain-id}/01-l2-slug/01-l3-slug/sop-01.json",
              "type": "sop"
            }
          ]
        }
      ]
    }
  ],
  "summary": {
    "total_l2": 0,
    "total_l3": 0,
    "total_sop": 0,
    "total_files": 0
  }
}
```

---

## 6. Чеклист перед завершением

- [ ] Все JSON-файлы валидны (проверь `python3 -c "import json; json.load(open('file.json'))"`)
- [ ] Все `name` в индексах совпадают с `name` в process.json / sop-XX.json
- [ ] Все `path` в индексах указывают на реальные файлы
- [ ] `linked_l3_subprocesses` в L2 содержит названия всех L3
- [ ] `linked_sop` в L2 и L3 содержит названия всех связанных SOP
- [ ] `summary` в domain index пересчитан
- [ ] `process_steps` заполнены (5–8 шагов для L2, 4–6 для L3)
- [ ] `triggers`, `inputs`, `outputs`, `owner` заполнены на всех уровнях
- [ ] `done_criteria` заполнены на L3 и SOP
- [ ] `updated_at` актуальна
- [ ] UI-портал отображает процесс корректно (если сервер запущен)

---

## 7. Шаблоны

Шаблоны с описанием всех полей находятся в папке `templates/`:

| Файл | Назначение |
|------|------------|
| `template-l1.json` | Шаблон L1 — домен процессов |
| `template-l2.json` | Шаблон L2 — ключевой процесс |
| `template-l3.json` | Шаблон L3 — подпроцесс / routine |
| `template-sop.json` | Шаблон SOP — пошаговая инструкция |

Каждое поле в шаблоне содержит:
- `___REQUIRED___` или `___OPTIONAL___` — обязательность
- Описание: что писать в этом поле
- Пример из реальных процессов

Поля с `___AUTO___` заполняются автоматически (дата обновления).

---

## 8. Унифицированные поля (единые для всех уровней)

Следующие поля используют **одинаковое имя и формат** на всех уровнях (L1, L2, L3, SOP):

| Поле | Формат | Описание |
|------|--------|----------|
| `triggers` | `string[]` | Массив триггеров. Всегда массив, даже если триггер один. |
| `process_steps` | `{step, description}[]` | Этапы процесса. Для L1/L2/L3 — визуальная схема. Для SOP — пошаговые действия. |
| `typical_failures` | `{failure, symptom, action}[]` | Типовые сбои. `symptom` может быть пустой строкой. |
| `inputs` | `string[]` | Входы процесса. |
| `outputs` | `string[]` | Выходы процесса. |
| `owner` | `string` | Владелец. |
| `version` | `string` | Версия. |
| `updated_at` | `string` | Дата обновления `YYYY-MM-DD`. |

**Устаревшие поля** (не использовать):
- ~~`trigger`~~ (строка) — заменено на `triggers` (массив)
- ~~`steps`~~ (строки) — заменено на `process_steps` (объекты)
- ~~`typical_errors`~~ + ~~`exception_handling`~~ — заменено на `typical_failures`
- ~~`failure_modes`~~ + ~~`deviation_response`~~ — заменено на `typical_failures`

---

## 9. Типовые ошибки

| Ошибка | Последствие | Как избежать |
|--------|-------------|--------------|
| Не обновил domain `index.json` | Процесс не появится в UI | Всегда обновляй индекс после создания файлов |
| `name` в индексе не совпадает с `name` в JSON | Несогласованность в навигации | Копируй name из process.json в индекс |
| Пустой `process_steps` | Блок «Схема процесса» не отображается | Всегда заполняй 4–8 шагов |
| Длинные названия шагов | Текст обрезается в диаграмме | Формулируй шаг в 3–5 слов |
| Нет `owner` | Нарушение правил prompt.md | Всегда указывай конкретное имя или роль |
| Нет `triggers` | Диаграмма показывает «Триггер» как placeholder | Всегда заполняй `triggers` (массив) |
| `summary` не пересчитан | Неверная статистика на странице домена | Пересчитывай после каждого изменения |

---

## 10. Подсказки в форме создания

После правок в `templates/template-*.json` выполни в корне проекта `npm run generate:field-help`, чтобы обновить тексты подсказок (tooltips) в UI создания процессов (`src/components/editor/fieldHelp.json`). Ручные дополнения — в `src/components/editor/fieldHelpManual.js`.
