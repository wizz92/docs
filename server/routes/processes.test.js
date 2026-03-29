import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('processes routes', () => {
  let app;
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    const { createApp } = await import('../createApp.js');
    app = createApp();
  });

  afterAll(async () => {
    await mongod?.stop();
  });

  it('GET /api/backend sets X-Request-Id', async () => {
    const res = await request(app).get('/api/backend');
    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBeDefined();
    expect(String(res.headers['x-request-id']).length).toBeGreaterThan(0);
  });

  it('GET /api/backend echoes client X-Request-Id', async () => {
    const res = await request(app)
      .get('/api/backend')
      .set('X-Request-Id', 'test-correlation-id');
    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe('test-correlation-id');
  });

  it('POST /api/validate returns 400 with code when type/data missing', async () => {
    const res = await request(app).post('/api/validate').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.code).toBe('bad_request');
  });

  it('POST /validate fails schema before dictionary (no disk read for invalid empty sop)', async () => {
    const res = await request(app)
      .post('/api/validate')
      .send({ type: 'sop', data: {} });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });
});
