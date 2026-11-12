import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import mapHtml from '../../../map/build/mapHtml';
import type { FromMap, ToMap } from '../../../map/web/protocol';
import type { StadiumMapHandle } from './StadiumMapView';

export type { StadiumMapHandle } from './StadiumMapView';

/** Versão web (verificação visual): o mesmo HTML num iframe, com a mesma troca de mensagens. */
export const StadiumMapView = forwardRef<
  StadiumMapHandle,
  { onMessage: (msg: FromMap) => void; background: string }
>(function StadiumMapView({ onMessage, background }, ref) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const handler = useRef(onMessage);
  handler.current = onMessage;
  useImperativeHandle(ref, () => ({
    send: (msg: ToMap) => frame.current?.contentWindow?.postMessage(JSON.stringify(msg), '*'),
  }));
  useEffect(() => {
    const listen = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== 'string') return;
      try {
        handler.current(JSON.parse(e.data) as FromMap);
      } catch {
        /* outra mensagem */
      }
    };
    window.addEventListener('message', listen);
    return () => window.removeEventListener('message', listen);
  }, []);
  return createElement('iframe', {
    ref: frame,
    srcDoc: mapHtml,
    title: 'Mapa do estádio',
    style: { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, background },
  });
});
