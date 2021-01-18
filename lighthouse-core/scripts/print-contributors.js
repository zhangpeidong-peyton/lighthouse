/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * @fileoverview Print names and github usernames of new contributors in specified range.
 * Ex: node lighthouse-core/scripts/print-contributors.js v6.4.0 HEAD
 */

/* eslint-disable no-console */

const {execFileSync} = require('child_process');
const fetch = require('node-fetch');

const startingHash = process.argv[2];
const endingHash = process.argv[3];

async function main() {
  // '!!' is used as a delimeter because it is unlikey that will show in a name,
  // and because two special characters in a row is invalid in email addresses.
  const previousAuthors = execFileSync('git', [
    '--no-pager',
    'log',
    '--format=%ae!!%aN',
    `v2.3.0..${startingHash}`,
  ], {encoding: 'utf8'}).trim().split('\n').map(line => {
    const [email, name] = line.split('!!');
    return {email, name};
  });

  const commits = execFileSync('git', [
    '--no-pager',
    'log',
    '--format=%h!!%ae!!%aN',
    `${startingHash}..${endingHash}`,
  ], {encoding: 'utf8'}).trim().split('\n').map(line => {
    const [hash, email, name] = line.split('!!');
    return {hash, email, name};
  });

  /** @type {typeof commits} */
  const authors = [];
  for (const commit of commits) {
    if (authors.find(a => a.email === commit.email)) continue;
    if (previousAuthors.find(a => a.email === commit.email)) continue;

    authors.push(commit);
  }

  for (const author of authors) {
    const response = await fetch(`https://api.github.com/repos/GoogleChrome/lighthouse/commits/${author.hash}`);
    const json = await response.json();
    console.log(`${json.commit.author.name} @${json.author.login}`);
  }
}

main();
