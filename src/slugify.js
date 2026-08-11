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
