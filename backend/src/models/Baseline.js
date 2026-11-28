const { getSupabase, throwIfSupabaseError } = require('../config/db');

const MAX_ATTEMPTS = 3; // BR-5
const REASSESS_DAYS = 30; // BR-6
const DAY_MS = 24 * 60 * 60 * 1000;
const ALLOWED_RESULTS = new Set(['said', 'inconclusive', 'skipped']);
const ALLOWED_STATUSES = new Set(['incomplete', 'complete']);
const ALLOWED_KEYS = new Set([
  'baselineId',
  'childId',
  'checklistVersion',
  'taskIds',
  'responses',
  'attempts',
  'baselineScore',
  'status',
  'startedAt',
  'completedAt'
]);

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function toIsoTimestamp(value, fieldName) {
  const date = new Date(value);
  if (value === undefined || value === null || Number.isNaN(date.getTime())) {
    throw httpError(400, `${fieldName} must be a valid timestamp`);
  }
  return date.toISOString();
}

/**
 * Validates a BaselineAssessment record against FR-2, BR-5, and BR-20 rules.
 */
function validateBaselineInput(input, expectedChildId) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw httpError(400, 'Baseline payload must be an object');
  }

  for (const key of Object.keys(input)) {
    if (!ALLOWED_KEYS.has(key)) {
      throw httpError(400, `Field '${key}' is not allowed in baseline payload (BR-20)`);
    }
  }

  const baselineId = String(input.baselineId || '').trim();
  const checklistVersion = String(input.checklistVersion || '').trim();
  if (!baselineId) throw httpError(400, 'baselineId is required');
  if (!checklistVersion) throw httpError(400, 'checklistVersion is required');

  if (input.childId !== undefined && String(input.childId) !== String(expectedChildId)) {
    throw httpError(400, 'Baseline childId does not match route child');
  }

  if (!Array.isArray(input.taskIds) || input.taskIds.length === 0) {
    throw httpError(400, 'taskIds must be a non-empty array');
  }
  const taskIds = input.taskIds.map((id) => {
    const clean = String(id || '').trim();
    if (!clean) throw httpError(400, 'Each taskId must be a non-empty string');
    return clean;
  });

  if (!Array.isArray(input.responses)) {
    throw httpError(400, 'responses must be an array');
  }
  const responses = input.responses.map((r) => {
    if (!r || typeof r !== 'object' || Array.isArray(r)) {
      throw httpError(400, 'Each baseline response must be an object');
    }
    const taskId = String(r.taskId || '').trim();
    if (!taskId) throw httpError(400, 'Response taskId is required');
    if (!ALLOWED_RESULTS.has(r.result)) throw httpError(400, 'Invalid baseline response result');
    if (!Number.isInteger(r.attempts) || r.attempts < 1 || r.attempts > MAX_ATTEMPTS) {
      throw httpError(400, `Response attempts must be between 1 and ${MAX_ATTEMPTS} (BR-5)`);
    }
    return { taskId, result: r.result, attempts: r.attempts };
  });

  if (!ALLOWED_STATUSES.has(input.status)) {
    throw httpError(400, "Baseline status must be 'incomplete' or 'complete'");
  }
  if (!Number.isInteger(input.attempts) || input.attempts < 1 || input.attempts > MAX_ATTEMPTS) {
    throw httpError(400, `attempts must be between 1 and ${MAX_ATTEMPTS}`);
  }

  let baselineScore = null;
  if (input.baselineScore !== null && input.baselineScore !== undefined) {
    if (!Number.isInteger(input.baselineScore) || input.baselineScore < 0 || input.baselineScore > 100) {
      throw httpError(400, 'baselineScore must be an integer between 0 and 100');
    }
    baselineScore = input.baselineScore;
  }

  const startedAt = toIsoTimestamp(input.startedAt, 'startedAt');
  let completedAt = null;
  if (input.status === 'complete') {
    completedAt = toIsoTimestamp(input.completedAt, 'completedAt');
  } else if (input.completedAt !== null && input.completedAt !== undefined) {
    completedAt = toIsoTimestamp(input.completedAt, 'completedAt');
  }

  return {
    baseline_id: baselineId,
    checklist_version: checklistVersion,
    task_ids: taskIds,
    responses,
    attempts: input.attempts,
    baseline_score: baselineScore,
    status: input.status,
    started_at: startedAt,
    completed_at: completedAt
  };
}

function toResponse(row) {
  return {
    baselineId: row.baseline_id,
    childId: row.child_id,
    checklistVersion: row.checklist_version,
    taskIds: row.task_ids,
    responses: row.responses,
    attempts: row.attempts,
    baselineScore: row.baseline_score,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at
  };
}

async function findByChild(guardianId, childId) {
  const { data, error } = await getSupabase()
    .from('baselines')
    .select('*')
    .eq('guardian_id', guardianId)
    .eq('child_id', childId)
    .order('started_at', { ascending: false });

  throwIfSupabaseError(error);
  const baselines = (data || []).map(toResponse);
  const latestCompleted = baselines
    .filter((b) => b.status === 'complete' && b.completedAt)
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))[0] || null;
  const inProgress = baselines.find((b) => b.status === 'incomplete') || null;

  return { latestCompleted, inProgress, baselines };
}

/**
 * Saves or updates a baseline assessment, enforcing the 30-day re-assessment rule (BR-6).
 * Syncing the same baselineId again is idempotent.
 */
async function saveForChild(guardianId, childId, input) {
  const fields = validateBaselineInput(input, childId);

  const { data: existing, error: existingError } = await getSupabase()
    .from('baselines')
    .select('*')
    .eq('guardian_id', guardianId)
    .eq('baseline_id', fields.baseline_id)
    .maybeSingle();

  throwIfSupabaseError(existingError);

  if (existing && existing.status === 'complete') {
    return toResponse(existing);
  }

  if (fields.status === 'complete') {
    const { latestCompleted } = await findByChild(guardianId, childId);
    if (latestCompleted && latestCompleted.baselineId !== fields.baseline_id) {
      const elapsed = Date.parse(fields.completed_at) - Date.parse(latestCompleted.completedAt);
      if (elapsed < REASSESS_DAYS * DAY_MS) {
        throw httpError(409, `A new baseline assessment is allowed once every ${REASSESS_DAYS} days (BR-6)`);
      }
    }
  }

  if (existing) {
    const { data, error } = await getSupabase()
      .from('baselines')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('*')
      .single();

    throwIfSupabaseError(error);
    return toResponse(data);
  }

  const { data, error } = await getSupabase()
    .from('baselines')
    .insert({ guardian_id: guardianId, child_id: childId, ...fields })
    .select('*')
    .single();

  throwIfSupabaseError(error);
  return toResponse(data);
}

module.exports = {
  REASSESS_DAYS,
  findByChild,
  saveForChild,
  toResponse
};
