import { GAME } from '../../utils/constants';
import { objectItemIds } from './objectNamingContent';

/** Props for a short, easy round of the activity (BR-28, after a calming break), or null if it is not built yet. */
export function easyRoundFor(activityId) {
  if (activityId === 'object_naming') {
    return { itemIds: objectItemIds(1), roundSize: GAME.EASY_ROUND_SIZE };
  }
  return null;
}
