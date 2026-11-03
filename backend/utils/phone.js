import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizePhone(value, defaultCountry = 'IN') {
  const phone = parsePhoneNumberFromString(String(value || '').trim(), defaultCountry);
  if (!phone || !phone.isValid()) return null;
  return phone.number;
}
