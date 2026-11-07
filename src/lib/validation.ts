import { z } from 'zod';

/**
 * A web link (http or https only). `z.string().url()` alone accepts any scheme,
 * including `javascript:` and `data:` — links we render as clickable hrefs on
 * public pages must never be one of those.
 */
export const webUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((v) => /^https?:\/\//i.test(v), { message: 'Link must start with http:// or https://' });

/** An image URL rendered with next/image, which is configured for https hosts only. */
export const httpsImageUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((v) => /^https:\/\//i.test(v), { message: 'Image must be an https URL' });

/** Optional, clearable field: a valid value, '' or null. */
export const optionalOrEmpty = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal(''), z.null()]).optional();

/** A message the priest can act on for a rejected registry item create/update. */
export function registryItemInputError(issues: z.ZodIssue[]): string {
  const field = issues[0]?.path[0];
  if (field === 'externalUrl') return 'Please enter a valid product link starting with https://';
  if (field === 'imageUrl') return 'That photo link is not valid. Please upload the photo again.';
  return 'Invalid input';
}
