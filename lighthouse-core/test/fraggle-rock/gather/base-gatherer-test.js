/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Gatherer = require('../../../fraggle-rock/gather/base-gatherer.js');

/* eslint-env jest */

/** @type {any} */
const fakeParam = {};

describe('BaseGatherer', () => {
  it('should fullfill the contract of both interfaces', async () => {
    const gatherer = new Gatherer();

    // Fraggle Rock Gatherer contract
    expect(typeof gatherer.meta).toBe('object');
    expect(gatherer.snapshot(fakeParam)).toBe(undefined);

    // Legacy Gatherer contract
    expect(typeof gatherer.name).toBe('string');
    expect(await gatherer.beforePass(fakeParam)).toBe(undefined);
    expect(await gatherer.pass(fakeParam)).toBe(undefined);
    expect(await gatherer.afterPass(fakeParam, fakeParam)).toBe(undefined);
  });

  describe('.beforePass', () => {
    it('delegates to beforeTimespan by default', async () => {
      class MyGatherer extends Gatherer {
        beforeTimespan = jest.fn()
      }

      const gatherer = new MyGatherer();
      await gatherer.beforePass(fakeParam);
      expect(gatherer.beforeTimespan).toHaveBeenCalledWith(fakeParam);
    });
  });

  describe('.afterPass', () => {
    it('delegates to snapshot by default', async () => {
      class MyGatherer extends Gatherer {
        /** @param {*} _ */
        snapshot(_) {
          return 'Hello, Fraggle!';
        }
      }

      const gatherer = new MyGatherer();
      expect(gatherer.snapshot(fakeParam)).toEqual('Hello, Fraggle!');
      expect(await gatherer.afterPass(fakeParam, fakeParam)).toEqual('Hello, Fraggle!');
    });

    it('delegates to afterTimespan when supported', async () => {
      class MyGatherer extends Gatherer {
        /** @type {LH.Gatherer.GathererMeta} */
        meta = {supportedModes: ['timespan']};

        /** @param {*} _ */
        snapshot(_) {
          return 'Oops, wrong method!';
        }

        /** @param {*} _ */
        afterTimespan(_) {
          return 'Hello, Fraggle!';
        }
      }

      const gatherer = new MyGatherer();
      expect(await gatherer.afterPass(fakeParam, fakeParam)).toEqual('Hello, Fraggle!');
    });
  });
});
