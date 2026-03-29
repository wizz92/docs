/**
 * Repository interfaces for the data layer.
 * Runtime implementations: MongoDB (processes + dictionaries); templates read from `templates/*.json`.
 */

/**
 * @typedef {Object} ProcessRepository
 * @property {() => Promise<any>} getMasterIndex
 * @property {(domainId: string) => Promise<any>} getDomainIndex
 * @property {(domainId: string, relativePath: string) => Promise<any>} getProcessByPath
 * @property {(domainEntry: object, l1Data: any) => Promise<{ domainId: string, path: string }>} createDomain
 * @property {(domainId: string, slug: string, data: any) => Promise<{ folderName: string, path: string }>} createL2
 * @property {(domainId: string, l2Folder: string, slug: string, data: any) => Promise<{ folderName: string, path: string }>} createL3
 * @property {(domainId: string, l2Folder: string, l3Folder: string, data: any) => Promise<{ fileName: string, path: string }>} createSop
 * @property {(domainId: string, relativePath: string, data: any) => Promise<{ path: string }>} updateProcess
 * @property {(domainId: string) => Promise<any>} rebuildDomainIndex
 */

/**
 * @typedef {'l1'|'l2'|'l3'|'sop'} TemplateType
 */

/**
 * @typedef {Object} TemplateRepository
 * @property {(type: TemplateType) => Promise<any>} getTemplate
 */

/**
 * @typedef {Object} DictionaryRepository
 * @property {() => Promise<any>} getDictionaries
 * @property {() => Promise<any>} getEditableDictionaries
 * @property {(next: any) => Promise<any>} saveDictionaries
 */

// Implementations: mongoProcessRepository, mongoDictionaryRepository, jsonTemplateRepository (authoring templates on disk).

export {};

