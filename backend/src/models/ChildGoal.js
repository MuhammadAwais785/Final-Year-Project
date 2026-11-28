const { getSupabase, throwIfSupabaseError } = require('../config/db');

const MAX_GOALS = 5; // BR-7
const WORDS_MIN = 1;
const WORDS_MAX = 50;
const MINUTES_MIN = 5;
const MINUTES_MAX = 30;
const GOAL_TYPES = new Set(['weekly_words', 'daily_minutes', 'skill']);
const SKILLS = new Set(['naming_objects', 'naming_animals', 'naming_food', 'colours']);
const ALLOWED_KEYS = new Set(['id', 'type', 'target', 'skill']);

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

/**
 * Validates a child's goal list against FR-3 and BR-7 rules.
 */
function validateGoals(goals) {
  if (!Array.isArray(goals)) {
    throw badRequest('goals must be an array');
  }
  if (goals.length > MAX_GOALS) {
    throw badRequest(`At most ${MAX_GOALS} goals are allowed per child (BR-7)`);
  }

  const seen = new Set();
  return goals.map((goal) => {
    if (!goal || typeof goal !== 'object' || Array.isArray(goal)) {
      throw badRequest('Each goal must be an object');
    }

    for (const key of Object.keys(goal)) {
      if (!ALLOWED_KEYS.has(key)) {
        throw badRequest(`Field '${key}' is not allowed in goal payload`);
      }
    }

    const clientGoalId = String(goal.id || '').trim();
    if (!clientGoalId) throw badRequest('Each goal requires an id');
    if (!GOAL_TYPES.has(goal.type)) throw badRequest('Invalid goal type');

    const uniqueKey = goal.type === 'skill' ? `skill:${goal.skill}` : goal.type;
    if (seen.has(uniqueKey)) {
      throw badRequest(`Duplicate goal '${uniqueKey}'`);
    }
    seen.add(uniqueKey);

    if (goal.type === 'weekly_words') {
      if (!Number.isInteger(goal.target) || goal.target < WORDS_MIN || goal.target > WORDS_MAX) {
        throw badRequest(`weekly_words target must be an integer between ${WORDS_MIN} and ${WORDS_MAX}`);
      }
      return { client_goal_id: clientGoalId, type: goal.type, target: goal.target, skill: null };
    }

    if (goal.type === 'daily_minutes') {
      if (!Number.isInteger(goal.target) || goal.target < MINUTES_MIN || goal.target > MINUTES_MAX) {
        throw badRequest(`daily_minutes target must be an integer between ${MINUTES_MIN} and ${MINUTES_MAX}`);
      }
      return { client_goal_id: clientGoalId, type: goal.type, target: goal.target, skill: null };
    }

    if (!SKILLS.has(goal.skill)) {
      throw badRequest('Invalid goal skill');
    }
    return { client_goal_id: clientGoalId, type: goal.type, target: null, skill: goal.skill };
  });
}

function toResponse(row) {
  const base = { id: row.client_goal_id, type: row.type };
  if (row.target !== null && row.target !== undefined) base.target = row.target;
  if (row.skill) base.skill = row.skill;
  return base;
}

async function findByChild(guardianId, childId) {
  const { data, error } = await getSupabase()
    .from('child_goals')
    .select('*')
    .eq('guardian_id', guardianId)
    .eq('child_id', childId)
    .order('created_at', { ascending: true });

  throwIfSupabaseError(error);
  return (data || []).map(toResponse);
}

/**
 * Validates and replaces all goals for a child (FR-3, BR-7).
 */
async function replaceForChild(guardianId, childId, goals) {
  const prepared = validateGoals(goals).map((g) => ({
    guardian_id: guardianId,
    child_id: childId,
    ...g
  }));

  const { error: deleteError } = await getSupabase()
    .from('child_goals')
    .delete()
    .eq('guardian_id', guardianId)
    .eq('child_id', childId);

  throwIfSupabaseError(deleteError);

  if (prepared.length === 0) return [];

  const { data, error: insertError } = await getSupabase()
    .from('child_goals')
    .insert(prepared)
    .select('*');

  throwIfSupabaseError(insertError);
  return (data || []).map(toResponse);
}

module.exports = {
  MAX_GOALS,
  validateGoals,
  findByChild,
  replaceForChild,
  toResponse
};
