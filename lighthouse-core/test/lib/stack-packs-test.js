/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const lighthouseStackPacksDep = require('lighthouse-stack-packs');
const stackPacksLib = require('../../lib/stack-packs.js');
const defaultConfig = require('../../config/default-config.js');
const Config = require('../../config/config.js');

function getAuditIds() {
  const config = new Config(defaultConfig);
  return config.audits.map(a => a.implementation.meta.id);
}

describe('stack-packs lib', () => {
  it('there are no packs without detectors', () => {
    const result = lighthouseStackPacksDep
      .filter(p => !stackPacksLib.stackPacksToInclude.find(p2 => p2.packId === p.id))
      .map(p => p.id);
    expect(result).toEqual([]);
  });
});

// These tests summarize the contents of the lighthouse-stack-packs package.
describe('lighthouse-stack-packs dep', () => {
  it('snapshot packs', () => {
    expect(lighthouseStackPacksDep.map(p => p.id)).toMatchInlineSnapshot(`
      Array [
        "wordpress",
        "drupal",
        "react",
        "angular",
        "amp",
        "magento",
        "joomla",
        "octobercms",
      ]
    `);
  });

  it('snapshot keys for each pack', () => {
    const result = lighthouseStackPacksDep.map(p => {
      return {id: p.id, keys: Object.keys(p.UIStrings)};
    });
    // Keys should only be added, not removed.
    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "id": "wordpress",
          "keys": Array [
            "unused-css-rules",
            "uses-webp-images",
            "offscreen-images",
            "total-byte-weight",
            "render-blocking-resources",
            "unminified-css",
            "unminified-javascript",
            "efficient-animated-content",
            "unused-javascript",
            "uses-long-cache-ttl",
            "uses-optimized-images",
            "uses-text-compression",
            "uses-responsive-images",
            "time-to-first-byte",
          ],
        },
        Object {
          "id": "drupal",
          "keys": Array [
            "unused-css-rules",
            "unused-javascript",
            "uses-webp-images",
            "offscreen-images",
            "total-byte-weight",
            "render-blocking-resources",
            "unminified-css",
            "unminified-javascript",
            "efficient-animated-content",
            "uses-long-cache-ttl",
            "uses-optimized-images",
            "uses-responsive-images",
            "time-to-first-byte",
            "uses-rel-preconnect",
            "font-display",
          ],
        },
        Object {
          "id": "react",
          "keys": Array [
            "unminified-css",
            "unminified-javascript",
            "unused-javascript",
            "time-to-first-byte",
            "redirects",
            "user-timings",
            "dom-size",
          ],
        },
        Object {
          "id": "angular",
          "keys": Array [
            "total-byte-weight",
            "unminified-warning",
            "unused-javascript",
            "uses-responsive-images",
            "uses-rel-preload",
            "dom-size",
          ],
        },
        Object {
          "id": "amp",
          "keys": Array [
            "uses-webp-images",
            "offscreen-images",
            "render-blocking-resources",
            "unminified-css",
            "efficient-animated-content",
            "uses-responsive-images",
          ],
        },
        Object {
          "id": "magento",
          "keys": Array [
            "uses-webp-images",
            "offscreen-images",
            "disable-bundling",
            "unminified-css",
            "unminified-javascript",
            "unused-javascript",
            "uses-optimized-images",
            "time-to-first-byte",
            "uses-rel-preconnect",
            "uses-rel-preload",
            "critical-request-chains",
            "font-display",
          ],
        },
        Object {
          "id": "joomla",
          "keys": Array [
            "unused-css-rules",
            "uses-webp-images",
            "offscreen-images",
            "total-byte-weight",
            "render-blocking-resources",
            "unminified-css",
            "unminified-javascript",
            "efficient-animated-content",
            "unused-javascript",
            "uses-long-cache-ttl",
            "uses-optimized-images",
            "uses-text-compression",
            "uses-responsive-images",
            "server-response-time",
          ],
        },
        Object {
          "id": "octobercms",
          "keys": Array [
            "unused-css-rules",
            "uses-webp-images",
            "offscreen-images",
            "total-byte-weight",
            "render-blocking-resources",
            "unminified-css",
            "unminified-javascript",
            "efficient-animated-content",
            "unused-javascript",
            "uses-long-cache-ttl",
            "uses-optimized-images",
            "uses-text-compression",
            "uses-responsive-images",
            "time-to-first-byte",
          ],
        },
      ]
    `);
  });

  // Keys for plugin audits are allowed in this package.
  // Make sure none are typos of core audits.
  it('snapshot unrecognized keys', () => {
    const auditIds = getAuditIds();

    const unrecognizedKeys = new Set();
    for (const pack of lighthouseStackPacksDep) {
      for (const key in pack.UIStrings) {
        if (!auditIds.includes(key)) unrecognizedKeys.add(key);
      }
    }

    expect([...unrecognizedKeys]).toMatchInlineSnapshot(`
      Array [
        "time-to-first-byte",
        "unminified-warning",
        "disable-bundling",
      ]
    `);
  });
});
