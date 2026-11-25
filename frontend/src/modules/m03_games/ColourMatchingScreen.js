import React from 'react';
import SpeechGameScreen from './SpeechGameScreen';
import { colourItem, colourItemIds } from './colourContent';
import { ACTIVITIES } from '../../utils/constants';
import { COLOUR_TEXT } from './colourText';

const CONTENT = { itemById: colourItem, itemIds: colourItemIds, text: COLOUR_TEXT, activity: ACTIVITIES.COLOUR_MATCHING };

/** Colour matching game (UC-12): the shared speech game with colour content; the child names the swatch. */
export default function ColourMatchingScreen(props) {
  return <SpeechGameScreen content={CONTENT} {...props} />;
}
