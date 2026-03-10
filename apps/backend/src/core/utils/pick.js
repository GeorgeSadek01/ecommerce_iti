/**
 * Return a new object containing only the keys listed in `allowedKeys`.
 *
 * Use this in PATCH endpoints to prevent mass-assignment vulnerabilities —
 * only explicitly allow-listed fields are forwarded to the DB update.
 *
 * @template T
 * @param {T} obj         - Source object (typically req.body)
 * @param {string[]} keys - Allowed keys
 * @returns {Partial<T>}
 *
 * @example
 *   const updates = pick(req.body, ['firstName', 'lastName', 'avatarUrl']);
 *   await User.findByIdAndUpdate(id, updates);
 */
const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});

export default pick;
