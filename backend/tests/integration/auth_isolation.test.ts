import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { InMemoryStore } from '../../src/repositories/base.repository.js';
import { equipmentRepository } from '../../src/repositories/equipment.repository.js';
import { alertRepository } from '../../src/repositories/alert.repository.js';
import { datasetRepository } from '../../src/repositories/dataset.repository.js';
import { reportRepository } from '../../src/repositories/report.repository.js';

describe('Stage 1: Multi-Tenant Data Isolation and Authorization Security', () => {
  const app = createApp();

  beforeEach(() => {
    InMemoryStore.getInstance().clearAll();
  });

  it('proves User A cannot read, modify, or delete User B resources by manipulated IDs', async () => {
    // 1. Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'alice@semimatrix.com',
        password: 'Password123!',
        fullName: 'Alice Engineer',
        workspaceName: 'Alice CVD Bay'
      });
    expect(resA.status).toBe(201);
    const tokenA = resA.body.data.tokens.accessToken;
    const workspaceIdA = resA.body.data.user.workspaceId;

    // 2. Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'bob@semimatrix.com',
        password: 'Password123!',
        fullName: 'Bob Technician',
        workspaceName: 'Bob Etch Bay'
      });
    expect(resB.status).toBe(201);
    const tokenB = resB.body.data.tokens.accessToken;
    const workspaceIdB = resB.body.data.user.workspaceId;

    // Workspaces must be strictly distinct
    expect(workspaceIdA).not.toBe(workspaceIdB);

    // 3. Populate domain entities in User A's workspace
    const eqA = await equipmentRepository.create(workspaceIdA, {
      workspaceId: workspaceIdA,
      equipmentId: 'CVD-01',
      name: 'Applied Materials Centura CVD',
      type: 'deposition_cvd',
      locationBay: 'Bay-03',
      status: 'processing',
      parameters: [
        {
          name: 'chamber_temp',
          unit: 'degC',
          nominal: 400,
          usl: 415,
          lsl: 385,
          rangeMin: 300,
          rangeMax: 500
        }
      ],
      sourceType: 'synthetic'
    });

    const alertA = await alertRepository.create(workspaceIdA, {
      workspaceId: workspaceIdA,
      equipmentId: 'CVD-01',
      severity: 'critical',
      state: 'open',
      title: 'Chamber Over-Temperature Tripwire',
      description: 'Chamber temperature reached 416.5 degC (> USL)',
      sourceType: 'synthetic'
    });

    const datasetA = await datasetRepository.create(workspaceIdA, {
      workspaceId: workspaceIdA,
      name: 'Alice March Production Run.csv',
      sourceType: 'synthetic',
      fileSizeBytes: 1048576,
      rowCount: 5000,
      columnCount: 12
    });

    const reportA = await reportRepository.create(workspaceIdA, {
      workspaceId: workspaceIdA,
      title: 'Q1 Yield Excursion Summary',
      analysisType: 'yield_loss',
      dataBasis: 'synthetic',
      dateRange: { start: new Date('2026-01-01'), end: new Date('2026-03-31') },
      kpis: { meanYield: 94.2 },
      findings: ['Chamber pressure drift on CVD-01'],
      recommendedActions: ['Perform preventative clean'],
      limitationsAndAssumptions: ['Simulated baseline data'],
      fileFormat: 'pdf'
    });

    // 4. Assert User B directly querying User A's entities by ID via repository returns null
    const crossEq = await equipmentRepository.findById(workspaceIdB, eqA._id);
    expect(crossEq).toBeNull();

    const crossAlert = await alertRepository.findById(workspaceIdB, alertA._id);
    expect(crossAlert).toBeNull();

    const crossDataset = await datasetRepository.findById(workspaceIdB, datasetA._id);
    expect(crossDataset).toBeNull();

    const crossReport = await reportRepository.findById(workspaceIdB, reportA._id);
    expect(crossReport).toBeNull();

    // 5. Assert User B attempting to update or delete User A's equipment fails
    const updateResult = await equipmentRepository.update(workspaceIdB, eqA._id, {
      name: 'Malicious Hijack'
    });
    expect(updateResult).toBeNull();

    const deleteResult = await equipmentRepository.delete(workspaceIdB, eqA._id);
    expect(deleteResult).toBe(false);

    // 6. Verify User A's equipment is untouched
    const verifiedEqA = await equipmentRepository.findById(workspaceIdA, eqA._id);
    expect(verifiedEqA).not.toBeNull();
    expect(verifiedEqA?.name).toBe('Applied Materials Centura CVD');

    // 7. Verify session verification: req.workspaceId is locked to token, ignoring injected query/body parameters
    const meRes = await request(app)
      .get('/api/v1/auth/me?workspaceId=' + workspaceIdA)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.workspaceId).toBe(workspaceIdB);
    expect(meRes.body.data.user.workspaceId).not.toBe(workspaceIdA);
  });

  it('enforces delete-my-data: cleans up user A data while leaving user B intact', async () => {
    // Register A and B
    const resA = await request(app).post('/api/v1/auth/register').send({
      email: 'carol@semimatrix.com',
      password: 'Password123!',
      fullName: 'Carol Clean'
    });
    const tokenA = resA.body.data.tokens.accessToken;
    const wsA = resA.body.data.user.workspaceId;

    const resB = await request(app).post('/api/v1/auth/register').send({
      email: 'dave@semimatrix.com',
      password: 'Password123!',
      fullName: 'Dave Defense'
    });
    const wsB = resB.body.data.user.workspaceId;

    // Create equipment for both
    await equipmentRepository.create(wsA, {
      workspaceId: wsA,
      equipmentId: 'ETCH-01',
      name: 'Lam Research TCP Etcher',
      type: 'etch',
      locationBay: 'Bay-01',
      status: 'idle',
      parameters: [],
      sourceType: 'synthetic'
    });

    const eqB = await equipmentRepository.create(wsB, {
      workspaceId: wsB,
      equipmentId: 'CMP-01',
      name: 'Ebara CMP Polisher',
      type: 'cmp',
      locationBay: 'Bay-02',
      status: 'idle',
      parameters: [],
      sourceType: 'synthetic'
    });

    // Carol deletes her workspace and data
    const deleteRes = await request(app)
      .delete('/api/v1/auth/workspace/data')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Carol's equipment is gone
    const carolTools = await equipmentRepository.find(wsA);
    expect(carolTools.length).toBe(0);

    // Dave's equipment is still safely intact
    const daveTools = await equipmentRepository.find(wsB);
    expect(daveTools.length).toBe(1);
    expect(daveTools[0]._id).toBe(eqB._id);
  });
});
