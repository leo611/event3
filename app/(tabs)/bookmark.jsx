import { View, Text, FlatList, RefreshControl, TouchableOpacity, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Query } from 'react-native-appwrite';
import { databases, storage,config } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';
import { images } from '../../constants';
import { Ionicons } from '@expo/vector-icons';
import EventRectangle from '../../components/EventRectangle';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Bookmark = () => {
  const router = useRouter();
  const { user, updateEventRegistrationCount, eventRegistrations } = useGlobalContext();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  // Notification functions
  const requestPermissions = async () => {
    try {
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
          alert('Failed to get notification permissions!');
          return false;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const scheduleEventReminder = async (event) => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        console.log('No notification permissions');
        return null;
      }

      const eventDate = new Date(event.date);
      const today = new Date();

      // Check if event is today
      if (eventDate.toDateString() === today.toDateString()) {
        // Schedule morning reminder (9 AM)
        const morningReminder = new Date(eventDate);
        morningReminder.setHours(9, 0, 0, 0);

        // Only schedule if it's before 9 AM
        if (today < morningReminder) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Event Today!',
              body: `Don't forget: ${event.title} is happening today!`,
              data: { eventId: event.eventId },
            },
            trigger: {
              date: morningReminder,
            },
          });
          console.log('Morning reminder scheduled for:', event.title);
        }

        // Schedule reminder 1 hour before event
        const oneHourBefore = new Date(eventDate.getTime() - (1 * 60 * 60 * 1000));
        if (today < oneHourBefore) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Event Starting Soon!',
              body: `${event.title} starts in 1 hour!`,
              data: { eventId: event.eventId },
            },
            trigger: {
              date: oneHourBefore,
            },
          });
          console.log('1-hour reminder scheduled for:', event.title);
        }

        // Schedule reminder at event start time
        if (today < eventDate) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Event Starting Now!',
              body: `${event.title} is starting now at ${event.location}!`,
              data: { eventId: event.eventId },
            },
            trigger: {
              date: eventDate,
            },
          });
          console.log('Start time reminder scheduled for:', event.title);
        }
      }
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return null;
    }
  };

  const fetchRegisteredEvents = async () => {
    if (!user?.$id) {
      console.log('No user ID available');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching registered events for user:', user.$id);
      
      const bookings = await databases.listDocuments(
        config.databaseId,
        config.bookingCollectionId,
        [
          Query.equal('accountId', user.$id)
        ]
      );

      console.log('Bookings found:', bookings.documents.length);

      const eventsWithDetails = await Promise.all(
        bookings.documents.map(async (booking) => {
          try {
            const event = await databases.getDocument(
              config.databaseId,
              config.eventCollectionId,
              booking.eventId
            );
            

             // Schedule reminder for this event
             await scheduleEventReminder({
              eventId: event.$id,
              title: event.title || 'Untitled Event',
              date: event.date,
              location: event.location || 'No location specified'
            });
            
            // Get the current registration count for this event
            const eventBookings = await databases.listDocuments(
              config.databaseId,
              config.bookingCollectionId,
              [
                Query.equal('eventId', event.$id),
               // Query.equal('status', 'active')  // Only count active bookings
              ]
            );

            // Get image URL if exists
            let imageUrl = null;
            if (event.image && !event.image.startsWith('file://')) {
              try {
                const imageResponse = await storage.getFilePreview(
                  config.bucketId,
                  event.image
                );
                imageUrl = imageResponse.href;
              } catch (imageError) {
                console.error('Error fetching image:', imageError);
              }
            }

            const currentRegisteredCount = eventBookings.documents.length;

            const eventData = {
              bookingId: booking.$id,
              eventId: event.$id,
              title: event.title || 'Untitled Event',
              image: imageUrl || event.image,
              date: event.date,
              location: event.location || 'No location specified',
              description: event.description || '',
              capacity: event.capacity || 10,
              gaPoint: event.gaPoint || '',
              registeredCount: currentRegisteredCount,  // Use the actual count
              bookingStatus: booking.status || 'active'
            };

            console.log('Event registration count:', currentRegisteredCount);
            return eventData;
          } catch (error) {
            console.error('Error fetching event details:', error);
            return null;
          }
        })
      );

      const validEvents = eventsWithDetails.filter(event => event !== null);
      setRegisteredEvents(validEvents);
    } catch (error) {
      console.error('Error fetching registered events:', error);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRegisteredEvents();
  }, [user]);

  // Refresh on screen focus
  useFocusEffect(
    React.useCallback(() => {
      fetchRegisteredEvents();
    }, [user])
  );

  // Update counts when global registration counts change
  useEffect(() => {
    if (registeredEvents.length > 0 && eventRegistrations) {
      const updatedEvents = registeredEvents.map(event => ({
        ...event,
        registeredCount: eventRegistrations[event.$id] || event.registeredCount || 0
      }));
      setRegisteredEvents(updatedEvents);
    }
  }, [eventRegistrations]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchRegisteredEvents();
    setRefreshing(false);
  }, []);

  const handleCancelRegistration = async (bookingId, eventId) => {
    try {
      await databases.deleteDocument(
        config.databaseId,
        config.bookingCollectionId,
        bookingId
      );

      console.log("Booking cancelled successfully");
  
      // Get updated registration count
      const eventBookings = await databases.listDocuments(
        config.databaseId,
        config.bookingCollectionId,
        [Query.equal('eventId', eventId)]
      );
  
      const newCount = eventBookings.documents.length;
  
      // Update global state with new count
      await updateEventRegistrationCount(eventId);
  
      // Update local state
      setRegisteredEvents(prev => 
        prev.filter(event => event.bookingId !== bookingId)
      );
  
      Alert.alert(
        "Success",
        "Your registration has been cancelled successfully"
      );
  
      await fetchRegisteredEvents();
  
    } catch (error) {
      console.error('Error cancelling registration:', error);
      Alert.alert(
        "Error",
        "Failed to cancel registration. Please try again."
      );
    }
  };

  const handleEventPress = (event) => {
    router.push({
      pathname: "/(stack)/eventDetails/[id]",
      params: {
        id: event.eventId,
        title: event.title,
        image: event.image,
        eventImage: event.eventImage,
        date: event.date,
        location: event.location,
        description: event.description || '',
        capacity: event.capacity || 0,
        gaPoint: event.gaPoint || '',
        registeredCount: event.registeredCount || 0
      }
    });
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-4">
      <Image
        source={images.logoSmall}
        className="w-20 h-20 mb-4"
        resizeMode="contain"
      />
      <Text className="text-white text-xl font-psemibold mb-2 text-center">
        {!user ? "Please Login" : "No Registered Events"}
      </Text>
      <Text className="text-gray-400 text-center mb-8">
        {!user 
          ? "Login to see your registered events" 
          : "You haven't registered for any events yet"}
      </Text>
      <TouchableOpacity
        className="bg-orange-500 py-4 px-8 rounded-lg w-full"
        onPress={() => !user ? router.push('/(auth)/login') : router.push("/")}
      >
        <Text className="text-white text-center text-lg font-psemibold">
          {!user ? "Login" : "Register Event"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const scrollToTop = () => {
    scrollRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Add this useEffect to monitor state changes
  useEffect(() => {
    console.log('Registered events state updated:', registeredEvents);
  }, [registeredEvents]);

  const renderItem = ({ item }) => (
    <EventRectangle
      imageUrl={item.image}
      title={item.title || 'Untitled Event'}
      date={item.date}
      location={item.location}
      gaPoint={item.gaPoint}
      capacity={item.capacity}
      registeredCount={item.registeredCount}
      showStatus={true}
      status={item.bookingStatus}
      onPress={() => handleEventPress(item)}
      onCancelRegistration={() => handleCancelRegistration(item.bookingId, item.eventId)}
      style={{ marginVertical: 6 }}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1">
        <View className="p-4 border-b border-gray-800">
          <Text className="text-white text-xl font-psemibold">
            My Registered Events
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FFA500" />
            <Text className="text-white mt-4">Loading events...</Text>
          </View>
        ) : error ? (
          <View className="p-4 bg-red-500/20 m-4 rounded-lg">
            <Text className="text-white text-center">{error}</Text>
          </View>
        ) : registeredEvents.length > 0 ? (
          <FlatList
            ref={scrollRef}
            data={registeredEvents}
            renderItem={renderItem}
            keyExtractor={(item) => item.bookingId}
            contentContainerStyle={{ 
              paddingVertical: 12,
              paddingBottom: 100
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#FFA500"]}
                tintColor="#FFA500"
              />
            }
          />
        ) : (
          renderEmptyState()
        )}

        {registeredEvents.length > 5 && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              right: 20,
              bottom: 90,
              backgroundColor: '#FFA500',
              borderRadius: 30,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}
            onPress={scrollToTop}
          >
            <Ionicons name="arrow-up" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Bookmark;