import React from 'react';
import SpeechGameScreen from './SpeechGameScreen';
import { objectItem, objectItemIds } from './objectNamingContent';
import { NAMING_TEXT } from './objectNamingText';

const CONTENT = { itemById: objectItem, itemIds: objectItemIds, text: NAMING_TEXT };

/** Object naming game (UC-11): the shared speech game with object content. */
export default function ObjectNamingScreen(props) {
  return <SpeechGameScreen content={CONTENT} {...props} />;
}
