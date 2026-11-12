/**
 * Ponte entre o app e o mapa. Dentro da WebView, as mensagens chegam por `postMessage`
 * (iOS: window; Android: document) e voltam por `window.ReactNativeWebView.postMessage`.
 * A página de desenvolvimento usa o mesmo `handle`, chamando-o direto.
 */
import { loadMapFonts } from './fonts';
import type { FromMap, ToMap } from './protocol';
import { StadiumMap } from './stadiumMap';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

export interface Bridge {
  handle: (msg: ToMap) => void;
  map: () => StadiumMap | null;
}

export function createBridge(opts: {
  container: HTMLElement;
  /** URL de cada arquivo de fonte (servidor de desenvolvimento ou data URI). */
  fontSrc: (file: string) => string;
  /** Avisos do mapa. Padrão: enviar ao app pela WebView. */
  emit?: (msg: FromMap) => void;
  preserveDrawingBuffer?: boolean;
}): Bridge {
  // No app: ReactNativeWebView. Na versão web do app o mapa roda num iframe: avisa a janela-mãe.
  const emit =
    opts.emit ??
    ((msg: FromMap) => {
      const raw = JSON.stringify(msg);
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(raw);
      else if (window.parent !== window) window.parent.postMessage(raw, '*');
    });
  let sm: StadiumMap | null = null;
  const pending: ToMap[] = [];

  const run = (msg: ToMap) => {
    if (!sm) return void pending.push(msg);
    switch (msg.type) {
      case 'setTheme':
        return sm.setTheme(msg.theme);
      case 'setInsets':
        return sm.setInsets(msg.top, msg.bottom, msg.right ?? 0);
      case 'setLevel':
        return sm.setLevel(msg.level);
      case 'setFilters':
        return sm.setFilters(msg.hidden);
      case 'setArea':
        return sm.setArea(msg.area, msg.block);
      case 'focusPoi':
        return sm.focusPoi(msg.id);
      case 'focusSector':
        return sm.focusSector(msg.id);
      case 'seatView':
        return sm.seatView(msg.sector);
      case 'exitSeatView':
        return sm.exitSeatView();
      case 'clearSelection':
        return sm.clearSelection();
      case 'recenter':
        return sm.recenter();
      case 'setUserLocation':
        return sm.setUserLocation([msg.lng, msg.lat], msg.accuracy, msg.level);
      case 'clearUserLocation':
        return sm.setUserLocation(null);
      case 'focusUser':
        return sm.focusUser();
      case 'showRoute':
        return sm.showRoute(msg.segments, msg.extraBottom ?? 0);
      case 'clearRoute':
        return sm.showRoute([]);
    }
  };

  const handle = (msg: ToMap) => {
    try {
      if (msg.type !== 'init') return run(msg);
      void loadMapFonts(opts.fontSrc).then(() => {
        sm = new StadiumMap({
          container: opts.container,
          data: msg.data,
          styles: msg.styles,
          theme: msg.theme,
          level: msg.level,
          reducedMotion: msg.reducedMotion,
          emit: (m) => {
            emit(m);
            if (m.type === 'ready') pending.splice(0).forEach(run);
          },
          preserveDrawingBuffer: opts.preserveDrawingBuffer,
        });
      });
    } catch (e) {
      emit({ type: 'error', message: String((e as Error)?.message ?? e) });
    }
  };

  const onMessage = (e: Event) => {
    const raw = (e as MessageEvent).data;
    if (typeof raw !== 'string') return;
    try {
      handle(JSON.parse(raw) as ToMap);
    } catch {
      /* mensagem que não é do app */
    }
  };
  window.addEventListener('message', onMessage);
  document.addEventListener('message', onMessage);
  emit({ type: 'loaded' });

  return { handle, map: () => sm };
}
