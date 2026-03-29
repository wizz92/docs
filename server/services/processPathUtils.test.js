import { describe, it, expect } from 'vitest';
import {
  wildcardPath,
  getTypeKeyFromRelativePath,
  applySchemaDefaults,
  DEFAULT_VIDEO_GUIDE,
} from './processPathUtils.js';

describe('wildcardPath', () => {
  it('joins array segments', () => {
    expect(wildcardPath(['a', 'b', 'c'])).toBe('a/b/c');
  });
  it('stringifies non-array', () => {
    expect(wildcardPath('x/y')).toBe('x/y');
  });
});

describe('getTypeKeyFromRelativePath', () => {
  it('detects L1', () => {
    expect(getTypeKeyFromRelativePath('process.json')).toBe('process_l1');
  });
  it('detects L2', () => {
    expect(getTypeKeyFromRelativePath('01-domain/process.json')).toBe('process_l2');
  });
  it('detects L3', () => {
    expect(getTypeKeyFromRelativePath('l2/l3/process.json')).toBe('process_l3');
  });
  it('detects SOP', () => {
    expect(getTypeKeyFromRelativePath('l2/l3/sop-01.json')).toBe('sop');
  });
  it('returns null for unknown shapes', () => {
    expect(getTypeKeyFromRelativePath('a/b')).toBe(null);
    expect(getTypeKeyFromRelativePath('')).toBe(null);
  });
});

describe('applySchemaDefaults', () => {
  it('fills video_guides when missing', () => {
    const data = {};
    applySchemaDefaults(data, 'process_l2');
    expect(data.video_guides).toEqual([DEFAULT_VIDEO_GUIDE]);
  });
});
