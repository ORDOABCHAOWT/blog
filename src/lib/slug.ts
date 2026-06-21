export function toSafePostSlug(value: string, fallbackDate?: string) {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_\s-]+/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug || !value.trim()) {
    return slug;
  }

  const safeDate = fallbackDate || new Date().toISOString().split('T')[0];
  return `post-${safeDate}`;
}
