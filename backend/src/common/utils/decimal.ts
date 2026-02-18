import { Decimal } from '@prisma/client/runtime/library';

/**
 * Converts a Prisma Decimal value to a JavaScript number.
 * Use this when performing arithmetic operations on Decimal fields.
 */
export function toNumber(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}
