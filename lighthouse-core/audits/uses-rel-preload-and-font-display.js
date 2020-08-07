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
const FontDisplay = require('./../audits/font-display.js');
const UsesRelPreload = require('./../audits/uses-rel-preload.js');
const PASSING_FONT_DISPLAY_REGEX = /^(optional)$/;
const PageDependencyGraph = require('../computed/page-dependency-graph.js');

const UIStrings = {
  /** Title of a Lighthouse audit that provides detail on whether . This descriptive title is shown to users when */
  title: 'new audit',
  /** Title of a Lighthouse audit that provides detail on whether . This descriptive title is shown to users when */
  failureTitle: 'fail new audit',
  /** Description of a Lighthouse audit that tells the user why they should include . This is displayed after a user expands the section to see more. No character length limits. 'Learn More' becomes link text to additional documentation. */
  description: 'new audit description',
  crossoriginWarning: 'A preload <link> was found for "{preloadURL}" but was not used ' +
    'by the browser. Check that you are using the `crossorigin` attribute properly.',
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
    const devtoolsLog = artifacts.devtoolsLogs[this.DEFAULT_PASS];
    const graph = await PageDependencyGraph.request({trace, devtoolsLog}, context);

    // Gets the URLs of fonts where font-display: optional.
    const passingURLs =
      FontDisplay.findFontDisplayDeclarations(artifacts, PASSING_FONT_DISPLAY_REGEX).passingURLs;

    // Gets the URLs attempted to be preloaded, and those that failed to be reused and were requested again.
    /** @type {Array<string>|undefined} */
    // Warnings will be a repeat of the warnings from uses-rel-preload, but will have tweaked message
    let warnings;
    const {failedURLs, attemptedURLs} = UsesRelPreload.getURLsFailedToPreload(graph);
    if (failedURLs.size) {
      warnings = Array.from(failedURLs)
        .map(preloadURL => str_(UIStrings.crossoriginWarning, {preloadURL}));
    }

    const results = Array.from(passingURLs)
      .filter(url => attemptedURLs.has(url))
      .map(url => {
        return {url: url};
      });

    /** @type {LH.Audit.Details.Table['headings']} */
    const headings = [
      {key: 'url', itemType: 'url', text: str_(i18n.UIStrings.columnURL)},
      // TODO: show the CLS that could have been saved if font was preloaded
    ];

    return {
      score: results.length > 0 ? 0 : 1,
      details: Audit.makeTableDetails(headings, results),
      warnings,
      notApplicable: results.length === 0,
    };
  }
}

module.exports = UsesRelPreloadAndFontDisplayAudit;
module.exports.UIStrings = UIStrings;
