export function mediaUrl(path?: string | null) {
  if (!path) {
    return '';
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const api = import.meta.env.VITE_API_URL || '/api';
  if (api.startsWith('http')) {
    return new URL(path, new URL(api).origin).toString();
  }

  return path;
}
