import { forwardRef, useImperativeHandle, useRef, type ComponentType, type Ref } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';

import mapHtml from '../../../map/build/mapHtml';
import type { FromMap, ToMap } from '../../../map/web/protocol';

export interface StadiumMapHandle {
  send: (msg: ToMap) => void;
}

type WebViewInstance = { postMessage: (data: string) => void };
/** Os tipos publicados do react-native-webview 14 não fecham com o React 19; só o que usamos. */
const WebView = RNWebView as unknown as ComponentType<
  Record<string, unknown> & {
    ref?: Ref<WebViewInstance>;
    style?: StyleProp<ViewStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    onMessage?: (e: { nativeEvent: { data: string } }) => void;
  }
>;

/**
 * O mapa do estádio (MapLibre GL JS) numa WebView. Funciona no Expo Go: o HTML vem
 * embutido no app (map/build/mapHtml.js) e os dados chegam pela mensagem `init`.
 * Na web, o arquivo StadiumMapView.web.tsx usa um iframe com o mesmo HTML.
 */
export const StadiumMapView = forwardRef<
  StadiumMapHandle,
  { onMessage: (msg: FromMap) => void; background: string }
>(function StadiumMapView({ onMessage, background }, ref) {
  const web = useRef<WebViewInstance>(null);
  useImperativeHandle(ref, () => ({
    send: (msg) => web.current?.postMessage(JSON.stringify(msg)),
  }));
  return (
    <WebView
      ref={web}
      source={{ html: mapHtml, baseUrl: 'https://localhost/' }}
      originWhitelist={['*']}
      onMessage={(e) => {
        try {
          onMessage(JSON.parse(e.nativeEvent.data) as FromMap);
        } catch {
          /* mensagem que não é do mapa */
        }
      }}
      style={[StyleSheet.absoluteFill, { backgroundColor: background }]}
      containerStyle={{ backgroundColor: background }}
      // O mapa trata os próprios gestos (pinça, giro, inclinação).
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      setBuiltInZoomControls={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      accessibilityLabel="Mapa do estádio"
    />
  );
});
