import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Alert, BackHandler, View, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

const INITIAL_URL = 'https://ak.gryphline.com/user/visit';
const ENDPOINT_URL = 'https://arknights-txwy-gacha.web.app/login';
const WEB_URL = 'https://arknights-txwy-gacha.web.app/';

export default function Index() {
  const webviewRef = useRef(null);
  const [hasIntercepted, setHasIntercepted] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Home'); // 'Home' | 'Capture' | 'Website'

  useEffect(() => {
    const backAction = () => {
      // 如果不在起始頁，則回起始頁
      if (currentScreen !== 'Home') {
        setCurrentScreen('Home');
        return true; // 攔截事件，阻止預設行為 (不退出App)
      }
      // 如果在起始頁，則退出
      return false; // 不攔截，讓系統退出App
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [currentScreen]);

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
    if (currentScreen !== 'Capture') return;

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

  const renderHome = () => {
    return (
      <View style={styles.homeContainer}>
        <View style={styles.titleWrapper}>
          <Text style={styles.titleText}>明日方舟繁中服尋訪紀錄分析</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => {
              setHasIntercepted(false);
              setCurrentScreen('Capture');
            }}
          >
            <Text style={styles.primaryButtonText}>開始抓取紀錄</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => setCurrentScreen('Website')}
          >
            <Text style={styles.secondaryButtonText}>前往分析網站</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {currentScreen === 'Home' && renderHome()}

      {currentScreen === 'Capture' && (
        <WebView 
          ref={webviewRef}
          source={{ uri: INITIAL_URL }} 
          style={styles.webview}
          injectedJavaScript={injectedJavascript}
          onMessage={onMessage}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
        />
      )}

      {currentScreen === 'Website' && (
        <WebView 
          source={{ uri: WEB_URL }} 
          style={styles.webview}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  homeContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  titleWrapper: {
    marginVertical: 45,
    paddingVertical: 35,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    // 試圖還原 HgfD8Q 的科技感框線感
    borderTopColor: '#1bd1fe',
    borderBottomColor: '#1bd1fe',
    backgroundColor: 'rgba(10, 10, 10, 0.6)',
  },
  titleText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 20,
  },
  primaryButton: {
    backgroundColor: '#1bd1fe',
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
    shadowColor: '#1bd1fe',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#1bd1fe',
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1bd1fe',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
