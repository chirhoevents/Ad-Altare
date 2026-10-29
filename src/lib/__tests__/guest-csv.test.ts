import { describe, expect, it } from 'vitest';
import { parseGuestCSV } from '@/lib/guest-csv';

describe('parseGuestCSV', () => {
  it('handles quoted commas, escaped quotes, CRLF, BOM and blank lines', () => {
    const csv =
      '﻿first_name,last_name,invite_count,address,phone\r\n' +
      'John,Doe,2,"123 Main St, Boston, MA",555-1234\r\n' +
      'Mary,"O""Brien",99,,\r\n' +
      ',NoFirst,1,,\r\n\r\n';
    const { rows, errors } = parseGuestCSV(csv);
    expect(rows).toEqual([
      { firstName: 'John', lastName: 'Doe', inviteCount: 2, address: '123 Main St, Boston, MA', phone: '555-1234' },
      { firstName: 'Mary', lastName: 'O"Brien', inviteCount: 50, address: null, phone: null },
    ]);
    expect(errors).toEqual(['Row 4: missing first_name or last_name']);
  });

  it('rejects an empty file', () => {
    expect(parseGuestCSV('first_name,last_name\n').errors[0]).toMatch(/empty/);
  });
});
