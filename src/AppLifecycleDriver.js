import { Observable } from 'rxjs';
import { adapt } from '@cycle/run/lib/adapt';

const eventMapping = {
  willFinishLaunching$: 'will-finish-launching',
  ready$: 'ready',
  windowAllClosed$: 'window-all-closed',
  beforeQuit$: 'before-quit',
  willQuit$: 'will-quit'
};

export default function AppLifecycleDriver(app) {
  return cfgXs$ => {
    const cfg$ = Observable.from(cfgXs$);

    const source = Object.keys(eventMapping).reduce((obj, prop) => Object.defineProperty(obj, prop, {
      get() {
        return adapt(Observable.fromEvent(app, eventMapping[prop]));
      }
    }), {});

    Object.defineProperty(source, 'quit$', {
      get() {
        return Observable.fromEvent(app, 'quit', (e, exitCode) => Object.assign({ exitCode }, e));
      }
    });

    let subscriptions = [];
    cfg$
      .startWith({})
      .forEach(({ state = 'started', exitCode, isQuittingEnabled = true, isAutoExitEnabled = true } = {}) => {
        subscriptions.filter(Boolean).forEach(s => s.dispose());
        subscriptions = [
          !isQuittingEnabled && source.beforeQuit$.forEach(e => e.preventDefault()),
          !isAutoExitEnabled && source.willQuit$.forEach(e => e.preventDefault())
        ];

        if (state === 'quitting') {
          app.quit();
        } else if (state === 'exiting') {
          app.exit(exitCode);
        }
      });

    return source;
  };
}
