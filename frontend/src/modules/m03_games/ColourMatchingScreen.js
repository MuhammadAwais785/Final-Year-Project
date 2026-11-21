import React from 'react';
import SpeechGameScreen from './SpeechGameScreen';
import { colourItem, colourItemIds } from './colourContent';
import { COLOUR_TEXT } from './colourText';

const CONTENT = { itemById: colourItem, itemIds: colourItemIds, text: COLOUR_TEXT };

/** Colour matching game (UC-12): the shared speech game with colour content; the child names the swatch. */
export default function ColourMatchingScreen(props) {
  return <SpeechGameScreen content={CONTENT} {...props} />;
}
