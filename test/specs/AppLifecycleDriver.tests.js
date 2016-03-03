import AppLifecycleDriver from '../../src/AppLifecycleDriver';

import { expect } from 'chai';
import { spy } from 'sinon';
import { Observable } from 'rx';
import Cycle from '@cycle/core';

import AppStub from '../stubs/App';

describe('The AppLifecycleDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  describe('source', () => {
    const basicSources = {
      willFinishLaunching$: 'will-finish-launching',
      ready$: 'ready',
      windowAllClosed$: 'window-all-closed',
      beforeQuit$: 'before-quit',
      willQuit$: 'will-quit'
    };

    Object.keys(basicSources).forEach(prop => {
      describe(prop, () => {
        const eventName = basicSources[prop];
        it(`contains ${eventName} events`, done => {
          Cycle.run(({ lifecycle }) => ({
            output: lifecycle[prop]
          }), {
            lifecycle: AppLifecycleDriver(app),
            output: event$ => event$.first().forEach(verify)
          });

          const emittedEvent = {};
          setTimeout(() => app.emit(eventName, emittedEvent), 1);

          function verify(receivedEvent) {
            expect(receivedEvent).to.equal(emittedEvent);
            done();
          }
        });
      })
    });
  });

  describe('sink', () => {
    const preventionFlags = {
      'before-quit': 'isQuittingEnabled',
      'will-quit': 'isAutoExitEnabled'
    };

    Object.keys(preventionFlags).forEach(eventName => {
      const flag = preventionFlags[eventName];
      it(`prevents ${eventName} default behaviors if ${flag} is false`, done => {
        Cycle.run(({ lifecycle }) => ({
          lifecycle: Observable.just({
            [flag]: false
          })
        }), {
          lifecycle: AppLifecycleDriver(app)
        });

        setTimeout(() => {
          const event = { preventDefault: spy() };
          app.emit(eventName, event);

          expect(event.preventDefault).to.have.been.called;
          done();
        }, 1);
      });
    });
  });
});