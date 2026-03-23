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

  it('unified create under /domain/:id/create', () => {
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
      { domainId: 'd' },
      '/domain/d/create/l2',
    );
    expect(ctx.createFlow).toBe('legacy-l2');
    expect(ctx.processType).toBe('process_l2');
  });

  it('edit SOP', () => {
    const ctx = resolveContext(
      {
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
      { domainId: 'dom' },
      '/domain/dom/l1/edit',
    );
    expect(ctx.processType).toBe('process_l1');
    expect(ctx.existingPath).toBe('processes/dom/process.json');
  });
});
