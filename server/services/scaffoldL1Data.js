import { PROCESS_TYPE_LABELS } from '../../shared/processTypeLabels.js';
import { validate } from '../validation/validator.js';

/**
 * Must be exact labels from `metrics_signals` in dictionaries — editor save validates refs.
 * Generic placeholder until the domain owner picks real metrics.
 */
const SCAFFOLD_METRICS_SIGNALS = ['Goal progress vs plan'];

/**
 * Build a minimal valid process_l1 JSON for a new domain from catalog metadata.
 * @param {import('../../shared/domainCatalog.js').DOMAIN_CATALOG[number]} catalogEntry
 */
export function buildScaffoldL1Json(catalogEntry) {
  const today = new Date().toISOString().slice(0, 10);
  const data = {
    name: catalogEntry.name_ru,
    type: PROCESS_TYPE_LABELS.process_l1,
    purpose: `Домен «${catalogEntry.name_ru}»: управленческая область компании (черновик — заполните по мере развития).`,
    description: catalogEntry.description_ru,
    main_goal: `Обеспечить устойчивое развитие направления «${catalogEntry.name_ru}».`,
    scope: 'Границы домена уточняются владельцем.',
    when_used: 'Постоянно, как часть операционной модели компании.',
    triggers: ['Плановый цикл ревью', 'Изменение стратегии или приоритетов'],
    inputs: ['Стратегические приоритеты', 'Операционные данные'],
    outputs: ['Решения и артефакты домена'],
    owner: 'CEO',
    participants: ['CEO'],
    process_steps: [
      { step: 'Диагностика', description: 'Оценить текущее состояние области' },
      { step: 'Планирование', description: 'Согласовать приоритеты и ресурсы' },
      { step: 'Исполнение и контроль', description: 'Вести работу и отслеживать результаты' },
    ],
    linked_meetings: [],
    linked_artifacts: [],
    linked_systems: [],
    metrics_signals: [...SCAFFOLD_METRICS_SIGNALS],
    review_cadence: 'Quarterly review of domain design.',
    access_level: 'Management / domain owner; selective read access for teams.',
    version: '0.1',
    updated_at: today,
  };

  const result = validate(data, 'process_l1');
  if (!result.valid) {
    throw new Error(`Scaffold L1 validation failed: ${result.errors.join('; ')}`);
  }
  return data;
}
