'use strict';

const sinon = require('sinon');

const actions = require('../actions');
const resultStore = require('../stores/resultStore');
const wikipedia = require('../utils/wikipedia');

describe('actions', function() {
  const sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.useFakeTimers();
    sandbox.stub(wikipedia, 'search');
    resultStore.setState({
      results: [],
      updated: new Date(),
    });

    sandbox.clock.tick(100);
  });

  afterEach(function() {
    sandbox.restore();
    resultStore.setState({
      results: [],
      updated: new Date(),
    });
  });

  describe('#search', function() {
    it('should be a function', function() {
      expect(actions.search).toBeA(Function);
    });

    it('should search wikipedia', function() {
      wikipedia.search.returns(Promise.resolve());
      actions.search('test');
      sinon.assert.calledOnce(wikipedia.search);
    });

    it('should discard outdated request', function() {
      wikipedia.search.returns(Promise.resolve());
      sandbox.stub(resultStore, 'isOutdated').returns(true);
      sandbox.stub(resultStore, 'setState');

      return actions.search('test').then(() => {
        sinon.assert.called(resultStore.isOutdated);
        sinon.assert.calledWithExactly(resultStore.isOutdated, new Date());
        sinon.assert.notCalled(resultStore.setState);
      });
    });

    it('should set "updated" state on resultStore to current date', function() {
      const data = ['test', [], [], []];
      wikipedia.search.returns(Promise.resolve(data));

      return actions.search('test').then(() => {
        expect(resultStore.getState().updated).toEqual(new Date());
      });
    });

    it('should update "results" state on resultStore', function() {
      const data = ['test', [], [], []];
      wikipedia.search.returns(Promise.resolve(data));
      const prevResults = resultStore.getState().results

      return actions.search('test').then(() => {
        expect(resultStore.getState().results).toNotBe(prevResults);
      });
    });

    it('should convert API search results to an array of objects', function() {
      const data = [
        'query',
        ['title 1', 'title 2'],
        ['description 1', 'description 2'],
        ['link 1', 'link 2']
      ];
      wikipedia.search.returns(Promise.resolve(data));

      return actions.search('query').then(() => {
        expect(resultStore.getState().results).toEqual([{
          title: 'title 1',
          description: 'description 1',
          link: 'link 1'
        }, {
          title: 'title 2',
          description: 'description 2',
          link: 'link 2'
        }]);
      });
    });
  });
});
