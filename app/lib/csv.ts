export type CsvRow = {
  values: string[];
  lineNumber: number;
};

export type CsvImportMcq = {
  questionStem: string;
  categoryName: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: string;
  explanation: string;
};

/**
 * Parse CSV records without losing commas or newlines inside quoted fields.
 * Double quotes inside quoted fields must be escaped as two double quotes.
 */
export function parseCsv(csvContent: string): CsvRow[] {
  const content = csvContent.replace(/^\uFEFF/, '');
  const rows: CsvRow[] = [];
  let values: string[] = [];
  let field = '';
  let inQuotes = false;
  let lineNumber = 1;
  let rowLineNumber = 1;

  const finishRow = () => {
    values.push(field);
    field = '';

    if (values.some((value) => value.trim() !== '')) {
      rows.push({ values, lineNumber: rowLineNumber });
    }

    values = [];
  };

  for (let index = 0; index < content.length; index++) {
    const character = content[index];

    if (inQuotes) {
      if (character === '"') {
        if (content[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
        if (character === '\n') lineNumber++;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      inQuotes = true;
    } else if (character === ',') {
      values.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      finishRow();
      if (character === '\r' && content[index + 1] === '\n') index++;
      lineNumber++;
      rowLineNumber = lineNumber;
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error(`CSV row starting on line ${rowLineNumber} has an unterminated quoted field.`);
  }

  if (field.length > 0 || values.length > 0) finishRow();

  return rows;
}
