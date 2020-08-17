/**
 * @license Copyright 2019 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('./audit.js');
const i18n = require('../lib/i18n/i18n.js');
const thirdPartyWeb = require('../lib/third-party-web.js');
const NetworkRecords = require('../computed/network-records.js');
const MainResource = require('../computed/main-resource.js');
const MainThreadTasks = require('../computed/main-thread-tasks.js');

const UIStrings = {
  /** Title of a diagnostic audit that provides details about the third-party code on a web page that can be lazy loaded. This descriptive title is shown to users when no resources have lazy loading alternatives available. */
  title: 'Lazy load third-party resources',
  /** Title of a diagnostic audit that provides details about the third-party code on a web page that can be lazy loaded. This descriptive title is shown to users when one or more third-party resources have available lazy loading alternatives. */
  failureTitle: 'Some third-party resources can be lazy loaded',
  /** Description of a Lighthouse audit that identifies the third party code on the page that can be lazy loaded. This is displayed after a user expands the section to see more. No character length limits. 'Learn More' becomes link text to additional documentation. */
  description: 'Some third-party resources can be fetched after the page loads. ' +
    'These third-party resources are used by embedded elements which can be replaced by a facade ' +
    'until the user needs to use them. [Learn more]().',
  /** Summary text for the result of a Lighthouse audit that identifies the third party code on a web page that can be lazy loaded. This text summarizes the number of distinct lazy loadable entities that were found on the page. */
  displayValue: `{itemCount, plural,
  =1 {# lazy loadable resource found}
  other {# lazy loadable resources found}
  }`,
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/** @typedef {import("third-party-web").IEntity} ThirdPartyEntity */

class LazyThirdParty extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'lazy-third-party',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['traces', 'devtoolsLogs', 'URL'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    return {
      score: 1,
      notApplicable: true,
    };
  }
}

module.exports = LazyThirdParty;
module.exports.UIStrings = UIStrings;
