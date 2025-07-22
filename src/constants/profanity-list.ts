/**
 * Profanity List Constants
 *
 * Loads the list of profane words from config/profanity-list.json.
 * This allows updates to the list without code changes or redeploys.
 *
 * @module src/constants/profanity-list
 */

import * as fs from 'fs';
import * as path from 'path';

const PROFANITY_PATH = path.resolve(__dirname, '../../config/profanity-list.json');

let profanityList: string[] = [];
try {
  const data = fs.readFileSync(PROFANITY_PATH, 'utf-8');
  profanityList = JSON.parse(data);
} catch (err) {
  // Log the error for visibility
  console.error('Failed to load profanity list:', err);
  profanityList = [];
}

export const PROFANITY_LIST = profanityList;
