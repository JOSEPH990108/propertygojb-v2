export function normalizeSlug(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return normalized
}

export function createProjectSlug(value: string): string {
  const slug = normalizeSlug(value)
  return slug || "project"
}
