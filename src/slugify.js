/**
 * Turns a string into a URL-safe slug.
 *
 * Accented characters are folded to their ASCII base rather than dropped, so
 * "Café" becomes "cafe" instead of "caf".
 *
 * @param {string} input
 * @returns {string} lowercase, hyphen-separated, no leading or trailing hyphen
 */
export function slugify(input) {
  if (typeof input !== "string") {
    throw new TypeError("slugify expects a string")
  }

  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"]

/**
 * Formats a byte count as a short human-readable string, e.g. "1.5 KB".
 *
 * Two formatting decisions worth knowing about:
 *
 * - The base is 1024, not 1000, while the labels stay as "KB"/"MB"/"GB"/"TB".
 *   This is the common-but-technically-loose convention; strict SI would call
 *   these "KiB"/"MiB"/"GiB"/"TiB".
 * - Trailing zeros are trimmed, so 1024 formats as "1 KB" rather than "1.0 KB".
 *   Values are rounded arithmetically to at most one decimal place.
 *
 * Anything above the largest unit keeps using "TB" instead of running out of
 * units, so 1024 TB formats as "1024 TB".
 *
 * @param {number} n a non-negative, finite number of bytes
 * @returns {string} the number and its unit, separated by a single space
 */
export function formatBytes(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) {
    throw new TypeError("formatBytes expects a finite number")
  }

  if (n < 0) {
    throw new TypeError("formatBytes expects a non-negative number")
  }

  if (n === 0) {
    return "0 B"
  }

  let value = n
  let unit = 0

  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024
    unit += 1
  }

  return `${Math.round(value * 10) / 10} ${BYTE_UNITS[unit]}`
}
