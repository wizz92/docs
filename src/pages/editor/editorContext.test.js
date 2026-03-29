import { describe, it, expect } from 'vitest';
import { resolveContext, TYPE_LABEL } from './editorContext.js';

describe('TYPE_LABEL', () => {
  it('has keys for all process levels', () => {
    expect(TYPE_LABEL.process_l1).toBeDefined();
    expect(TYPE_LABEL.sop).toBeDefined();
  });
});

describe('resolveContext', () => {
  it('unified create at /create', () => {
    const ctx = resolveContext({}, '/create');
    expect(ctx.mode).toBe('create');
    expect(ctx.createFlow).toBe('unified');
    expect(ctx.processType).toBe('process_l2');
  });

  it('unified create at /company/:companyId/create', () => {
    const ctx = resolveContext({ companyId: 'qwerty' }, '/company/qwerty/create');
    expect(ctx.mode).toBe('create');
    expect(ctx.createFlow).toBe('unified');
    expect(ctx.companyId).toBe('qwerty');
  });

  it('unified create under /company/:c/domain/:id/create', () => {
    const ctx = resolveContext(
      { companyId: 'qwerty', domainId: 'revenue-operations' },
      '/company/qwerty/domain/revenue-operations/create',
    );
    expect(ctx.mode).toBe('create');
    expect(ctx.createFlow).toBe('unified');
    expect(ctx.domainId).toBe('revenue-operations');
    expect(ctx.companyId).toBe('qwerty');
  });

  it('unified create under legacy /domain/:id/create', () => {
    const ctx = resolveContext(
      { domainId: 'revenue-operations' },
      '/domain/revenue-operations/create',
    );
    expect(ctx.mode).toBe('create');
    expect(ctx.createFlow).toBe('unified');
    expect(ctx.domainId).toBe('revenue-operations');
  });

  it('legacy L2 create', () => {
    const ctx = resolveContext(
      { domainId: 'd', companyId: 'qwerty' },
      '/company/qwerty/domain/d/create/l2',
    );
    expect(ctx.createFlow).toBe('legacy-l2');
    expect(ctx.processType).toBe('process_l2');
  });

  it('edit SOP', () => {
    const ctx = resolveContext(
      {
        companyId: 'qwerty',
        domainId: 'dom',
        l2Folder: 'l2',
        l3Folder: 'l3',
        sopFile: 'sop-01.json',
      },
      '/irrelevant',
    );
    expect(ctx.mode).toBe('edit');
    expect(ctx.processType).toBe('sop');
    expect(ctx.existingPath).toContain('sop-01.json');
  });

  it('edit L1', () => {
    const ctx = resolveContext(
      { domainId: 'dom', companyId: 'qwerty' },
      '/company/qwerty/domain/dom/l1/edit',
    );
    expect(ctx.processType).toBe('process_l1');
    expect(ctx.existingPath).toBe('processes/dom/process.json');
  });
});
