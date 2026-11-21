import { GOALS } from '../../utils/constants';
import { createClientId } from '../../utils/helpers';

/**
 * Goals rules (FR-3, BR-7) as pure functions. A goal is { id, type, target?, skill? }:
 *   weekly_words  -> target = words per week
 *   daily_minutes -> target = minutes per day
 *   skill         -> skill = one id from SKILLS
 */
export const GOAL_TYPES = { WEEKLY_WORDS: 'weekly_words', DAILY_MINUTES: 'daily_minutes', SKILL: 'skill' };

// Skills the games can practise. The baseline only tests naming, so each baseline picture
// belongs to a naming area; "colours" is never a weakest area, but a parent can choose it.
export const SKILLS = ['naming_objects', 'naming_animals', 'naming_food', 'colours'];
const AREA_OF_TASK = {
  cat: 'naming_animals', dog: 'naming_animals', fish: 'naming_animals',
  apple: 'naming_food', milk: 'naming_food',
  ball: 'naming_objects', car: 'naming_objects', book: 'naming_objects', sun: 'naming_objects', house: 'naming_objects',
};
const NAMING_AREAS = ['naming_objects', 'naming_animals', 'naming_food'];

const newGoal = (fields) => ({ id: createClientId(), ...fields });

/** Words the child said in the baseline. No baseline counts as a middle value (5 of 10). */
const wordsSaid = (baseline) => (baseline?.responses ? baseline.responses.filter((r) => r.result === 'said').length : 5);

/** Weekly target by words said: 0-2 -> 5, 3-5 -> 10, 6-8 -> 15, 9+ -> 20 (steps: to confirm with supervisor). */
function weeklyWordsFor(said) {
  const target = said <= 2 ? 5 : said <= 5 ? 10 : said <= 8 ? 15 : 20;
  return Math.min(GOALS.WORDS_MAX, target);
}

/** Daily minutes by age: 3-4 -> 5, 5-6 -> 10, 7 -> 15 (to confirm with supervisor). Unknown age -> 10. */
function dailyMinutesFor(age) {
  const minutes = !Number.isInteger(age) ? 10 : age <= 4 ? 5 : age <= 6 ? 10 : 15;
  return Math.min(GOALS.MINUTES_MAX, Math.max(GOALS.MINUTES_MIN, minutes));
}

/** Weakest area = lowest share of words said; skipped pictures are left out, ties go to the first area. */
export function weakestSkill(baseline) {
  let weakest = NAMING_AREAS[0];
  let lowest = Infinity;
  NAMING_AREAS.forEach((area) => {
    const asked = (baseline?.responses || []).filter((r) => AREA_OF_TASK[r.taskId] === area && r.result !== 'skipped');
    if (asked.length === 0) return;
    const share = asked.filter((r) => r.result === 'said').length / asked.length;
    if (share < lowest) { lowest = share; weakest = area; }
  });
  return weakest;
}

/** Starting goals for a child (FR-3): weekly words, daily minutes and the weakest skill. Always 3 goals, so within BR-7. */
export function suggestGoals(baselineResult, childAge) {
  return [
    newGoal({ type: GOAL_TYPES.WEEKLY_WORDS, target: weeklyWordsFor(wordsSaid(baselineResult)) }),
    newGoal({ type: GOAL_TYPES.DAILY_MINUTES, target: dailyMinutesFor(childAge) }),
    newGoal({ type: GOAL_TYPES.SKILL, skill: weakestSkill(baselineResult) }),
  ];
}

const inRange = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;

/**
 * Checks a goal list. Errors are { index, code } (index null = the whole list); the screen turns codes into text.
 * Codes: too_many (BR-7), bad_type, words_range, minutes_range, bad_skill, duplicate.
 * Weekly words and daily minutes may appear once; a skill may appear once per skill.
 * @returns {{ valid: boolean, errors: Array<{ index: number|null, code: string }> }}
 */
export function validateGoals(goals) {
  const errors = [];
  if (!Array.isArray(goals)) return { valid: false, errors: [{ index: null, code: 'bad_type' }] };
  if (goals.length > GOALS.MAX) errors.push({ index: null, code: 'too_many' });
  const seen = new Set();
  goals.forEach((goal, index) => {
    const { type } = goal || {};
    if (type === GOAL_TYPES.WEEKLY_WORDS && !inRange(goal.target, GOALS.WORDS_MIN, GOALS.WORDS_MAX)) errors.push({ index, code: 'words_range' });
    else if (type === GOAL_TYPES.DAILY_MINUTES && !inRange(goal.target, GOALS.MINUTES_MIN, GOALS.MINUTES_MAX)) errors.push({ index, code: 'minutes_range' });
    else if (type === GOAL_TYPES.SKILL && !SKILLS.includes(goal.skill)) errors.push({ index, code: 'bad_skill' });
    else if (!Object.values(GOAL_TYPES).includes(type)) { errors.push({ index, code: 'bad_type' }); return; }
    const key = type === GOAL_TYPES.SKILL ? `skill:${goal.skill}` : type;
    if (seen.has(key)) errors.push({ index, code: 'duplicate' });
    seen.add(key);
  });
  return { valid: errors.length === 0, errors };
}

/** Goal types a parent can still add (respecting BR-7 and the one-per-type rules). */
export function addableGoals(goals) {
  if (goals.length >= GOALS.MAX) return [];
  const has = (type) => goals.some((g) => g.type === type);
  const usedSkills = goals.filter((g) => g.type === GOAL_TYPES.SKILL).map((g) => g.skill);
  const options = [];
  if (!has(GOAL_TYPES.WEEKLY_WORDS)) options.push(newGoal({ type: GOAL_TYPES.WEEKLY_WORDS, target: weeklyWordsFor(5) }));
  if (!has(GOAL_TYPES.DAILY_MINUTES)) options.push(newGoal({ type: GOAL_TYPES.DAILY_MINUTES, target: dailyMinutesFor() }));
  const freeSkill = SKILLS.find((s) => !usedSkills.includes(s));
  if (freeSkill) options.push(newGoal({ type: GOAL_TYPES.SKILL, skill: freeSkill }));
  return options;
}
