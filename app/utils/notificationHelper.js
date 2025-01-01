import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  return token;
}

export async function scheduleEventReminder(event) {
  try {
    const eventDate = new Date(event.date);
    const twoHoursBefore = new Date(eventDate.getTime() - (2 * 60 * 60 * 1000));

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Event Reminder',
        body: `${event.title} starts in 2 hours!`,
        data: { eventId: event.eventId },
      },
      trigger: {
        date: twoHoursBefore,
      },
    });

    console.log('Reminder scheduled:', identifier);
    return identifier;
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return null;
  }
} 