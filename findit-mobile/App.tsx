import 'react-native-gesture-handler';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useNotificationsStore } from './src/store/notifications.store';
import { navigationRef } from './src/navigation/navigationRef';
import { useChatStore } from './src/store/chat.store';

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/auth.store';
import SocketService from './src/services/socket.service';
import { getAccessToken } from './src/utils/tokenStorage';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const requestPermission = useNotificationsStore((s) => s.requestPermission);
  const registerToken = useNotificationsStore((s) => s.registerToken);
  const addMessage = useChatStore((s) => s.addMessage);

  useEffect(() => {
    let isMounted = true;
    const connectSocket = async () => {
      if (isAuthenticated) {
        const token = await getAccessToken();
        if (token && isMounted) {
          SocketService.connect(token);
        }
      } else {
        SocketService.disconnect();
      }
    };
    connectSocket();
    return () => {
      isMounted = false;
      SocketService.disconnect();
    };
  }, [isAuthenticated]);

  // Notifications push : handler + listeners
  useEffect(() => {
    Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

    // Demander la permission et enregistrer le token après login
    if (isAuthenticated) {
      requestPermission().then(registerToken);
    }

    // Listener notification reçue en foreground
    const sub1 = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      if (data?.type === 'new_message' && data.message) {
        addMessage(data.message as any);
      }
    });

    // Listener tap sur notification
    const sub2 = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (!data) return;
      if (data.type === 'new_message' && data.conversation_id) {
        (navigationRef.navigate as any)('ChatScreen', { conversationId: String(data.conversation_id) });
      } else if (data.type === 'conversation_request' && data.conversation_id) {
        (navigationRef.navigate as any)('ChatScreen', { conversationId: String(data.conversation_id) });
      } else if (data.type === 'match_found' && data.report_id) {
        (navigationRef.navigate as any)('ReportDetailScreen', { reportId: String(data.report_id) });
      } else if (data.type === 'review_request' && data.conversation_id) {
        (navigationRef.navigate as any)('ChatScreen', { conversationId: String(data.conversation_id), showReviewModal: true });
      }
    });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, [isAuthenticated, requestPermission, registerToken, addMessage]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
