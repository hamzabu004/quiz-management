import type { ExportMcq } from './types';

export function shuffleMcqs<T>(items: T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function parseAnswerPattern(input: string): string[] {
  const compactPattern = input.toUpperCase().replace(/[\s,;|\-]+/g, '');
  if (!compactPattern) throw new Error('Enter an answer pattern, such as ABCDAB.');
  if (/[^ABCD]/.test(compactPattern)) {
    throw new Error('The answer pattern can contain only A, B, C, and D.');
  }
  return compactPattern.split('');
}

const ANSWER_LABELS = ['A', 'B', 'C', 'D'] as const;

function repositionCorrectOption(
  mcq: ExportMcq,
  targetAnswer: string | null,
  random: () => number,
): ExportMcq {
  const currentAnswer = mcq.answer.toUpperCase();
  const options = [mcq.optionA, mcq.optionB, mcq.optionC, mcq.optionD].map((text, index) => ({
    text,
    isCorrect: ANSWER_LABELS[index] === currentAnswer,
  }));
  const correctOption = options.find((option) => option.isCorrect);
  if (!correctOption) throw new Error(`Question "${mcq.questionStem}" has an invalid correct answer.`);

  let reorderedOptions: typeof options;
  if (targetAnswer) {
    const targetIndex = ANSWER_LABELS.indexOf(targetAnswer as (typeof ANSWER_LABELS)[number]);
    const distractors = shuffleMcqs(options.filter((option) => !option.isCorrect), random);
    reorderedOptions = [...distractors];
    reorderedOptions.splice(targetIndex, 0, correctOption);
  } else {
    reorderedOptions = shuffleMcqs(options, random);
  }

  const correctIndex = reorderedOptions.findIndex((option) => option.isCorrect);
  return {
    ...mcq,
    optionA: reorderedOptions[0].text,
    optionB: reorderedOptions[1].text,
    optionC: reorderedOptions[2].text,
    optionD: reorderedOptions[3].text,
    answer: ANSWER_LABELS[correctIndex].toLowerCase(),
  };
}

export function applyAnswerPattern(
  mcqs: ExportMcq[],
  pattern: string[],
  random: () => number = Math.random,
): ExportMcq[] {
  if (pattern.length > mcqs.length) {
    throw new Error(`The pattern has ${pattern.length} positions, but only ${mcqs.length} questions are selected.`);
  }

  const patternedMcqs = mcqs
    .slice(0, pattern.length)
    .map((mcq, index) => repositionCorrectOption(mcq, pattern[index], random));
  const remainingMcqs = shuffleMcqs(mcqs.slice(pattern.length), random)
    .map((mcq) => repositionCorrectOption(mcq, null, random));

  return [...patternedMcqs, ...remainingMcqs];
}

export function moveMcq(mcqs: ExportMcq[], fromIndex: number, toIndex: number): ExportMcq[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return mcqs;
  const reordered = [...mcqs];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  return reordered;
}
