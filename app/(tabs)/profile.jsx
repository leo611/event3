import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Image, Alert, SafeAreaView } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { account, databases, config } from '../../lib/appwrite';
import { Query } from 'react-native-appwrite';

const ProfileScreen = () => {
  const scrollViewRef = useRef(null);
  const { user, setUser, checkUser } = useGlobalContext();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState([]);
  const [summary, setSummary] = useState({
    totalEvents: 0,
    totalScore: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0
  });

  const fetchScores = async () => {
    try {
      if (!user?.$id) {
        console.log('No account ID available');
        setScores([]);
        setSummary({
          totalEvents: 0,
          totalScore: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0
        });
        return;
      }

      console.log('Fetching scores for accountId:', user.$id);
      
      const response = await databases.listDocuments(
        config.databaseId,
        config.activityScoresCollectionId,
        [
          Query.equal('accountId', [user.$id])
        ]
      );

      console.log('Raw scores data:', response.documents);

      if (!response.documents || response.documents.length === 0) {
        console.log('No scores found');
        setScores([]);
        setSummary({
          totalEvents: 0,
          totalScore: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0
        });
        return;
      }

      setScores(response.documents);

      // Calculate summary from the scores using totalScore field
      const scores = response.documents.map(doc => Number(doc.totalScore) || 0);
      console.log('Processed scores:', scores);

      const summary = {
        totalEvents: response.documents.length,
        totalScore: scores.reduce((sum, score) => sum + score, 0),
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
      };
      
      summary.averageScore = summary.totalScore / summary.totalEvents;

      console.log('Calculated summary:', summary);
      setSummary(summary);

    } catch (error) {
      console.error('Error in fetchScores:', error);
      setScores([]);
      setSummary({
        totalEvents: 0,
        totalScore: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0
      });
    }
  };

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user?.$id) return;
      
      setLoading(true);
      try {
        await Promise.all([
          fetchScores(),
          fetchRegisteredEvents()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user?.$id]); // Only depend on user.$id

  // Screen focus refresh
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        if (!user?.$id || loading) return; // Skip if already loading

        try {
          await checkUser();
          if (isActive) {
            await Promise.all([
              fetchScores(),
              fetchRegisteredEvents()
            ]);
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      };

      loadData();

      return () => {
        isActive = false;
      };
    }, [user?.$id, loading]) // Add loading to dependencies
  );

  // Pull to refresh
  const onRefresh = React.useCallback(async () => {
    if (!user?.$id) return;
    
    setRefreshing(true);
    try {
      await Promise.all([
        checkUser(),
        fetchScores(),
        fetchRegisteredEvents()
      ]);
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.$id]);

  const fetchRegisteredEvents = async () => {
    if (!user?.$id) {
      console.log('No user ID available');
      return;
    }

    try {
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
            return {
              bookingId: booking.$id,
              eventId: event.$id,
              title: event.title,
              date: event.date,
              location: event.location || 'Location Not Available',
              gaPoint: event.gaPoint || '',
              registeredCount: event.registeredCount || 0,
              registeredDate: booking.$createdAt,
              capacity: event.capacity
            };
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
    }
  };

  // Profile specific function
  const fetchUserEvents = async () => {
    if (!user?.$id) return;
    
    try {
      const bookings = await databases.listDocuments(
        config.databaseId,
        config.bookingCollectionId,
        [
          Query.equal('userid', user.$id)
        ]
      );

      // Profile specific processing
      // ...
    } catch (error) {
      console.error('Profile Error:', error);
    }
  };

  const userInfo = [
    { label: 'Student ID', value: user?.studentID || 'Not set', key: 'studentID', editable: false },
    { label: 'Full Name', value: user?.name || 'Not set', key: 'fullName', editable: true },
    { label: 'Email', value: user?.email || 'Not set', key: 'email', editable: true },
    { label: 'Phone', value: user?.phone || 'Not set', key: 'phone', editable: true },
    { label: 'Address', value: user?.address || 'Not set', key: 'address', editable: true }
  ];

  const handleEdit = () => {
    try {
      router.push({
        pathname: "/(stack)/editProfile",
        params: { 
          id: user?.$id,
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          address: user?.address || ''
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const renderScoreCard = (score) => {
    const gaPoints = [
      score.ga1 || 0,
      score.ga2 || 0,
      score.ga3 || 0,
      score.ga4 || 0,
      score.ga5 || 0,
      score.ga6 || 0,
      score.ga7 || 0,
      score.ga8 || 0
    ];

    return (
      <View key={score.$id} className="bg-[#232533] p-4 rounded-lg mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text numberOfLines={1} className="font-[Poppins-Medium] text-white text-lg flex-1 mr-2">
            {score.eventTitle || 'Untitled Event'}
          </Text>
          <View className="bg-[#FF9C01] px-3 py-1 rounded-full">
            <Text className="font-[Poppins-Bold] text-white">
              {`${score.totalScore || 0} pts`}
            </Text>
          </View>
        </View>

        {/* GA Points Grid */}
        <View className="flex-row flex-wrap justify-between mb-3">
          {gaPoints.map((point, index) => (
            <View key={index} className="w-[23%] bg-[#1E1E2D] p-2 rounded-lg mb-2">
              <Text className="font-[Poppins-Medium] text-gray-400 text-center text-xs">
                {`GA${index + 1}`}
              </Text>
              <Text className="font-[Poppins-Bold] text-white text-center mt-1">
                {`${point}`}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <Text className="font-[Poppins-Regular] text-gray-400">
            {`Level: ${score.level || 0}`}
          </Text>
          <Text className="font-[Poppins-Regular] text-gray-400">
            {score.dateAwarded ? new Date(score.dateAwarded).toLocaleDateString() : 'No date'}
          </Text>
        </View>
      </View>
    );
  };

  // Add calculate summary function
  const calculateSummary = (scoresArray) => {
    if (!Array.isArray(scoresArray) || scoresArray.length === 0) {
        return {
            totalEvents: 0,
            totalScore: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0
        };
    }

    try {
        const summary = {
            totalEvents: scoresArray.length,
            totalScore: scoresArray.reduce((sum, score) => sum + (Number(score.score) || 0), 0),
            highestScore: Math.max(...scoresArray.map(score => Number(score.score) || 0)),
            lowestScore: Math.min(...scoresArray.map(score => Number(score.score) || 0))
        };
        
        summary.averageScore = summary.totalScore / summary.totalEvents;
        
        return summary;
    } catch (error) {
        console.error('Error calculating summary:', error);
        return {
            totalEvents: 0,
            totalScore: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0
        };
    }
  };

  // Add this useEffect to debug user data
  useEffect(() => {
    if (user) {
      console.log('Current user:', {
        id: user.$id,
        name: user.name,
        email: user.email
      });
    }
  }, [user]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#161622' }}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF9C01" />
          <Text className="font-[Poppins-Regular] text-white mt-4">
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#161622' }}>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingBottom: 120
        }}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF9C01"
            colors={["#FF9C01"]}
          />
        }
      >
        <View className="px-4 pb-6">
          {/* Profile Header */}
          <View className="items-center mb-6 mt-12 relative">
            <TouchableOpacity 
              onPress={handleLogout}
              className="absolute right-0 top-0 bg-[#232533] p-2 rounded-full"
            >
              <MaterialIcons name="logout" size={24} color="#FF9C01" />
            </TouchableOpacity>

            <View className="w-24 h-24 rounded-full bg-[#232533] mb-3" />
            <Text className="font-[Poppins-Bold] text-xl text-white">
              {user?.name || 'User Name'}
            </Text>
          </View>

          {/* Summary Section */}
          <View className="mb-8">
            <Text className="font-[Poppins-Bold] text-xl text-white mb-4">
              Performance Summary
            </Text>
            
            <View className="bg-[#232533] p-4 rounded-lg">
              <View className="flex-row flex-wrap justify-between">
                {/* Total Events */}
                <View className="w-[48%] bg-[#1E1E2D] p-3 rounded-lg mb-3">
                  <Text className="font-[Poppins-Medium] text-gray-400 text-sm">
                    Total Events
                  </Text>
                  <Text className="font-[Poppins-Bold] text-white text-lg mt-1">
                    {summary.totalEvents}
                  </Text>
                </View>

                {/* Total Score */}
                <View className="w-[48%] bg-[#1E1E2D] p-3 rounded-lg mb-3">
                  <Text className="font-[Poppins-Medium] text-gray-400 text-sm">
                    Total Score
                  </Text>
                  <Text className="font-[Poppins-Bold] text-[#FF9C01] text-lg mt-1">
                    {summary.totalScore} pts
                  </Text>
                </View>

                {/* Average Score */}
                <View className="w-[48%] bg-[#1E1E2D] p-3 rounded-lg">
                  <Text className="font-[Poppins-Medium] text-gray-400 text-sm">
                    Average Score
                  </Text>
                  <Text className="font-[Poppins-Bold] text-white text-lg mt-1">
                    {summary.averageScore} pts
                  </Text>
                </View>

                {/* Highest Score */}
                <View className="w-[48%] bg-[#1E1E2D] p-3 rounded-lg">
                  <Text className="font-[Poppins-Medium] text-gray-400 text-sm">
                    Highest Score
                  </Text>
                  <Text className="font-[Poppins-Bold] text-green-500 text-lg mt-1">
                    {summary.highestScore} pts
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Registered Events Section */}
          <View className="mb-8">
            <Text className="font-[Poppins-Bold] text-xl text-white mb-4">
              Registered Events
            </Text>
            
            {registeredEvents.length > 0 ? (
              <View className="space-y-4">
                {registeredEvents.map((event) => (
                  <View key={event.bookingId} className="bg-[#232533] p-4 rounded-lg mb-4">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="font-[Poppins-Medium] text-white text-lg">
                        {event.title}
                      </Text>
                      <View className="bg-[#FF9C01] px-3 py-1 rounded-full">
                        <Text className="font-[Poppins-Bold] text-white">
                          {event.gaPoint}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center mt-2">
                      <Text className="font-[Poppins-Regular] text-gray-400">
                        Date: {new Date(event.date).toLocaleDateString()}
                      </Text>
                      <Text className="font-[Poppins-Regular] text-gray-400">
                        Location: {event.location}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-[#232533] p-4 rounded-lg">
                <Text className="font-[Poppins-Regular] text-gray-400 text-center">
                  No registered events
                </Text>
              </View>
            )}
          </View>

          {/* Activity Scores Section */}
          <View className="mb-8">
            <Text className="font-[Poppins-Bold] text-xl text-white mb-4">
              Activity Scores
            </Text>
            
            {scores.length > 0 ? (
              <View className="space-y-4">
                {scores.map(renderScoreCard)}
              </View>
            ) : (
              <View className="bg-[#232533] p-4 rounded-lg">
                <Text className="font-[Poppins-Regular] text-gray-400 text-center">
                  No activity scores available yet
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Scroll to Top Button */}
      {(scores.length > 3 || registeredEvents.length > 3) && (
        <TouchableOpacity
          onPress={scrollToTop}
          className="absolute bottom-8 right-6 bg-[#FF9C01] w-12 h-12 rounded-full items-center justify-center z-50"
          style={{
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}
        >
          <MaterialIcons name="keyboard-arrow-up" size={30} color="white" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default ProfileScreen;