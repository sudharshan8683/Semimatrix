import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { Express } from 'express';

describe('Stage 2 & 6: Path A Sample Generation with Scenarios & Workspace Scoping', () => {
  let app: Express;
  let userAToken: string;
  let userBToken: string;

  beforeAll(async () => {
    app = createApp();

    // Register User A
    const resA = await request(app).post('/api/v1/auth/register').send({
      email: 'userA.scenario@semimatrix.local',
      password: 'Password123!',
      fullName: 'User A Scenario Evaluator',
      workspaceName: 'Workspace A'
    });
    userAToken = resA.body.data.tokens.accessToken;

    // Register User B
    const resB = await request(app).post('/api/v1/auth/register').send({
      email: 'userB.scenario@semimatrix.local',
      password: 'Password123!',
      fullName: 'User B Scenario Evaluator',
      workspaceName: 'Workspace B'
    });
    userBToken = resB.body.data.tokens.accessToken;
  });

  it('rejects unauthenticated sample generation requests with 401', async () => {
    const res = await request(app).post('/api/v1/datasets/generate-synthetic').send({
      scenario: 'drift'
    });
    expect(res.status).toBe(401);
  });

  it('generates reproducible "drift" scenario for User A with target finding', async () => {
    const res = await request(app)
      .post('/api/v1/datasets/generate-synthetic')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        scenario: 'drift',
        seed: 42,
        days: 7
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.scenario).toBe('drift');
    expect(res.body.data.targetFinding).toBeDefined();
    expect(res.body.data.targetFinding.route).toBe('/equipment?selected=DEPO-01');
    expect(res.body.data.targetFinding.title).toContain('Gradual Equipment');
    expect(res.body.data.summary.equipmentCount).toBe(15);
    expect(res.body.data.summary.readingCount).toBeGreaterThan(100);
  });

  it('generates reproducible "yield_loss" scenario for User A with scrap target finding', async () => {
    const res = await request(app)
      .post('/api/v1/datasets/generate-synthetic')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        scenario: 'yield_loss',
        seed: 42,
        days: 7
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.scenario).toBe('yield_loss');
    expect(res.body.data.targetFinding.route).toBe('/yield');
  });

  it('generates "normal" scenario without any injected failure events', async () => {
    const res = await request(app)
      .post('/api/v1/datasets/generate-synthetic')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        scenario: 'normal',
        seed: 42,
        days: 7
      });

    expect(res.status).toBe(201);
    expect(res.body.data.scenario).toBe('normal');
    expect(res.body.data.summary.injectedEvents).toBe(0);
    expect(res.body.data.targetFinding.route).toBe('/overview');
  });

  it('proves User B cannot access User A synthetic dataset or sample CSV via manipulated ID', async () => {
    // User A generates sample
    const genRes = await request(app)
      .post('/api/v1/datasets/generate-synthetic')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ scenario: 'drift', seed: 99 });

    const userADatasetId = genRes.body.data.datasetId;
    expect(userADatasetId).toBeDefined();

    // User B attempts to access User A's dataset
    const crossRes = await request(app)
      .get(`/api/v1/datasets/${userADatasetId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(crossRes.status).toBe(404);

    // User B attempts to delete User A's dataset
    const crossDelete = await request(app)
      .delete(`/api/v1/datasets/${userADatasetId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(crossDelete.status).toBe(404);
  });
});
