import React, { useRef, useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

const INITIAL_URL = 'https://ak.gryphline.com/user/visit';
const ENDPOINT_URL = 'https://arknights-txwy-gacha.web.app/login';

export default function Index() {
  const webviewRef = useRef(null);
  const [hasIntercepted, setHasIntercepted] = useState(false);

  const injectedJavascript = `
    (function() {
      if (window.__GachaCaptureRunning) return;
      window.__GachaCaptureRunning = true;
      
      let pollInterval = setInterval(() => {
        try {
          const cookieMatch = document.cookie.match(/(?:(?:^|.*;\\s*)ak-user-tw\\s*\\=\\s*([^;]*).*$)|^.*$/);
          const akUserTwToken = cookieMatch ? cookieMatch[1] : null;

          const roleMeta = window.localStorage.getItem('ONE_ACCOUNT_ROLE_META');
          let roleToken = null;
          if (roleMeta) {
              const metaJson = JSON.parse(roleMeta);
              roleToken = metaJson.token;
          }

          if (akUserTwToken && roleToken) {
              clearInterval(pollInterval);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'TOKENS_FOUND',
                  cookie: akUserTwToken,
                  token: roleToken
              }));
          }
        } catch (e) {}
      }, 1000);
    })();
    true;
  `;

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'TOKENS_FOUND' && !hasIntercepted) {
        console.log('Got tokens:', data);
        setHasIntercepted(true);
        Alert.alert('攔截成功', '已取得 Token 與 Cookie！即將導向分析頁面...');

        const postScript = `
          var form = document.createElement("form");
          form.method = "POST";
          form.action = "${ENDPOINT_URL}";
          
          var cookieField = document.createElement("input");
          cookieField.type = "hidden";
          cookieField.name = "cookie";
          cookieField.value = "${data.cookie}";
          form.appendChild(cookieField);

          var tokenField = document.createElement("input");
          tokenField.type = "hidden";
          tokenField.name = "token";
          tokenField.value = "${data.token}";
          form.appendChild(tokenField);

          var methodField = document.createElement("input");
          methodField.type = "hidden";
          methodField.name = "method";
          methodField.value = "cookie";
          form.appendChild(methodField);

          document.body.appendChild(form);
          form.submit();
        `;
        webviewRef.current.injectJavaScript(postScript);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WebView 
        ref={webviewRef}
        source={{ uri: INITIAL_URL }} 
        style={styles.webview}
        injectedJavaScript={injectedJavascript}
        onMessage={onMessage}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
});
