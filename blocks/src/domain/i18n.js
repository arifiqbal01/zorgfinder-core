import { __ } from "@wordpress/i18n";

/**
 * Generic translator helper
 * @param {string} key
 * @param {string} domain
 */
export const t = (key, domain = "zorgfinder-core") =>
  __(key, domain);
