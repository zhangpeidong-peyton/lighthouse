/**
 * @license Copyright 2016 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const lighthouse = require('../lighthouse-core/index.js');
const RawProtocol = require('../lighthouse-core/gather/connections/raw.js');
const log = require('lighthouse-logger');
const {registerLocaleData, lookupLocale} = require('../lighthouse-core/lib/i18n/i18n.js');
const constants = require('../lighthouse-core/config/constants.js');

/** @typedef {import('../lighthouse-core/gather/connections/connection.js')} Connection */

/**
 * Returns a config, which runs only certain categories.
 * Varies the config to use based on device.
 * If `lighthouse-plugin-publisher-ads` is in the list of
 * `categoryIDs` the plugin will also be run.
 * Counterpart to the CDT code that sets flags.
 * @see https://cs.chromium.org/chromium/src/third_party/devtools-frontend/src/front_end/lighthouse/LighthouseController.js?type=cs&q=%22const+RuntimeSettings%22+f:lighthouse+-f:out&g=0&l=250
 * @param {Array<string>} categoryIDs
 * @param {string} device
 * @return {LH.Config.Json}
 */
function createConfig(categoryIDs, device) {
  /** @type {LH.SharedFlagsSettings} */
  const settings = {
    onlyCategories: categoryIDs,
    // In DevTools, emulation is applied _before_ Lighthouse starts (to deal with viewport emulation bugs). go/xcnjf
    // As a result, we don't double-apply viewport emulation.
    screenEmulation: {disabled: true},
  };
  if (device === 'desktop') {
    settings.throttling = constants.throttling.desktopDense4G;
    // UA emulation, however, is lost in the protocol handover from devtools frontend to the lighthouse_worker. So it's always applied.
    settings.emulatedUserAgent = constants.userAgents.desktop;
    settings.formFactor = 'desktop';
  }

  return {
    extends: 'lighthouse:default',
    plugins: ['lighthouse-plugin-publisher-ads'],
    settings,
  };
}

/**
 * @param {RawProtocol.Port} port
 * @returns {RawProtocol}
 */
function setUpWorkerConnection(port) {
  return new RawProtocol(port);
}

/** @param {(status: [string, string, string]) => void} listenCallback */
function listenForStatus(listenCallback) {
  log.events.addListener('status', listenCallback);
}

// For the bundle smoke test.
if (typeof module !== 'undefined' && module.exports) {
  // Ideally this could be exposed via browserify's `standalone`, but it doesn't
  // work for LH because of https://github.com/browserify/browserify/issues/968
  // Instead, since this file is only ever run in node for testing, expose a
  // bundle entry point as global.
  // @ts-expect-error
  global.runBundledLighthouse = lighthouse;
}

// Expose only in DevTools' worker
if (typeof self !== 'undefined') {
  // TODO: refactor and delete `global.isDevtools`.
  global.isDevtools = true;

  // @ts-expect-error
  self.setUpWorkerConnection = setUpWorkerConnection;
  // @ts-expect-error
  self.runLighthouse = lighthouse;
  // @ts-expect-error
  self.createConfig = createConfig;
  // @ts-expect-error
  self.listenForStatus = listenForStatus;
  // @ts-expect-error
  self.registerLocaleData = registerLocaleData;
  // @ts-expect-error
  self.lookupLocale = lookupLocale;
}
