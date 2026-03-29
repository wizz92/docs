We discussed how to design a practical process documentation system for a company, especially for the domain “Operational Management,” in a way that is useful for a 200-person company and not just “documents for documents.”

CORE POSITION
The user rejected overly abstract process descriptions and wanted something operationally useful.
Main conclusion:
Documentation must be a management system, not a library of formal descriptions.
A process only works if it is tied to:
- owner
- cadence / trigger
- meetings / rituals
- inputs
- outputs
- artifacts
- systems
- done criteria
- failure modes / what to do if it breaks

KEY PRINCIPLES WE AGREED ON
1. Do not write documents for their own sake.
2. Do not mix abstraction levels.
3. Higher levels = less detail.
4. Lower levels = more operational detail.
5. Standardize the management frame, not every team’s internal mechanics.
6. In a 200-person company, one universal SOP for all teams is usually a mistake.
7. What should be common across teams:
   - process purpose
   - roles / ownership
   - triggers / cadence
   - minimal inputs / outputs
   - escalation rules
   - readiness logic
   - reporting / visibility logic
8. What can differ by function/team:
   - concrete steps
   - templates
   - tools
   - local rituals
   - detailed SOP implementation
9. Process docs must be linked as a system:
   L1 → L2 → L3 → SOP → artifact / meeting / system
10. Good documentation should answer:
   - when do we use this?
   - who owns it?
   - who participates?
   - what goes in?
   - what comes out?
   - where is it tracked?
   - what means “done”?
   - what happens if it fails?

LEVELS OF DOCUMENTATION
We defined 4 levels:

L1 = process domain / architecture layer
Question answered:
“How is this company domain structured as a management system?”
Example:
Operational Management

L2 = key process inside the domain
Question answered:
“What are the major management mechanisms inside this domain?”
L2 should be a process card, not a step-by-step instruction.

L3 = practical recurring subprocess / routine
Question answered:
“How is this L2 process actually carried out in recurring practice?”
Examples:
Roadmap Planning
Monthly Planning Review
Sprint Planning
Weekly Ops Review
Priority Review

SOP = instruction
Question answered:
“How exactly do we execute this specific routine / activity?”

MANDATORY FIELDS
We established the following required fields:

For L1:
- name
- purpose
- description
- main_goal
- scope
- when_used
- triggers
- inputs
- outputs
- owner
- participants
- linked_meetings
- linked_artifacts
- linked_systems
- metrics_signals
- review_cadence
- access_level
- version
- updated_at

For L2:
- name
- type
- purpose
- description
- main_goal
- when_used
- triggers
- inputs
- outputs
- owner
- participants
- linked_l3_subprocesses
- linked_sop
- linked_meetings
- linked_artifacts
- linked_systems
- metrics_signals
- review_cadence
- access_level
- version
- updated_at

For L3:
- name
- type
- purpose
- description
- main_goal
- when_used
- cadence
- trigger
- inputs
- outputs
- owner
- participants
- linked_meetings
- linked_artifacts
- linked_systems
- linked_sop
- done_criteria
- failure_modes
- deviation_response

For SOP:
- name
- type
- purpose
- description
- main_goal
- when_used
- trigger
- preconditions
- inputs
- steps
- outputs
- result_location
- done_criteria
- sla
- typical_errors
- exception_handling
- linked_templates_forms_links
- owner
- version
- updated_at

IMPORTANT DISTINCTION WE AGREED ON
Purpose vs Main Goal:
- Purpose = why the process exists in the management system
- Main Goal = what concrete outcome this process should produce

Outputs at different levels:
- L2 outputs = management-level results
- L3 outputs = operational outputs of the routine
- SOP outputs = concrete execution results / artifacts

HOW THIS SHOULD WORK IN A 200-PERSON COMPANY
We discussed the user’s concern that each team has unique context.
Conclusion:
This system only works if it is designed as:
- one common operating frame
- multiple local implementations

Recommended model:
- 20% common for all
  (roles, review cadence, escalation rules, readiness logic, required artifacts, status format)
- 80% adapted by function / team
  (steps, checklists, tools, detailed SOPs)

WHO USES THE PROCESS MAP
We agreed different layers serve different audiences:

L1/L2:
- CEO
- COO
- Heads of Functions
- Process Owners
- Operations / PMO

L3:
- Heads
- Team Leads
- Process Owners
- Delivery / Initiative Owners

SOP:
- Team Leads
- Individual contributors
- New managers / new employees
- Owners of specific repeated operations

KEY WARNING
The user strongly disliked process descriptions that felt theoretical or decorative.
Main criticism:
“It looks like documents for documents and lacks concrete operational value.”

Therefore the preferred style is:
- short on L1/L2
- practical on L3
- very concrete on SOP
- always tied to real meetings, systems, and artifacts

TERMINOLOGY AND TRANSLATION DECISIONS
We translated and adapted process card field names into Russian equivalents:
- Purpose = Назначение
- Description = Описание
- Main Goal = Основная цель
- Triggers = Триггеры запуска
- Inputs = Входы
- Outputs = Выходы
- Linked L3 subprocesses = Связанные подпроцессы L3
- Linked SOP = Связанные SOP
- Linked meetings = Связанные встречи
- Linked artifacts = Связанные артефакты
- Owner = Владелец процесса
- Review cadence = Периодичность пересмотра

We also agreed that “Назначение процесса” and “Основная цель процесса” are not identical:
- Назначение = role in the management system
- Основная цель = main outcome/result

OPERATIONAL MANAGEMENT DOMAIN
We built the L1 domain:
Operational Management / Операционное управление

Definition:
A system of processes that ensures predictable, transparent and manageable execution across teams, initiatives and functions.

We agreed that Operational Management at L1/L2 is not one linear BPMN flow.
It is a management operating system made of several L2 processes.

L2 PROCESSES FOR OPERATIONAL MANAGEMENT
We settled on 10 L2 processes grouped into 3 clusters.

A. Planning and prioritization
1. Операционное планирование
2. Управление приоритетами
3. Управление загрузкой и мощностью команд
4. Управление готовностью к старту

B. Execution control
5. Контроль выполнения целей
6. Контроль проектов, инициатив и запусков
7. Управление операционной отчетностью

C. Coordination and response
8. Межкомандная и межфункциональная координация
9. Управление эскалациями и критическими проблемами
10. Ритм операционного управления

IMPORTANT NAMING DECISIONS
The user wanted more practical company language instead of academic wording.

Inside “Операционное планирование” we renamed:
- “Квартальное операционное выравнивание” → “Планирование Roadmapа”
- “Выравнивание горизонта ближайших спринтов” → “Планирование спринта”

IMPORTANT CLARIFICATIONS WE MADE
Difference between Goal Execution Control and Operational Review:
- Goal Execution Control = are we achieving the target?
- Operational Review = what is happening in the operating system overall, and what management decisions are needed?

Difference between Goal Execution Control, Project & Initiative Oversight, and Operational Review:
- Goal Execution Control = target achievement layer
- Project & Initiative Oversight = specific initiatives/projects layer
- Operational Review = broader management review and decision layer

Meaning of “Ритм операционного управления”:
This is not just a list of meetings.
It is the company’s recurring management control cycle:
- weekly ops review
- sprint-to-management review
- initiative review
- function review
- follow-up of decisions

IMPORTANT RECOMMENDATION FOR WRITING L2 PAGES
The user disliked long theoretical L2 pages.
We concluded L2 pages should be compact process cards.
They should not contain long prose.
L3 and SOP should contain most of the operational detail.

PREFERRED FORMAT FOR A GOOD PROCESS PAGE
A strong L2/L3/SOP structure should be:
- what this is
- when to use it
- owner
- participants
- inputs
- outputs
- linked meetings
- linked artifacts
- linked systems
- steps (only on SOP)
- done criteria
- failure modes
- what to do if it breaks

HTML AND WIKI DISCUSSION
We discussed building process documentation as a wiki-like HTML system:
- each process can be a separate page
- pages can link to each other
- good for process wiki
- Confluence is suitable, but custom HTML process wiki is also possible
- the key is not the platform but the structure, linking, ownership and use in operations

ARTIFACTS CREATED DURING THE CONVERSATION
Several HTML pages were created to prototype process wiki pages, especially around:
- operational planning
- practical process page design
The user later shifted focus toward principles, field definitions and JSON process structures.

JSON STRUCTURE DECISION
The user wanted JSON outputs for process architecture.

We built JSON structures for:
1. L1 + L2 + L3 + SOP
2. L1 + L2 + L3
3. L1 + L2
4. L1 Operational Management with detailed L3 + SOP content

The structure used fields like:
- name
- type
- purpose
- description
- main_goal
- when_used
- triggers / trigger
- inputs
- outputs
- owner
- participants
- linked_meetings
- linked_artifacts
- linked_systems
- linked_l3_subprocesses
- linked_sop
- metrics_signals
- review_cadence
- access_level
- version
- updated_at
- children

L3 AND SOP TREE WE GENERATED
We generated a very detailed nested JSON for Operational Management including:
- L2
- L3
- SOP children under L3

Examples included:
For Operational Planning:
- Планирование Roadmapа
- Monthly planning review
- Планирование спринта
- Межкомандная planning sync
- Перепланирование при изменении условий

For Priority Management:
- Прием новых приоритетных запросов
- Priority review
- Переприоритизация
- Управление срочными работами
- Коммуникация изменений приоритетов

For Capacity / Load:
- Review доступной мощности
- Оценка загрузки команд
- Анализ узких мест
- Балансировка ресурсов между командами
- Эскалация перегруза

For Readiness:
- Проверка готовности backlog
- Проверка готовности к спринту
- Проверка готовности релиза
- Проверка готовности запуска
- Решение go / no-go

For Goal Control:
- Review прогресса по целям
- Трекинг целей команд
- Анализ отклонений
- Контроль corrective actions
- Выявление рисков по целям

MASTER PROMPT FOR ANOTHER LLM
We also created a “master prompt” for an AI writer / process writer. 

Core instruction:
Write company documentation as a management system, not as formal documents.
Key requirements:
- identify the level first (L1 / L2 / L3 / SOP)
- do not mix abstraction levels
- use company terminology
- be concise on upper levels
- be concrete on lower levels
- always include owner, trigger/cadence, inputs, outputs, artifacts, systems, done criteria
- include failure modes where useful
- keep it practical and suitable for real company use

IMPORTANT STYLE PREFERENCE
The user wants:
- no fluff
- no pseudo-methodology language
- no decorative theory
- practical, clear, implementation-ready structure
- realistic language for management and operations

IF ANOTHER LLM CONTINUES THIS WORK
It should:
1. preserve the 4-level model: L1 / L2 / L3 / SOP
2. preserve the practical company vocabulary
3. avoid abstract “process architecture for its own sake”
4. keep L2 concise
5. make L3 look like real recurring routines
6. make SOP very actionable
7. preserve the chosen Operational Management L2 structure
8. preserve the renamed L3 terms:
   - Планирование Roadmapа
   - Планирование спринта
9. produce outputs preferably in JSON / HTML / wiki-ready structure if requested
10. always tie documentation to real operating mechanisms:
   - meetings
   - artifacts
   - systems
   - ownership
   - cadence
   - follow-up

FINAL META-CONCLUSION
The user is not looking for textbook BPMN-style process modeling.
The user wants a practical operating model documentation framework that can actually be used by:
- COO
- Heads
- Team Leads
- Process Owners
in a mid-sized company with Scrum teams and multiple functions.