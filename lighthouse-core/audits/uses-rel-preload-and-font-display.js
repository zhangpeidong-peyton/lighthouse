/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
/**
 * @fileoverview
 * Audit that .
 */

'use strict';

const Audit = require('./audit.js');
const i18n = require('./../lib/i18n/i18n.js');
const URL = require('./../lib/url-shim.js');
const NetworkRecords = require('../computed/network-records.js');
const FontDisplay = require('./../audits/font-display.js');

const UIStrings = {
  /** Title of a Lighthouse audit that provides detail on whether . This descriptive title is shown to users when */
  title: 'new audit',
  /** Title of a Lighthouse audit that provides detail on whether . This descriptive title is shown to users when */
  failureTitle: 'fail new audit',
  /** Description of a Lighthouse audit that tells the user why they should include . This is displayed after a user expands the section to see more. No character length limits. 'Learn More' becomes link text to additional documentation. */
  description: 'new audit description',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

class UsesRelPreloadAndFontDisplayAudit extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'uses-rel-preload-and-font-display',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['devtoolsLogs', 'CSSUsage', 'URL', 'traces'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[UsesRelPreloadAndFontDisplayAudit.DEFAULT_PASS];
    const devtoolsLogs = artifacts.devtoolsLogs[this.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLogs, context);
    const URL = artifacts.URL;
    const {passingURLs, failingURLs} = FontDisplay.findFontDisplayDeclarations(artifacts);


    return {
      score: 1,
      details: undefined,
    };
  }
}

module.exports = UsesRelPreloadAndFontDisplayAudit;
module.exports.UIStrings = UIStrings;
