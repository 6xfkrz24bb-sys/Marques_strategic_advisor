export function cleanString(value: unknown, maxLength = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function optionalString(value: unknown, maxLength = 500) {
  const cleaned = cleanString(value, maxLength);
  return cleaned || null;
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function safeArray(value: unknown, maxItems = 50) {
  return Array.isArray(value) ? value.slice(0, maxItems) : [];
}
