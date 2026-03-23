/**
 * Manual tooltip copy merged on top of generated fieldHelp.json (from templates).
 * Use for fields missing in templates, slug, and EditorPage create controls.
 */

const VIDEO_GUIDES_HELP =
  'Ссылки на видео-инструкции (YouTube, Loom, внутренние записи). Укажите по одному URL в строке. Пример: ссылка на скринкаст регистрации на платформе.';

const ADDITIONAL_MATERIALS_SHAPE = {
  label:
    'Краткое человекочитаемое название материала: документ, чеклист, шаблон, внешняя статья.',
  url: 'Полный URL или относительный путь к материалу. Должен открываться у целевой аудитории.',
};

/** @type {Record<string, unknown>} */
export const FIELD_HELP_MANUAL = {
  slug:
    'Имя папки процесса в формате kebab-case на латинице (как в `NN-my-process-name`). Используется как часть пути в `public/processes/`. Без пробелов и кириллицы; дефисы допустимы.',

  editor: {
    domain:
      'Домен (L1) — верхний уровень в дереве процессов (`public/processes/{domain-id}/`). Новый L2/L3/SOP будет создан внутри выбранного домена.',
    level:
      'Уровень: L2 — ключевой процесс домена; L3 — подпроцесс внутри выбранного L2; SOP — пошаговая инструкция внутри выбранного L3. Не смешивай уровни (см. templates/INSTRUCTIONS.md).',
    parentL2:
      'Родительский L2: папка вида `{NN}-{kebab-case-slug}` с `process.json`. Обязателен для создания L3 и SOP.',
    parentL3:
      'Родительский L3: подпапка внутри L2. SOP сохраняется в этой папке как `sop-NN.json`.',
  },

  process_l1: {
    fields: {
      video_guides: VIDEO_GUIDES_HELP,
    },
    shapes: {
      additional_materials: ADDITIONAL_MATERIALS_SHAPE,
    },
  },

  process_l2: {
    fields: {
      video_guides: VIDEO_GUIDES_HELP,
    },
    shapes: {
      additional_materials: ADDITIONAL_MATERIALS_SHAPE,
    },
  },

  process_l3: {
    fields: {
      video_guides: VIDEO_GUIDES_HELP,
    },
    shapes: {
      additional_materials: ADDITIONAL_MATERIALS_SHAPE,
    },
  },

  sop: {
    fields: {
      video_guides: VIDEO_GUIDES_HELP,
    },
    shapes: {
      additional_materials: ADDITIONAL_MATERIALS_SHAPE,
    },
  },
};
