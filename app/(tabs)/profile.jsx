import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Alert } from 'react-native';
import { account, databases, config } from '../../lib/appwrite';
import { Query } from 'react-native-appwrite';


const ProfileScreen = () => {
  const { user, loading, setIsLoggedIn, setUser } = useGlobalContext();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState([]);

  const fetchRegisteredEvents = async () => {
    try {
      console.log('Fetching events for account: 674dccbd00243b4ac579'); // Debug log
      
      const bookings = await databases.listDocuments(
        config.databaseId,
        config.bookingCollectionId,
        [Query.equal('accountId', '674dccbd00243b4ac579')]
      );

      console.log('Bookings found:', bookings.documents.length); // Debug log

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
      console.log('Valid events:', validEvents);
    } catch (error) {
      console.error('Error fetching registered events:', error);
    }
  };

  // Add refresh control handler
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchRegisteredEvents();
    setRefreshing(false);
  }, []);

  // Auto refresh when component mounts or when user changes
  useEffect(() => {
    if (user) {
      fetchRegisteredEvents();
    }
  }, [user]);

  // Add focus effect to refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchRegisteredEvents();
      }
    }, [user])
  );

  const userInfo = [
    { label: 'Student ID', value: user?.studentID || 'Not set', key: 'studentID', editable: false },  // studentID is not editable
    { label: 'Full Name', value: user?.fullName || 'Not set', key: 'fullName', editable: true },
    { label: 'Email', value: user?.email || 'Not set', key: 'email', editable: true },
    { label: 'Phone', value: user?.phone || 'Not set', key: 'phone', editable: true },
    { label: 'Address', value: user?.address || 'Not set', key: 'address', editable: true }
  ];

  const handleEdit = () => {
    console.log('Edit button pressed');
    try {
        router.push({
            pathname: "/(stack)/editProfile",
            params: { 
                id: user?.$id,
                fullName: user?.fullName || '',
                email: user?.email || '',
                phone: user?.phone || '',
                address: user?.address || ''
            }
        });
    } catch (error) {
        console.error('Navigation error:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await account.deleteSession('current');
              setIsLoggedIn(false);
              setUser(null);
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  // Sample data structure for activities
  const sampleActivities = [
    {
      activityName: "Career and Internship Fair 2.0",
      role: "Participant",
      ga1: 2,
      ga2: 1,
      ga3: 0,
      ga4: 0,
      ga5: 0,
      ga6: 0,
      ga7: 2,
      ga8: 0,
      level: 3,
      totalScore: 15
    },
    // Add more activities as needed
  ];

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#161622]">
        <ActivityIndicator size="large" color="#FF9C01" />
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-[#161622]"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FF9C01"
          colors={["#FF9C01"]}
        />
      }
    >
      <View className="p-4 mt-12">
        {/* Profile Header with Logout Button */}
        <View className="items-center mb-6 relative">
          <TouchableOpacity 
            onPress={handleLogout}
            className="absolute right-0 top-0 bg-[#232533] p-2 rounded-full"
          >
            <MaterialIcons name="logout" size={24} color="#FF9C01" />
          </TouchableOpacity>

          <View className="w-24 h-24 rounded-full bg-[#232533] mb-3" />
          <Text className="font-[Poppins-Bold] text-xl text-white">
            {user?.fullName || 'User Name'}
          </Text>
        </View>

        {/* Profile Information */}
        <View className="space-y-4 mb-6">
          {userInfo.map((info) => (
            <View 
              key={info.key} 
              className="flex-row justify-between items-center bg-[#232533] p-4 rounded-lg"
            >
              <View>
                <Text className="font-[Poppins-Medium] text-gray-400">{info.label}</Text>
                <Text className="font-[Poppins-Regular] text-white">{info.value}</Text>
              </View>
              {info.editable && (
                <TouchableOpacity onPress={handleEdit}>
                  <MaterialIcons name="edit" size={24} color="#FF9C01" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Registered Events Section */}
        <View className="mt-4">
          <Text className="font-[Poppins-Bold] text-xl text-white mb-4">
            Registered Events
          </Text>
          <View className="space-y-3">
            {registeredEvents.map((event) => (
              <TouchableOpacity 
                key={event.bookingId}
                className="bg-[#232533] p-4 rounded-lg"
                onPress={() => router.push(`/eventDetails/${event.eventId}`)}
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="font-[Poppins-Medium] text-white">
                      {event.title}
                    </Text>
                    <Text className="font-[Poppins-Regular] text-gray-400">
                      Location: {event.location}
                    </Text>
                    <Text className="font-[Poppins-Regular] text-gray-400">
                      Registered: {new Date(event.registeredDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#FF9C01" />
                </View>
              </TouchableOpacity>
            ))}
            {registeredEvents.length === 0 && (
              <Text className="text-gray-400 text-center">
                No registered events found
              </Text>
            )}
          </View>
        </View>

        {/* Activities Summary Table */}
        <View className="mt-6">
          <Text className="font-[Poppins-Bold] text-xl text-white mb-4">
            Activities Summary
          </Text>
          
          {/* Table Header */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Header Row */}
              <View className="flex-row bg-[#232533] p-2">
                <Text className="text-white font-[Poppins-Medium] w-40">Activity Name</Text>
                <Text className="text-white font-[Poppins-Medium] w-32">Role</Text>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <Text key={num} className="text-white font-[Poppins-Medium] w-12 text-center">
                    GA{num}
                  </Text>
                ))}
                <Text className="text-white font-[Poppins-Medium] w-20 text-center">Total</Text>
              </View>

              {/* Data Rows */}
              {sampleActivities.map((activity, index) => (
                <View 
                  key={index} 
                  className={`flex-row ${
                    index % 2 === 0 ? 'bg-[#1E1E2D]' : 'bg-[#232533]'
                  } p-2`}
                >
                  <Text className="text-white font-[Poppins-Regular] w-40" numberOfLines={2}>
                    {activity.activityName}
                  </Text>
                  <Text className="text-white font-[Poppins-Regular] w-32">
                    {activity.role}
                  </Text>
                  <Text className="text-white font-[Poppins-Regular] w-12 text-center">
                    {activity.ga1 || '-'}
                  </Text>
                  <Text className="text-white font-[Poppins-Regular] w-12 text-center">
                    {activity.ga2 || '-'}
                  </Text>
                  <Text className="text-white font-[Poppins-Regular] w-12 text-center">
                    {activity.ga3 || '-'}
                  </Text>
                  <Text className="text-white font-[Poppins-Regular] w-12 text-center">
                    {activity.ga4 || '-'}
                  </Text>
                  <Text className="text-white font-[Poppins-Regular] w-12 text-center">
                    {activity.ga5 || '-'}
                  </Text>
                  <Text className="text-white font-[Poppins-Regular] w-12 text-center">
                    {activity.ga6 || '-'}
                  </Text>
                  <Text className="text-white font-[Poppins-Regular] w-12 text-center">
                    {activity.ga7 || '-'}
                  </Text>
                  <Text className="text-white font-[Poppins-Regular] w-12 text-center">
                    {activity.ga8 || '-'}
                  </Text>
                  <Text className="text-white font-[Poppins-Medium] w-20 text-center">
                    {activity.totalScore}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;