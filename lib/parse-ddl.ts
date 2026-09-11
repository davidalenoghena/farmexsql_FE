export interface TableColumn {
  name: string;
  type: string;
}

export interface Table {
  name: string;
  columns: TableColumn[];
}

export function parseDDL(ddl: string): Table[] {
  const tables: Table[] = [];
  const tableRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\)\s*(?:ENGINE|;)/gi;

  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(ddl)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const columns: TableColumn[] = [];

    for (const line of body.split('\n')) {
      const trimmed = line.trim().replace(/,$/, '');
      if (!trimmed || /^(PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|FOREIGN)\b/i.test(trimmed)) {
        continue;
      }

      const columnMatch = trimmed.match(/^[`"']?(\w+)[`"']?\s+([A-Za-z]+(?:\([^)]*\))?)/);
      if (columnMatch) {
        columns.push({ name: columnMatch[1], type: columnMatch[2].toUpperCase() });
      }
    }

    if (columns.length > 0) {
      tables.push({ name: tableName, columns });
    }
  }

  return tables;
}
