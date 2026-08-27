// Identisches SQL-Literal für schema_migrations-History.
// Muss mit scripts/db/anwenden.ts übereinstimmen: eine Datei = ein Statement.

export function sqlLiteral(text: string): string {
  return `'${String(text).split("'").join("''")}'`
}
