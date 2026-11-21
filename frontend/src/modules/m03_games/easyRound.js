import { ACTIVITIES, GAME } from '../../utils/constants';
import { colourItemIds } from './colourContent';
import { objectItemIds } from './objectNamingContent';

/** Props for a short, easy round of the activity (BR-28, after a calming break), or null if it is not built yet. */
export function easyRoundFor(activityId) {
  if (activityId === ACTIVITIES.OBJECT_NAMING) {
    return { itemIds: objectItemIds(1), roundSize: GAME.EASY_ROUND_SIZE };
  }
  if (activityId === ACTIVITIES.COLOUR_MATCHING) {
    return { itemIds: colourItemIds(1), roundSize: GAME.EASY_ROUND_SIZE };
  }
  return null;
}
