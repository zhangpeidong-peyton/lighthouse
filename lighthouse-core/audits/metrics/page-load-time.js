/**
 * @license Copyright 2017 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const Audit = require("../audit.js");
const i18n = require("../../lib/i18n/i18n.js");
const TraceProcessor = require("../../lib/tracehouse/trace-processor.js");

const UIStrings = {
  /**  */
  description:
    'load time.',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

class PageLoadTime extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: "page-load-time",
      title: "Load Time",
      description: "Load Time",
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ["traces"]
    };
  }

  /**
   * @return {{mobile: {scoring: LH.Audit.ScoreOptions}, desktop: {scoring: LH.Audit.ScoreOptions}}}
   */
  static get defaultOptions() {
    return {
      mobile: {
        scoring: {
          p10: 2336,
          median: 4000
        }
      },
      desktop: {
        // SELECT QUANTILES(renderStart, 21) FROM [httparchive:summary_pages.2018_12_15_desktop] LIMIT 1000
        scoring: {
          p10: 934,
          median: 1600
        }
      }
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const traceOfTab = TraceProcessor.computeTraceOfTab(trace);
    const { timings } = traceOfTab;
    const loadTime = timings.load ? timings.load : 0;
    const isDesktop = context.settings.formFactor === 'desktop';
    const options = isDesktop
      ? context.options.desktop
      : context.options.mobile;

    return {
      score: Audit.computeLogNormalScore(options.scoring, loadTime),
      numericValue: loadTime,
      numericUnit: "millisecond",
      displayValue: str_(i18n.UIStrings.seconds, {
        timeInMs: loadTime
      })
    };
  }
}

module.exports = PageLoadTime;
module.exports.UIStrings = UIStrings;
