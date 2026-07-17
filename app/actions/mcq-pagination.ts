"use server";

import { getMcqsPage } from '../lib/mcq-pagination';

export async function loadMcqsPage(
  subjectId: string,
  categoryNames: string[],
  searchQuery: string,
  cursor: string | null,
) {
  return getMcqsPage({ subjectId, categoryNames, searchQuery, cursor });
}
