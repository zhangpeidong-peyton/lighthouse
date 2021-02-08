/**
 * @license Copyright 2021 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const FirstContentfulPaintAllFrames = require('../../../computed/metrics/first-contentful-paint-all-frames.js'); // eslint-disable-line max-len
const FirstContentfulPaint = require('../../../computed/metrics/first-contentful-paint.js'); // eslint-disable-line max-len
const trace = require('../../fixtures/traces/frame-metrics-m89.json');
const devtoolsLog = require('../../fixtures/traces/frame-metrics-m89.devtools.log.json');

/* eslint-env jest */

describe('Metrics: FCP all frames', () => {
  it('should throw for simulated throttling', async () => {
    const settings = {throttlingMethod: 'simulate'};
    const context = {settings, computedCache: new Map()};
    const resultPromise = FirstContentfulPaintAllFrames.request(
      {trace, devtoolsLog, settings},
      context
    );

    // TODO: Implement lantern solution for FCP all frames.
    await expect(resultPromise).rejects.toThrow();
  });

  it('should compute FCP-AF separate from FCP', async () => {
    const settings = {throttlingMethod: 'provided'};
    const context = {settings, computedCache: new Map()};

    const result = await FirstContentfulPaintAllFrames.request(
      {trace, devtoolsLog, settings},
      context
    );
    const mainFrameResult = await FirstContentfulPaint.request(
      {trace, devtoolsLog, settings},
      context
    );

    expect(result).toEqual(
      {
        timestamp: 23466705983,
        timing: 682.853,
      }
    );
    expect(mainFrameResult).toEqual(
      {
        timestamp: 23466886143,
        timing: 863.013,
      }
    );
  });
});
