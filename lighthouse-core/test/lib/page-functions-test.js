/**
 * @license Copyright 2018 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const assert = require('assert').strict;
const jsdom = require('jsdom');
const DOM = require('../../report/html/renderer/dom.js');
const pageFunctions = require('../../lib/page-functions.js');

/* eslint-env jest */

describe('Page Functions', () => {
  let dom;

  beforeAll(() => {
    const {document, ShadowRoot, Node, HTMLElement} = new jsdom.JSDOM().window;
    global.ShadowRoot = ShadowRoot;
    global.Node = Node;
    global.HTMLElement = HTMLElement;
    dom = new DOM(document);
  });

  afterAll(() => {
    global.ShadowRoot = undefined;
    global.Node = undefined;
  });

  describe('wrapRuntimeEvalErrorInBrowser()', () => {
    it('returns an error summary object of a regular Error', () => {
      const testMsg = 'custom test error';
      const err = new TypeError(testMsg); // TypeError to ensure `name` is copied over.

      const wrapped = pageFunctions.wrapRuntimeEvalErrorInBrowser(err);
      expect(wrapped).toEqual({
        __failedInBrowser: true,
        name: 'TypeError',
        message: testMsg,
        stack: expect.stringMatching(/^TypeError:.*page-functions-test\.js:\d+:\d+/s),
      });
    });

    it('creates an error summary object from a string error message', () => {
      const errMsg = 'just a string error';

      const wrapped = pageFunctions.wrapRuntimeEvalErrorInBrowser(errMsg);
      expect(wrapped).toEqual({
        __failedInBrowser: true,
        name: 'Error',
        message: errMsg,
        // eslint-disable-next-line max-len
        stack: expect.stringMatching(/^Error:.*wrapRuntimeEvalErrorInBrowser.*page-functions\.js:\d+:\d+/s),
      });
    });

    it('creates the best error summary it can when passed nothing', () => {
      const wrapped = pageFunctions.wrapRuntimeEvalErrorInBrowser();
      expect(wrapped).toEqual({
        __failedInBrowser: true,
        name: 'Error',
        message: 'unknown error',
        // eslint-disable-next-line max-len
        stack: expect.stringMatching(/^Error:.*wrapRuntimeEvalErrorInBrowser.*page-functions\.js:\d+:\d+/s),
      });
    });
  });

  describe('get outer HTML snippets', () => {
    it('gets full HTML snippet', () => {
      assert.equal(pageFunctions.getOuterHTMLSnippet(
        dom.createElement('div', '', {id: '1', style: 'style'})), '<div id="1" style="style">');
    });

    it('removes a specific attribute', () => {
      assert.equal(pageFunctions.getOuterHTMLSnippet(
        dom.createElement('div', '', {id: '1', style: 'style'}), ['style']), '<div id="1">');
    });

    it('removes multiple attributes', () => {
      assert.equal(pageFunctions.getOuterHTMLSnippet(
        dom.createElement('div', '', {'id': '1', 'style': 'style', 'aria-label': 'label'}),
        ['style', 'aria-label']
      ), '<div id="1">');
    });

    it('should handle dom nodes that cannot be cloned', () => {
      const element = dom.createElement('div');
      element.cloneNode = () => {
        throw new Error('oops!');
      };
      assert.equal(pageFunctions.getOuterHTMLSnippet(element), '<div>');
    });
    it('ignores when attribute not found', () => {
      assert.equal(pageFunctions.getOuterHTMLSnippet(
        dom.createElement('div', '', {'id': '1', 'style': 'style', 'aria-label': 'label'}),
        ['style-missing', 'aria-label-missing']
      ), '<div id="1" style="style" aria-label="label">');
    });

    it('works if attribute values contain line breaks', () => {
      assert.equal(pageFunctions.getOuterHTMLSnippet(
        dom.createElement('div', '', {style: 'style1\nstyle2'})), '<div style="style1\nstyle2">');
    });

    it('truncates attribute values that are too long', () => {
      const longClass = 'a'.repeat(200);
      const truncatedExpectation = 'a'.repeat(74) + '…';
      assert.equal(pageFunctions.getOuterHTMLSnippet(
        dom.createElement('div', '', {class: longClass})), `<div class="${truncatedExpectation}">`
      );
    });

    it('removes attributes if the length of the attribute name + value is too long', () => {
      const longValue = 'a'.repeat(200);
      const truncatedValue = 'a'.repeat(74) + '…';
      const element = dom.createElement('div', '', {
        class: longValue,
        id: longValue,
        att1: 'shouldn\'t see this',
        att2: 'shouldn\'t see this either',
      });
      const snippet = pageFunctions.getOuterHTMLSnippet(element, [], 150);
      assert.equal(snippet, `<div class="${truncatedValue}" id="${truncatedValue}" …>`
      );
    });
  });

  describe('getNodeSelector', () => {
    it('Uses IDs where available and otherwise falls back to classes', () => {
      const parentEl = dom.createElement('div', '', {id: 'wrapper', class: 'dont-use-this'});
      const childEl = dom.createElement('div', '', {class: 'child'});
      parentEl.appendChild(childEl);
      assert.equal(pageFunctions.getNodeSelector(childEl), 'div#wrapper > div.child');
    });
  });

  describe('getNodeLabel', () => {
    it('Returns innerText if element has visible text', () => {
      const el = dom.createElement('div');
      el.innerText = 'Hello';
      assert.equal(pageFunctions.getNodeLabel(el), 'Hello');
    });

    it('Falls back to children and alt/aria-label if a title can\'t be determined', () => {
      const el = dom.createElement('div');
      const childEl = dom.createElement('div', '', {'aria-label': 'Something'});
      el.appendChild(childEl);
      assert.equal(pageFunctions.getNodeLabel(el), 'Something');
    });

    it('Truncates long text', () => {
      const el = dom.createElement('div');
      el.setAttribute('alt', Array(100).fill('a').join(''));
      assert.equal(pageFunctions.getNodeLabel(el).length, 80);
    });

    it('Truncates long text containing unicode surrogate pairs', () => {
      const el = dom.createElement('div');
      // `getNodeLabel` truncates to 80 characters internally.
      // We want to test a unicode character on the boundary.
      el.innerText = Array(78).fill('a').join('') + '💡💡💡';
      assert.equal(pageFunctions.getNodeLabel(el), Array(78).fill('a').join('') + '💡…');
    });

    it('Uses tag name for html tags', () => {
      const el = dom.createElement('html');
      assert.equal(pageFunctions.getNodeLabel(el), 'html');
    });

    it('Uses tag name if there is no better label', () => {
      const el = dom.createElement('div');
      const childEl = dom.createElement('span');
      el.appendChild(childEl);
      assert.equal(pageFunctions.getNodeLabel(el), 'div');
    });
  });

  describe('getNodePath', () => {
    it('returns basic node path', () => {
      const el = dom.createElement('div');
      el.innerHTML = `
        <section>
          <span>Sup</span>
          <img src="#">
        </section>
      `;
      const img = el.querySelector('img');
      // The img is index 1 of section's children (excluding some whitespace only text nodes).
      assert.equal(pageFunctions.getNodePath(img), '0,SECTION,1,IMG');
    });

    it('returns node path through shadow root', () => {
      const el = dom.createElement('div');
      const main = el.appendChild(dom.createElement('main'));
      const shadowRoot = main.attachShadow({mode: 'open'});
      const sectionEl = dom.createElement('section');
      const img = dom.createElement('img');
      img.src = '#';
      sectionEl.append(img);
      shadowRoot.append(sectionEl);

      assert.equal(pageFunctions.getNodePath(img), '0,MAIN,a,#document-fragment,0,SECTION,0,IMG');
    });
  });
});
