/**
 * dsh-has-stripper -- host entry.
 *
 * Client-only plugin: the work happens in lib/client.js. This empty host node
 * exists so the profile's layer stack can insert the bundle.
 */

export const name = 'dsh-has-stripper';

export const inject = [];

export function apply() {
  // No host-side behaviour on purpose.
}
