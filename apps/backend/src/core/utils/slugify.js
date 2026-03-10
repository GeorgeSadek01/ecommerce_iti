/**
 * Generate a URL-safe slug from any string.
 *
 * Converts to lowercase, strips accents/diacritics, replaces
 * non-alphanumeric characters with hyphens, and collapses/trims hyphens.
 *
 * @param {string} str - Source string (e.g. product name, category name)
 * @returns {string} URL-safe slug
 *
 * @example
 *   slugify('Hello World!')       // → 'hello-world'
 *   slugify('  Café & Résumé ')   // → 'cafe-resume'
 *   slugify('iPhone 15 Pro Max')  // → 'iphone-15-pro-max'
 */
const slugify = (str) =>
  str
    .normalize('NFD')                         // decompose accented chars (é → e + ́)
    .replace(/[\u0300-\u036f]/g, '')          // drop combining diacritic marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')            // remove anything that's not alphanumeric or hyphen
    .replace(/[\s]+/g, '-')                   // spaces → single hyphen
    .replace(/-{2,}/g, '-')                   // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '');                 // trim leading/trailing hyphens

export default slugify;
