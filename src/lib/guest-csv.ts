export interface ParsedGuest {
  firstName: string;
  lastName: string;
  inviteCount: number;
  address: string | null;
  phone: string | null;
}

/** Split CSV text into rows of fields, honouring quotes ("123 Main St, Boston"). */
export function splitCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

export const MAX_GUESTS_PER_IMPORT = 500;

/** Parse a guest-list CSV (first_name,last_name,invite_count,address,phone; header row skipped). */
export function parseGuestCSV(text: string): { rows: ParsedGuest[]; errors: string[] } {
  const lines = splitCSV(text.replace(/^﻿/, '')); // strip Excel BOM
  if (lines.length < 2) return { rows: [], errors: ['File is empty or has no data rows.'] };
  const rows: ParsedGuest[] = [];
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const [firstName, lastName, inviteCountRaw, address, phone] = lines[i].map((p) => p.trim());
    if (!firstName || !lastName) {
      errors.push(`Row ${i + 1}: missing first_name or last_name`);
      continue;
    }
    if (firstName.length > 100 || lastName.length > 100 || (address?.length ?? 0) > 500 || (phone?.length ?? 0) > 30) {
      errors.push(`Row ${i + 1}: a field is too long (names ≤ 100, address ≤ 500, phone ≤ 30 characters)`);
      continue;
    }
    const inviteCount = parseInt(inviteCountRaw || '1', 10);
    rows.push({
      firstName,
      lastName,
      inviteCount: isNaN(inviteCount) || inviteCount < 1 ? 1 : Math.min(inviteCount, 50),
      address: address || null,
      phone: phone || null,
    });
  }
  if (rows.length > MAX_GUESTS_PER_IMPORT) {
    errors.push(`Only ${MAX_GUESTS_PER_IMPORT} guests can be imported at once — split the file and upload the rest separately.`);
    rows.length = MAX_GUESTS_PER_IMPORT;
  }
  return { rows, errors };
}
