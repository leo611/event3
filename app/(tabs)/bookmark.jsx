import { View, Text, FlatList, RefreshControl, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Query } from 'react-native-appwrite';
import { databases } from '../../lib/appwrite';
import { config } from '../../lib/appwrite';
import EventRectangle from '../../components/EventRectangle';
import { useGlobalContext } from '../../context/GlobalProvider';
import { images } from '../../constants';
import { Ionicons } from '@expo/vector-icons';

const Bookmark = () => {
  const router = useRouter();
  const { user, updateEventRegistrationCount, eventRegistrations } = useGlobalContext();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const fetchRegisteredEvents = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      const userId = user?.accountId ;

      // Get the bookings
      const bookingsResponse = await databases.listDocuments(
        config.databaseId,
        config.bookingCollectionId,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt')
        ]
      );

      if (!bookingsResponse?.documents) {
        setRegisteredEvents([]);
        setError("No bookings found");
        return;
      }

      // Get all unique event IDs
      const eventIds = [...new Set(bookingsResponse.documents.map(booking => booking.eventId))];

      // For each event, count total bookings
      const registrationCounts = {};
      
      for (const eventId of eventIds) {
        const eventBookings = await databases.listDocuments(
          config.databaseId,
          config.bookingCollectionId,
          [Query.equal('eventId', eventId)]
        );
        registrationCounts[eventId] = eventBookings.documents.length;
      }

      console.log("Registration counts:", registrationCounts);

      const eventsWithDetails = bookingsResponse.documents.map(booking => ({
        $id: booking.eventId,
        title: booking.eventTitle || 'Event Title Not Available',
        image: booking.eventImage || null,
        date: booking.eventDate || booking.$createdAt,
        location: booking.eventLocation || 'Location Not Available',
        bookingStatus: booking.status || 'confirmed',
        bookingId: booking.$id,
        gaPoint: booking.gaPoint || '',
        capacity: booking.capacity || 0,
        registeredCount: registrationCounts[booking.eventId] || 0,
        createdAt: booking.$createdAt
      }));

      console.log("Events with details:", eventsWithDetails);
      setRegisteredEvents(eventsWithDetails);
      setError(null);

    } catch (error) {
      console.error('Error fetching registered events:', error);
      setError('Failed to fetch your registered events');
      setRegisteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh when component mounts
  useEffect(() => {
    if (user) {
      fetchRegisteredEvents();
    }
  }, [user]);

  // Auto refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchRegisteredEvents();
      }
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRegisteredEvents();
    setRefreshing(false);
  };

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
        id: event.$id,
        title: event.title,
        image: event.image,
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
            <Text className="text-white">Loading...</Text>
            <Text className="text-gray-400 text-sm mt-2">
              User ID: {user?.accountId || 'Not logged in'}
            </Text>
          </View>
        ) : error ? (
          <View className="p-4 bg-red-500/20 m-4 rounded-lg">
            <Text className="text-white text-center">{error}</Text>
          </View>
        ) : registeredEvents.length > 0 ? (
          <FlatList
            ref={scrollRef}
            data={registeredEvents}
            renderItem={({ item }) => (
              <EventRectangle
                imageUrl={item.image}
                title={item.title}
                date={item.date}
                location={item.location}
                gaPoint={item.gaPoint}
                capacity={item.capacity}
                registeredCount={item.registeredCount}
                showStatus={true}
                status={item.bookingStatus}
                onPress={() => handleEventPress(item)}
                onCancelRegistration={() => handleCancelRegistration(item.bookingId, item.$id)}
                style={{ marginVertical: 6 }}
              />
            )}
            keyExtractor={(item) => item.bookingId || item.$id}
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