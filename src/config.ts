import { readFile } from 'fs/promises';
import { objectToCamel } from 'ts-case-convert';
import YAML from 'yaml';

interface RawChallenge {
  correct_answer: string;
  incorrect_answers: boolean;
  question: boolean;
}

interface RawChallenges {
  challenges: RawChallenge[];
}

const configDir = new URL('../config/', import.meta.url);
const challengesYaml = await readFile(new URL('challenges.yaml', configDir), 'utf-8');
const rawChallenges = (YAML.parse(challengesYaml) as RawChallenges).challenges;

export const challenges = objectToCamel(rawChallenges);
export type Challenge = (typeof challenges)[number];
