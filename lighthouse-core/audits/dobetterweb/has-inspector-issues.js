/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../audit.js');
const i18n = require('../../lib/i18n/i18n.js');

const UIStrings = {
  /** Title of a Lighthouse audit that provides detail on inspector issues. This descriptive title is shown to users when no issues were logged into the devtools Issues panel. */
  title: 'No issues in the Issues panel',
  /** Title of a Lighthouse audit that provides detail on inspector issues. This descriptive title is shown to users when issues are detected and logged into the devtools Issues panel. */
  failureTitle: 'Browser errors were logged to the console',
  /** Description of a Lighthouse audit that tells the user why issues being logged to the devtools Issues panel are a cause for concern and so should be fixed. This is displayed after a user expands the section to see more. No character length limits. */
  description: 'Description TBD',
  /** Table column header for the type of issue. */
  columnIssueType: 'Issue Type',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

class IssuesPanelEntries extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'has-inspector-issues',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['InspectorIssues'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {

    const headings = [
      {key: 'issueType', itemType: 'text', text: str_(UIStrings.columnIssueType)},
      {key: 'reason', itemType: 'text', text: 'Reason'},
    ];

    const issues = artifacts.InspectorIssues;
    const items = [];

    for (const [issueType, issuesOfType] of Object.entries(issues)) {
      for (const issue of issuesOfType) {
        items.push({
          issueType,
          reason: issue.reason || issue.violatedDirective || issue.insecureURL,
        });
      }
    }

    return {
      score: 1,
      details: Audit.makeTableDetails(headings, items),
    };
  }
}

module.exports = IssuesPanelEntries;
module.exports.UIStrings = UIStrings;
