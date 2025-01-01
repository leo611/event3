import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { databases, config } from '../../lib/appwrite';
import { Query } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

const ScoringScreen = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      // Fetch all events
      const response = await databases.listDocuments(
        config.databaseId,
        config.eventCollectionId,
        [Query.orderDesc('$createdAt')]
      );

      // For each event, fetch participants
      const eventsWithParticipants = await Promise.all(
        response.documents.map(async (event) => {
          try {
            // Get bookings for this event
            const bookings = await databases.listDocuments(
              config.databaseId,
              config.bookingCollectionId,
              [Query.equal('eventId', event.$id)]
            );

            // Get user details for each booking
            const participantsDetails = await Promise.all(
              bookings.documents.map(async (booking) => {
                try {
                  const userResponse = await databases.listDocuments(
                    config.databaseId,
                    config.userCollectionId,
                    [Query.equal('accountId', booking.userId)]
                  );
                  
                  if (userResponse.documents.length > 0) {
                    return userResponse.documents[0];
                  }
                  return null;
                } catch (error) {
                  console.log('Error fetching user:', error);
                  return null;
                }
              })
            );

            // Filter out null values and return event with valid participants
            return {
              ...event,
              participants: participantsDetails.filter(p => p !== null)
            };
          } catch (error) {
            console.log('Error fetching bookings:', error);
            return {
              ...event,
              participants: []
            };
          }
        })
      );

      setEvents(eventsWithParticipants);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEvents();
    }, [])
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#161622]">
        <ActivityIndicator size="large" color="#FF9C01" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#161622]">
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-white text-xl font-psemibold mb-6">
            Event Scoring
          </Text>

          {events.map((event) => (
            <View key={event.$id} className="bg-[#232533] p-4 rounded-lg mb-3">
              <Text className="text-white font-pmedium text-lg mb-2">
                {event.title}
              </Text>
              <Text className="text-gray-400 font-pregular mb-2">
                Date: {new Date(event.date).toLocaleDateString()}
              </Text>
              
              <Text className="text-[#FF9C01] font-pmedium mt-2 mb-2">
                Participants ({event.participants?.length || 0}):
              </Text>
              
              {event.participants?.map((participant) => (
                participant && (
                  <TouchableOpacity
                    key={participant.$id}
                    className="bg-[#161622] p-3 rounded-lg mb-2"
                    onPress={() => router.push({
                      pathname: "/(stack)/scoringForm",
                      params: { 
                        eventId: event.$id,
                        eventTitle: event.title,
                        studentId: participant.studentID || '',
                        accountId: participant.accountId || '',
                        participantName: participant.fullName || participant.studentID || 'Unknown'
                      }
                    })}
                  >
                    <Text className="text-white font-pmedium">
                      {participant.fullName || participant.studentID || 'Unknown Participant'}
                    </Text>
                    <Text className="text-gray-400 font-pregular">
                      Student ID: {participant.studentID || 'N/A'}
                    </Text>
                  </TouchableOpacity>
                )
              ))}

              {(!event.participants || event.participants.length === 0) && (
                <Text className="text-gray-400 text-center font-pregular">
                  No participants yet
                </Text>
              )}
            </View>
          ))}

          {events.length === 0 && (
            <Text className="text-gray-400 text-center font-pregular">
              No events found
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScoringScreen;