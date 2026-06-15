// Shared date formatting — en-GB (day/month/year, 24-hour), local timezone.

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB')
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB')
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB')
}
