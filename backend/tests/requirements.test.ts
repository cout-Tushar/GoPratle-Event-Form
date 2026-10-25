import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app';
import { Requirement } from '../src/models/Requirement';

let mongo: MongoMemoryServer;
const app = createApp();
const base = { eventName: 'Launch event', eventType: 'Corporate', startDate: '2027-05-01', endDate: '2027-05-01', location: 'Mumbai' };
const samples = [
  { ...base, category: 'planner', details: { services: ['catering'], guestCount: 80, planningScope: 'full-service' } },
  { ...base, category: 'performer', details: { performanceType: 'dj', durationMinutes: 90, performerCount: 1 } },
  { ...base, category: 'crew', details: { crewRoles: ['stagehand'], crewCount: 3, workingHours: 8 } }
];

beforeAll(async () => {
  process.env.MONGOMS_DOWNLOAD_DIR = path.join(os.tmpdir(), 'gopratle-mongodb-binaries');

  mongo = await MongoMemoryServer.create({ binary: { downloadDir: process.env.MONGOMS_DOWNLOAD_DIR } });
  await mongoose.connect(mongo.getUri());
  
});
beforeEach(async () => { await Requirement.deleteMany({}); });
afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });

describe('requirements API', () => {
  it.each(samples)('creates a valid $category requirement', async (sample) => {
    const response = await request(app).post('/api/requirements').send(sample).expect(201);
    expect(response.body.data.category).toBe(sample.category);
    expect(await Requirement.countDocuments()).toBe(1);
  });
  it('rejects missing required fields and invalid categories', async () => {
    await request(app).post('/api/requirements')
    .send({ ...samples[0], eventName: ' ' }).expect(400);

    await request(app).post('/api/requirements')
    .send({ ...samples[0], category: 'other' }).expect(400);
  });
  it('rejects category-specific errors, reversed dates, and negative numbers', async () => {

    await request(app).post('/api/requirements')
    .send({ ...samples[0], details: samples[1].details }).expect(400);

    await request(app).post('/api/requirements')
    .send({ ...samples[1], details: { ...samples[1].details, durationMinutes: -4 } }).expect(400);

    await request(app).post('/api/requirements')
    .send({ ...samples[0], endDate: '2027-04-30' }).expect(400);

    await request(app).post('/api/requirements')
    .send({ ...samples[0], details: { ...samples[0].details, budgetMin: 100, budgetMax: 10 } }).expect(400);
  });
  it('validates ids and reports missing requirements', async () => {
    await request(app).get('/api/requirements/nope').
    expect(400);
    await request(app).get(`/api/requirements/${new mongoose.Types.ObjectId()}`).
    expect(404);
  });
  it('lists newest records with pagination and category filtering', async () => 
    {
    for (const item of samples) await request(app).post('/api/requirements')
      .send(item).expect(201);
    const response = await request(app)
    .get('/api/requirements?category=crew&page=1&limit=5')
    .expect(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].category).toBe('crew');
  }
);
  it('reports health and rejects an invalid list filter', async () => {
    await request(app)
    .get('/api/health').expect(200);
    await request(app)
    .get('/api/requirements?category=bad').expect(400);
  });
});
