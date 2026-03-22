export function formatDisplayDate(date: string) {
  if (!date) return 'Undated';

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date.replace(/-/g, '.');
  }

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(parsed)
    .replace(/-/g, '.');
}

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[`~!@#$%^&*()+=,[\]{}\\|;:'",.<>/?]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
