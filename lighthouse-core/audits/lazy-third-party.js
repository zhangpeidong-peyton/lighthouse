/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('./audit.js');
const BootupTime = require('./bootup-time.js');
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
  /** Summary text for the result of a Lighthouse audit that identifies the third party code on a web page that can be lazy loaded. This text summarizes the number of lazy loading facades that can be used on the page. */
  displayValue: `{itemCount, plural,
  =1 {# facade alternative available}
  other {# facade alternatives available}
  }`,
  /** Label for a table column that displays the name of a lazy loading facade alternative for a third party resource. */
  columnFacade: 'Facade Alternative',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/** @typedef {import("third-party-web").IEntity} ThirdPartyEntity */
/** @typedef {import("third-party-web").IFacade} ThirdPartyFacade */

/** @typedef {{mainThreadTime: number, transferSize: number, blockingTime: number}} Summary */
/** @typedef {{summary: Summary, urlSummaries: Map<string, Summary>}} FacadeSummary */

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
   *
   * @param {Array<LH.Artifacts.NetworkRequest>} networkRecords
   * @param {Array<LH.Artifacts.TaskNode>} mainThreadTasks
   * @param {number} cpuMultiplier
   * @param {ThirdPartyEntity | undefined} mainEntity
   * @return {Map<ThirdPartyFacade, FacadeSummary>}
   */
  static getSummaries(networkRecords, mainThreadTasks, cpuMultiplier, mainEntity) {
    /** @type {Map<ThirdPartyFacade, FacadeSummary>} */
    const summaries = new Map();
    const defaultStat = {mainThreadTime: 0, blockingTime: 0, transferSize: 0};
    const defaultFacadeStat = {summary: {...defaultStat}, urlSummaries: new Map()};

    for (const request of networkRecords) {
      const entity = thirdPartyWeb.getEntity(request.url);
      const facade = thirdPartyWeb.getFirstFacade(request.url);
      if (!facade || !entity || mainEntity && entity.name === mainEntity.name) continue;

      const facadeStats = summaries.get(facade) || {...defaultFacadeStat};
      facadeStats.summary.transferSize += request.transferSize;

      const urlStats = facadeStats.urlSummaries.get(request.url) || {...defaultStat};
      urlStats.transferSize += request.transferSize;
      facadeStats.urlSummaries.set(request.url, urlStats);

      summaries.set(facade, facadeStats);
    }

    const jsURLs = BootupTime.getJavaScriptURLs(networkRecords);

    for (const task of mainThreadTasks) {
      const attributableURL = BootupTime.getAttributableURLForTask(task, jsURLs);
      const entity = thirdPartyWeb.getEntity(attributableURL);
      const facade = thirdPartyWeb.getFirstFacade(attributableURL);
      if (!facade || !entity || mainEntity && entity.name === mainEntity.name) continue;

      const facadeStats = summaries.get(facade) || {...defaultFacadeStat};
      const urlStats = facadeStats.urlSummaries.get(attributableURL) || {...defaultStat};

      const taskDuration = task.selfTime * cpuMultiplier;
      facadeStats.summary.mainThreadTime += taskDuration;
      urlStats.mainThreadTime += taskDuration;

      // The amount of time spent *blocking* on main thread is the sum of all time longer than 50ms.
      // Note that this is not totally equivalent to the TBT definition since it fails to account for FCP,
      // but a majority of third-party work occurs after FCP and should yield largely similar numbers.
      const blockingTime = Math.max(taskDuration - 50, 0);
      facadeStats.summary.blockingTime += blockingTime;
      urlStats.blockingTime += blockingTime;

      facadeStats.urlSummaries.set(attributableURL, urlStats);
      summaries.set(facade, facadeStats);
    }

    return summaries;
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const settings = context.settings || {};
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);
    const mainResource = await MainResource.request({devtoolsLog, URL: artifacts.URL}, context);
    const mainEntity = thirdPartyWeb.getEntity(mainResource.url);
    const tasks = await MainThreadTasks.request(trace, context);
    const multiplier = settings.throttlingMethod === 'simulate' ?
      settings.throttling.cpuSlowdownMultiplier : 1;
    const summaries = this.getSummaries(networkRecords, tasks, multiplier, mainEntity);

    const summary = {wastedBytes: 0, wastedMs: 0};

    /** @type LH.Audit.Details.TableItem[] */
    const results = Array.from(summaries)
      .map(([facade, facadeStats]) => {
        /** @type LH.Audit.Details.TableItem[] */
        const items = [];
        for (const [url, urlStats] of Array.from(facadeStats.urlSummaries)) {
          items.push({url, ...urlStats});
        }
        summary.wastedBytes += facadeStats.summary.transferSize;
        summary.wastedMs += facadeStats.summary.blockingTime;
        return {
          facade: /** @type {LH.Audit.Details.LinkValue} */ {
            type: 'link',
            text: facade.name,
            url: facade.repo,
          },
          transferSize: facadeStats.summary.transferSize,
          mainThreadTime: facadeStats.summary.mainThreadTime,
          blockingTime: facadeStats.summary.blockingTime,
          subItems: {type: 'subitems', items},
        };
      });

    /** @type {LH.Audit.Details.Table['headings']} */
    const headings = [
      {key: 'facade', itemType: 'link', text: str_(UIStrings.columnFacade),
        subItemsHeading: {key: 'url', itemType: 'url'}},
      {key: 'transferSize', granularity: 1, itemType: 'bytes',
        text: str_(i18n.UIStrings.columnTransferSize), subItemsHeading: {key: 'transferSize'}},
      {key: 'blockingTime', granularity: 1, itemType: 'ms',
        text: str_(i18n.UIStrings.columnBlockingTime), subItemsHeading: {key: 'blockingTime'}},
    ];

    if (!results.length) {
      return {
        score: 1,
        notApplicable: true,
      };
    }
    return {
      score: 0,
      displayValue: str_(UIStrings.displayValue, {
        itemCount: results.length,
      }),
      details: Audit.makeTableDetails(headings, results, summary),
    };
  }
}

module.exports = LazyThirdParty;
module.exports.UIStrings = UIStrings;
