import { existsSync } from 'fs';
import { Low } from 'lowdb';
import { objectToCamel } from 'ts-case-convert';
import type { ObjectToCamel } from 'ts-case-convert/lib/caseConvert.js';
import YAML from 'yaml';

import { DataFile } from 'lowdb/node';

interface RawChallenge {
  correct_answer: string;
  incorrect_answers: string[];
  question: string;
  rows: number;
}

interface RawChallenges {
  challenges: RawChallenge[];
}

export type Challenge = ObjectToCamel<RawChallenge>;

const configDirUrl = new URL('../config/', import.meta.url);
const challengeYamlUrl = new URL('challenges.yaml', configDirUrl);
const challengeLocalYamlUrl = new URL('challenges.local.yaml', configDirUrl);

let challengesYamlUrl: URL;
if (process.env.NODE_ENV === 'development' && existsSync(challengeLocalYamlUrl)) {
  challengesYamlUrl = challengeLocalYamlUrl;
} else {
  challengesYamlUrl = challengeYamlUrl;
}

const dataFile = new DataFile(challengesYamlUrl, {
  parse: YAML.parse,
  stringify: YAML.stringify,
});

export const yamlChallengeDb = new Low<RawChallenges>(dataFile, { challenges: [] });
await yamlChallengeDb.read();

export const challenges = objectToCamel(yamlChallengeDb.data).challenges;
