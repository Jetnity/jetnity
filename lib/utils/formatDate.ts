// lib/utils/formatDate.ts

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '–';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '–';
  return date.toLocaleString();
}
