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

const UIStrings = {
  /** Title of a Lighthouse audit that provides detail on whether . This descriptive title is shown to users when */
  title: '',
  /** Title of a Lighthouse audit that provides detail on whether . This descriptive title is shown to users when */
  failureTitle: '',
  /** Description of a Lighthouse audit that tells the user why they should include . This is displayed after a user expands the section to see more. No character length limits. 'Learn More' becomes link text to additional documentation. */
  description: '',
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
      requiredArtifacts: [],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts) {
    return {
      score: 0,
      notApplicable: 0,
      details: {},
    };
  }
}

module.exports = UsesRelPreloadAndFontDisplayAudit;
module.exports.UIStrings = UIStrings;
