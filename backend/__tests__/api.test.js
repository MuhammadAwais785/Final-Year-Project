process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db', () => {
  const state = {
    guardians: [],
    child_profiles: [],
    consent_records: [],
    child_goals: [],
    baselines: [],
    sessions: [],
    attempts: [],
    nextId: 1
  };

  function makeQuery(tableName) {
    const query = {
      _op: 'select',
      _filters: [],
      _inFilters: [],
      _payload: null,
      _upsertOpts: null,
      _order: null,
      _limit: null,
      _single: false,
      _maybeSingle: false,

      select() {
        return query;
      },
      insert(payload) {
        query._op = 'insert';
        query._payload = payload;
        return query;
      },
      update(payload) {
        query._op = 'update';
        query._payload = payload;
        return query;
      },
      delete() {
        query._op = 'delete';
        return query;
      },
      upsert(payload, opts) {
        query._op = 'upsert';
        query._payload = payload;
        query._upsertOpts = opts || {};
        return query;
      },
      eq(col, val) {
        query._filters.push([col, val]);
        return query;
      },
      in(col, vals) {
        query._inFilters.push([col, new Set(vals)]);
        return query;
      },
      order(col, opts = {}) {
        query._order = { col, ascending: opts.ascending !== false };
        return query;
      },
      limit(n) {
        query._limit = n;
        return query;
      },
      single() {
        query._single = true;
        return query.execute();
      },
      maybeSingle() {
        query._maybeSingle = true;
        return query.execute();
      },
      then(resolve, reject) {
        return query.execute().then(resolve, reject);
      },

      async execute() {
        const table = state[tableName];
        const matches = (row) =>
          query._filters.every(([c, v]) => row[c] === v) &&
          query._inFilters.every(([c, set]) => set.has(row[c]));

        if (query._op === 'insert') {
          const rows = Array.isArray(query._payload) ? query._payload : [query._payload];
          const inserted = rows.map((r) => {
            const now = new Date().toISOString();
            const row = { id: `uuid-${state.nextId++}`, created_at: now, updated_at: now, ...r };
            table.push(row);
            return row;
          });
          return { data: query._single || query._maybeSingle ? inserted[0] : inserted, error: null };
        }

        if (query._op === 'upsert') {
          const rows = Array.isArray(query._payload) ? query._payload : [query._payload];
          const conflictCols = (query._upsertOpts.onConflict || '').split(',').filter(Boolean);
          const inserted = [];
          for (const r of rows) {
            const exists = conflictCols.length > 0 && table.some((existing) =>
              conflictCols.every((c) => existing[c] === r[c])
            );
            if (exists && query._upsertOpts.ignoreDuplicates) continue;
            const now = new Date().toISOString();
            const row = { id: `uuid-${state.nextId++}`, created_at: now, updated_at: now, ...r };
            table.push(row);
            inserted.push(row);
          }
          return { data: inserted, error: null };
        }

        if (query._op === 'update') {
          let updatedRow = null;
          for (let i = 0; i < table.length; i++) {
            if (matches(table[i])) {
              table[i] = { ...table[i], ...query._payload };
              updatedRow = table[i];
              break;
            }
          }
          return { data: query._single || query._maybeSingle ? updatedRow : updatedRow ? [updatedRow] : [], error: null };
        }

        if (query._op === 'delete') {
          const deleted = [];
          for (let i = table.length - 1; i >= 0; i--) {
            if (matches(table[i])) {
              deleted.push(table[i]);
              table.splice(i, 1);
            }
          }
          return { data: query._maybeSingle ? (deleted[0] || null) : deleted, error: null };
        }

        let rows = table.filter(matches);
        if (query._order) {
          const { col, ascending } = query._order;
          rows = [...rows].sort((a, b) => {
            if (a[col] === b[col]) return 0;
            return (a[col] < b[col] ? -1 : 1) * (ascending ? 1 : -1);
          });
        }
        if (typeof query._limit === 'number') {
          rows = rows.slice(0, query._limit);
        }
        if (query._single || query._maybeSingle) {
          return { data: rows[0] || null, error: null };
        }
        return { data: rows, error: null };
      }
    };
    return query;
  }

  return {
    __state: state,
    __reset() {
      state.guardians = [];
      state.child_profiles = [];
      state.consent_records = [];
      state.child_goals = [];
      state.baselines = [];
      state.sessions = [];
      state.attempts = [];
      state.nextId = 1;
    },
    getSupabase: () => ({ from: (tableName) => makeQuery(tableName) }),
    throwIfSupabaseError: (error) => {
      if (error) throw new Error(error.message);
    },
    connectDatabase: async () => {}
  };
});

const app = require('../src/server');
const db = require('../src/config/db');
const { authLimiter } = require('../src/routes/authRoutes');

describe('Silent Screen Syndrome Backend API', () => {
  let token;
  let guardianId;
  let childId;

  beforeEach(async () => {
    db.__reset();
    authLimiter.reset();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Awais', email: 'awais@example.com', password: 'Password123!', language: 'en' });
    token = res.body.token;
    guardianId = res.body.guardian.id;

    const childRes = await request(app)
      .post('/api/profiles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ali', age: 5, language: 'en' });
    childId = childRes.body._id;
  });

  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  describe('Auth endpoints (/api/auth)', () => {
    test('rejects invalid email, short password, and invalid language on register', async () => {
      const badEmail = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Awais', email: 'not-an-email', password: 'Password123!' });
      expect(badEmail.status).toBe(400);

      const shortPass = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Awais', email: 'new@example.com', password: '123' });
      expect(shortPass.status).toBe(400);

      const badLang = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Awais', email: 'new@example.com', password: 'Password123!', language: 'fr' });
      expect(badLang.status).toBe(400);
    });

    test('returns 409 for duplicate email and 401 for wrong password', async () => {
      const dup = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Awais 2', email: 'AWAIS@example.com', password: 'Password123!' });
      expect(dup.status).toBe(409);

      const badLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'awais@example.com', password: 'WrongPassword!' });
      expect(badLogin.status).toBe(401);
    });

    test('GET /api/auth/me returns public guardian profile without password hash', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.guardian).toEqual({
        id: guardianId,
        name: 'Awais',
        email: 'awais@example.com',
        language: 'en',
        hasPin: false
      });
      expect(res.body.guardian).not.toHaveProperty('password_hash');
      expect(res.body.guardian).not.toHaveProperty('pin_hash');

      const unauth = await request(app).get('/api/auth/me');
      expect(unauth.status).toBe(401);
    });

    test('sets, verifies, and resets parent PIN requiring password/currentPin once set (BR-34)', async () => {
      const notSet = await request(app)
        .post('/api/auth/pin/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '1234' });
      expect(notSet.status).toBe(404);

      const badFormat = await request(app)
        .put('/api/auth/pin')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '12ab' });
      expect(badFormat.status).toBe(400);

      const initialSet = await request(app)
        .put('/api/auth/pin')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '2468' });
      expect(initialSet.status).toBe(200);
      expect(initialSet.body.guardian.hasPin).toBe(true);
      expect(db.__state.guardians[0].pin_hash).not.toBe('2468');

      const verifyWrong = await request(app)
        .post('/api/auth/pin/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '1111' });
      expect(verifyWrong.status).toBe(401);

      const verifyOk = await request(app)
        .post('/api/auth/pin/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '2468' });
      expect(verifyOk.status).toBe(200);
      expect(verifyOk.body.valid).toBe(true);

      // Overwriting an existing PIN without password or currentPin must fail
      const overwriteBlocked = await request(app)
        .put('/api/auth/pin')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '9999' });
      expect(overwriteBlocked.status).toBe(401);

      // Resetting with guardian password succeeds
      const resetOk = await request(app)
        .put('/api/auth/pin')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '9999', password: 'Password123!' });
      expect(resetOk.status).toBe(200);

      const verifyNew = await request(app)
        .post('/api/auth/pin/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '9999' });
      expect(verifyNew.status).toBe(200);
    });
  });

  describe('ChildProfile BR-1 age validation and CRUD', () => {
    test('rejects age below 3 or above 7', async () => {
      const tooYoung = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Baby', age: 2, language: 'en' });
      expect(tooYoung.status).toBe(400);

      const tooOld = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Teen', age: 8, language: 'en' });
      expect(tooOld.status).toBe(400);
    });

    test('accepts boundary ages 3 and 7 and supports update & delete', async () => {
      const created = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Sara', age: 3, language: 'ur' });
      expect(created.status).toBe(201);
      expect(created.body._id).toBeTruthy();

      const updated = await request(app)
        .patch(`/api/profiles/${created.body._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ age: 7 });
      expect(updated.status).toBe(200);
      expect(updated.body.age).toBe(7);

      const badUpdate = await request(app)
        .put(`/api/profiles/${created.body._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Sara', age: 12, language: 'ur' });
      expect(badUpdate.status).toBe(400);

      const deleted = await request(app)
        .delete(`/api/profiles/${created.body._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(deleted.status).toBe(200);
      expect(deleted.body.deleted).toBe(true);
    });

    test('prevents another guardian from modifying or deleting a child profile', async () => {
      const otherToken = jwt.sign({ id: 'other-guardian' }, process.env.JWT_SECRET);
      const res = await request(app)
        .delete(`/api/profiles/${childId}`)
        .set('Authorization', `Bearer ${otherToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/sync (phone record shape + BR-20 privacy)', () => {
    const validSession = (overrides = {}) => ({
      clientId: 'sess-1',
      childId,
      activity: 'object_naming',
      startedAt: 1700000000000,
      endedAt: 1700000120000,
      stars: 6,
      practiced: 3,
      correct: 3,
      partial: false,
      ...overrides
    });

    const validAttempt = (overrides = {}) => ({
      sessionClientId: 'sess-1',
      promptId: 'apple',
      status: 'recognized',
      score: 88,
      hintLevel: 0,
      at: 1700000030000,
      ...overrides
    });

    test('syncs sessions and attempts idempotently without duplicating same clientId', async () => {
      const payload = { sessions: [validSession()], attempts: [validAttempt()] };

      const first = await request(app)
        .post('/api/sync')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);
      expect(first.status).toBe(200);
      expect(first.body).toEqual({ synced: 1, syncedAttempts: 1 });

      const retry = await request(app)
        .post('/api/sync')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);
      expect(retry.status).toBe(200);
      expect(retry.body).toEqual({ synced: 0, syncedAttempts: 0 });

      const reports = await request(app)
        .get(`/api/reports?childId=${childId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(reports.status).toBe(200);
      expect(reports.body.sessions).toHaveLength(1);
      expect(reports.body.attempts).toHaveLength(1);
      expect(reports.body.sessions[0].activity).toBe('object_naming');
    });

    test('rejects audio, transcript, heard, or extra fields per BR-20 and saves nothing', async () => {
      const withAudio = await request(app)
        .post('/api/sync')
        .set('Authorization', `Bearer ${token}`)
        .send({ sessions: [validSession({ audio: 'base64...' })], attempts: [] });
      expect(withAudio.status).toBe(400);

      const withTranscript = await request(app)
        .post('/api/sync')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sessions: [validSession()],
          attempts: [validAttempt({ transcript: 'apple' })]
        });
      expect(withTranscript.status).toBe(400);

      const withHeard = await request(app)
        .post('/api/sync')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sessions: [validSession()],
          attempts: [validAttempt({ heard: 'apple' })]
        });
      expect(withHeard.status).toBe(400);

      expect(db.__state.sessions).toHaveLength(0);
      expect(db.__state.attempts).toHaveLength(0);
    });

    test('rejects sessions referencing a child that belongs to another guardian', async () => {
      const otherToken = jwt.sign({ id: `other-${guardianId}` }, process.env.JWT_SECRET);
      const res = await request(app)
        .post('/api/sync')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ sessions: [validSession()], attempts: [] });
      expect(res.status).toBe(400);
    });
  });

  describe('Priority 2: Consent, Goals, and Baselines (/api/profiles/:id/...)', () => {
    test('saves versioned consent records idempotently and enforces ownership', async () => {
      const v1 = await request(app)
        .post(`/api/profiles/${childId}/consent`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          childId,
          audioLocalAllowed: true,
          cameraAllowed: false,
          derivedSyncAllowed: true,
          version: 1,
          updatedAt: '2026-11-28T10:00:00.000Z'
        });
      expect(v1.status).toBe(201);
      expect(v1.body.consent.version).toBe(1);

      // Idempotent retry of version 1 does not create duplicate
      const retryV1 = await request(app)
        .post(`/api/profiles/${childId}/consent`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          childId,
          audioLocalAllowed: true,
          cameraAllowed: false,
          derivedSyncAllowed: true,
          version: 1,
          updatedAt: '2026-11-28T10:00:00.000Z'
        });
      expect(retryV1.status).toBe(201);

      const v2 = await request(app)
        .post(`/api/profiles/${childId}/consent`)
        .set('Authorization', `Bearer ${token}`)
        .send({ audioLocalAllowed: true, cameraAllowed: true, derivedSyncAllowed: true });
      expect(v2.status).toBe(201);
      expect(v2.body.consent.version).toBe(2);

      const getRes = await request(app)
        .get(`/api/profiles/${childId}/consent`)
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.consent.version).toBe(2);
      expect(getRes.body.history).toHaveLength(2);

      const otherToken = jwt.sign({ id: 'other-guardian' }, process.env.JWT_SECRET);
      const denied = await request(app)
        .get(`/api/profiles/${childId}/consent`)
        .set('Authorization', `Bearer ${otherToken}`);
      expect(denied.status).toBe(404);
    });

    test('replaces child goals and enforces BR-7 max 5 and range rules', async () => {
      const tooMany = [
        { id: '1', type: 'weekly_words', target: 10 },
        { id: '2', type: 'daily_minutes', target: 10 },
        { id: '3', type: 'skill', skill: 'naming_objects' },
        { id: '4', type: 'skill', skill: 'naming_animals' },
        { id: '5', type: 'skill', skill: 'naming_food' },
        { id: '6', type: 'skill', skill: 'colours' }
      ];
      const rejected = await request(app)
        .put(`/api/profiles/${childId}/goals`)
        .set('Authorization', `Bearer ${token}`)
        .send({ goals: tooMany });
      expect(rejected.status).toBe(400);

      const validGoals = [
        { id: 'g1', type: 'weekly_words', target: 15 },
        { id: 'g2', type: 'daily_minutes', target: 10 },
        { id: 'g3', type: 'skill', skill: 'naming_food' }
      ];
      const saved = await request(app)
        .put(`/api/profiles/${childId}/goals`)
        .set('Authorization', `Bearer ${token}`)
        .send({ goals: validGoals });
      expect(saved.status).toBe(200);
      expect(saved.body.goals).toEqual(validGoals);

      const fetched = await request(app)
        .get(`/api/profiles/${childId}/goals`)
        .set('Authorization', `Bearer ${token}`);
      expect(fetched.status).toBe(200);
      expect(fetched.body.goals).toEqual(validGoals);
    });

    test('saves baseline screening, enforces 30-day rule (BR-6), and blocks extra fields (BR-20)', async () => {
      const base = {
        baselineId: 'b-1',
        childId,
        checklistVersion: 'v1',
        taskIds: ['apple', 'ball'],
        responses: [{ taskId: 'apple', result: 'said', attempts: 1 }],
        attempts: 1,
        baselineScore: null,
        status: 'incomplete',
        startedAt: '2026-10-01T10:00:00.000Z',
        completedAt: null
      };

      const inProg = await request(app)
        .post(`/api/profiles/${childId}/baselines`)
        .set('Authorization', `Bearer ${token}`)
        .send(base);
      expect(inProg.status).toBe(201);

      const completed = {
        ...base,
        responses: [
          { taskId: 'apple', result: 'said', attempts: 1 },
          { taskId: 'ball', result: 'inconclusive', attempts: 3 }
        ],
        baselineScore: 50,
        status: 'complete',
        completedAt: '2026-10-01T10:15:00.000Z'
      };
      const doneRes = await request(app)
        .post(`/api/profiles/${childId}/baselines`)
        .set('Authorization', `Bearer ${token}`)
        .send(completed);
      expect(doneRes.status).toBe(201);
      expect(doneRes.body.baseline.baselineScore).toBe(50);

      // Re-syncing the same baselineId is idempotent
      const retryDone = await request(app)
        .post(`/api/profiles/${childId}/baselines`)
        .set('Authorization', `Bearer ${token}`)
        .send(completed);
      expect(retryDone.status).toBe(201);

      // A new baseline within 30 days is rejected (BR-6)
      const tooSoon = await request(app)
        .post(`/api/profiles/${childId}/baselines`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...completed,
          baselineId: 'b-2',
          startedAt: '2026-10-15T10:00:00.000Z',
          completedAt: '2026-10-15T10:15:00.000Z'
        });
      expect(tooSoon.status).toBe(409);

      // After 30 days it succeeds
      const after30Days = await request(app)
        .post(`/api/profiles/${childId}/baselines`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...completed,
          baselineId: 'b-3',
          startedAt: '2026-11-05T10:00:00.000Z',
          completedAt: '2026-11-05T10:15:00.000Z'
        });
      expect(after30Days.status).toBe(201);

      // Extra/privacy fields rejected (BR-20)
      const withAudio = await request(app)
        .post(`/api/profiles/${childId}/baselines`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...completed, baselineId: 'b-4', audio: 'raw' });
      expect(withAudio.status).toBe(400);
    });
  });

  describe('Priority 3: Account Management & Security Hardening', () => {
    test('sets defensive security headers, hides x-powered-by, and returns JSON 404/400', async () => {
      const health = await request(app).get('/api/health');
      expect(health.headers['x-powered-by']).toBeUndefined();
      expect(health.headers['x-content-type-options']).toBe('nosniff');
      expect(health.headers['x-frame-options']).toBe('DENY');

      const notFound = await request(app).get('/api/does-not-exist');
      expect(notFound.status).toBe(404);
      expect(notFound.body).toEqual({ message: 'Not found' });

      const badJson = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{bad-json');
      expect(badJson.status).toBe(400);
      expect(badJson.body.message).toBe('Invalid JSON request body');
    });

    test('PATCH /api/auth/me updates name/language and blocks email/hash tampering', async () => {
      const blocked = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'hacked@example.com' });
      expect(blocked.status).toBe(400);

      const updated = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Awais Khan', language: 'ur' });
      expect(updated.status).toBe(200);
      expect(updated.body.guardian.name).toBe('Awais Khan');
      expect(updated.body.guardian.language).toBe('ur');
    });

    test('POST /api/auth/change-password verifies current password and updates login credentials', async () => {
      const wrong = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'WrongPassword!', newPassword: 'NewPassword123!' });
      expect(wrong.status).toBe(401);

      const ok = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'Password123!', newPassword: 'NewPassword123!' });
      expect(ok.status).toBe(200);

      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'awais@example.com', password: 'Password123!' });
      expect(oldLogin.status).toBe(401);

      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'awais@example.com', password: 'NewPassword123!' });
      expect(newLogin.status).toBe(200);
    });

    test('DELETE /api/auth/me requires password confirmation and removes the account', async () => {
      const wrongPass = await request(app)
        .delete('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'WrongPassword!' });
      expect(wrongPass.status).toBe(401);

      const deleted = await request(app)
        .delete('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'Password123!' });
      expect(deleted.status).toBe(200);
      expect(deleted.body.deleted).toBe(true);

      const afterDelete = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(afterDelete.status).toBe(401);
    });
  });

  describe('Games Backend (/api/games)', () => {
    test('serves game activities and bilingual content filtered by activity and level', async () => {
      const acts = await request(app)
        .get('/api/games/activities')
        .set('Authorization', `Bearer ${token}`);
      expect(acts.status).toBe(200);
      expect(acts.body.activities).toHaveLength(3);
      expect(acts.body.activities.find((a) => a.id === 'object_naming').itemCount).toBe(16);

      const content = await request(app)
        .get('/api/games/content?activity=colour_matching&level=1')
        .set('Authorization', `Bearer ${token}`);
      expect(content.status).toBe(200);
      expect(content.body.activities.colour_matching.items).toHaveLength(10);
      expect(content.body.activities.colour_matching.items[0].ur.accepted.length).toBeGreaterThan(0);

      const badActivity = await request(app)
        .get('/api/games/content?activity=unknown')
        .set('Authorization', `Bearer ${token}`);
      expect(badActivity.status).toBe(400);
    });

    test('submits single game round, ignores partial round stars in totals, and computes child progress', async () => {
      const now = Date.now();
      const finishedRound = await request(app)
        .post('/api/games/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          session: {
            clientId: 'g-sess-1',
            childId,
            activity: 'object_naming',
            startedAt: now - 90000,
            endedAt: now,
            stars: 12,
            practiced: 6,
            correct: 6,
            partial: false
          },
          attempts: [
            { sessionClientId: 'g-sess-1', promptId: 'apple', status: 'recognized', score: 95, hintLevel: 0, at: now - 60000 }
          ]
        });
      expect(finishedRound.status).toBe(201);
      expect(finishedRound.body).toEqual({ synced: 1, syncedAttempts: 1 });

      // Partial rounds still record attempts/practiced, but never credit stars to totalStars
      const partialRound = await request(app)
        .post('/api/games/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          session: {
            clientId: 'g-sess-2',
            childId,
            activity: 'colour_matching',
            startedAt: now - 30000,
            endedAt: now,
            stars: 4,
            practiced: 2,
            correct: 2,
            partial: true
          },
          attempts: []
        });
      expect(partialRound.status).toBe(201);

      // BR-20 privacy check still enforced on /api/games/sessions
      const badAudio = await request(app)
        .post('/api/games/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          session: {
            clientId: 'g-sess-3',
            childId,
            activity: 'object_naming',
            startedAt: now - 30000,
            endedAt: now,
            stars: 2,
            practiced: 1,
            correct: 1,
            partial: false,
            audio: 'secret'
          }
        });
      expect(badAudio.status).toBe(400);

      const progress = await request(app)
        .get(`/api/games/progress/${childId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(progress.status).toBe(200);
      expect(progress.body.totalStars).toBe(12);
      expect(progress.body.todayStars).toBe(12);
      expect(progress.body.milestoneReachedToday).toBe(true);
      expect(progress.body.totalSessions).toBe(2);

      const history = await request(app)
        .get(`/api/games/sessions/${childId}?activity=object_naming`)
        .set('Authorization', `Bearer ${token}`);
      expect(history.status).toBe(200);
      expect(history.body.sessions).toHaveLength(1);
    });
  });
});
