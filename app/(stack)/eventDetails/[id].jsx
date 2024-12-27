import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { databases, account, config } from '../../../lib/appwrite';
import { ID, Query } from 'react-native-appwrite';
import { useGlobalContext } from '../../../context/GlobalProvider';  // Update this path

const EventDetails = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { updateEventRegistrationCount, getEventRegistrationCount } = useGlobalContext();
  const [isBooked, setIsBooked] = useState(false);
  const [capacity, setCapacity] = useState(params.capacity || 50);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { events } = useGlobalContext();

  
  // Use the global state count when available
  const currentRegistrationCount = events?.[params.id] || registeredCount;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  };

  useEffect(() => {
    const initializeData = async () => {
      await checkBookingStatus();
      const count = await updateEventRegistrationCount(params.id);
      setRegisteredCount(count);
      setIsLoading(false);
    };

    initializeData();
  }, [params.id]);

  const checkBookingStatus = async () => {
    try {
      const currentUser = await account.get();
      
      const bookings = await databases.listDocuments(
        config.databaseId,
        config.bookingCollectionId,
        [
          Query.equal('eventId', [params.id]),
          Query.equal('userId', [currentUser.$id])
        ]
      );
      setIsBooked(bookings.documents.length > 0);
    } catch (error) {
      console.error('Error checking booking status:', error);
    }
  };

  const handleNavigation = () => {
    router.back();
    setTimeout(() => {
      router.replace('/(tabs)/bookmark');
    }, 100);
  };

  const handleBooking = async () => {
    try {
      const currentUser = await account.get();
      
      if (!currentUser) {
        router.push('/(auth)/login');
        return;
      }

      Alert.alert(
        "Confirm Registration",
        "Would you like to register for this event?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Register",
            onPress: async () => {
              try {
                const bookingData = {
                  capacity: parseInt(params.capacity) || 50,
                  eventId: params.id,
                  userId: currentUser.$id,
                  eventTitle: params.title,
                  eventImage: params.image || '',
                  bookingDate: new Date().toISOString(),
                  gaPoint: params.gaPoint,
                  description: params.description,
                  eventLocation: params.location,
                  accountId: currentUser.$id
                };

                const booking = await databases.createDocument(
                  config.databaseId,
                  config.bookingCollectionId,
                  ID.unique(),
                  bookingData
                );

                setIsBooked(true);
                const newCount = await updateEventRegistrationCount(params.id);
                setRegisteredCount(newCount);
                
                Alert.alert(
                  "Success", 
                  "You have successfully registered!", 
                  [
                    {
                      text: "View My Bookings",
                      onPress: handleNavigation
                    }
                  ]
                );
              } catch (error) {
                console.error('Registration error:', error);
                Alert.alert("Error", "Failed to register for the event. Please try again.");
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Booking error:', error);
      router.push('/(auth)/login');
    }
  };

  // ... rest of the component remains the same ...
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back-circle" size={38} color="#FF9C01" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
        </View>

        {/* Event Image */}
        {params.image ? (
          <Image 
            source={{ uri: params.image }} 
            style={styles.image} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No Image Available</Text>
          </View>
        )}
        
        {/* Event Details */}
        <View style={styles.content}>
          <Text style={styles.title}>{params.title}</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoContainer}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoText}>
                {formatDate(params.date)}
              </Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>{params.location}</Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoIcon}>👥</Text>
              <Text style={styles.infoText}>
                {capacity - currentRegistrationCount} spots remaining
              </Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoIcon}>🎯</Text>
              <Text style={styles.infoText}>{params.gaPoint} </Text>
            </View>
          </View>

          {/* Capacity Bar */}
          <View style={styles.capacityContainer}>
            <View style={styles.capacityBar}>
              <View 
                style={[
                  styles.capacityFill, 
                  { width: `${(currentRegistrationCount / capacity) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.capacityText}>
              {currentRegistrationCount} / {capacity} registered
            </Text>
          </View>

          <Text style={styles.sectionTitle}>About Event</Text>
          <Text style={styles.description}>{params.description}</Text>

          {/* Register Button */}
          <TouchableOpacity 
            style={[
              styles.bookButton,
              isBooked && styles.bookedButton,
              registeredCount >= capacity && styles.fullButton
            ]}
            onPress={handleBooking}
            disabled={isBooked || registeredCount >= capacity}
          >
            <Text style={styles.bookButtonText}>
              {isBooked ? "Registered" : 
               registeredCount >= capacity ? "Event Full" : 
               "Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161622',
    paddingTop: StatusBar.currentHeight,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#161622',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#161622',
    height: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(35, 37, 51, 0.5)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFF',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 12,
  },
  image: {
    width: '100%',
    height: 250,
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: '#232533',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#232533',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
  },
  capacityContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  capacityBar: {
    height: 8,
    backgroundColor: '#232533',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  capacityFill: {
    height: '100%',
    backgroundColor: '#FF9C01',
    borderRadius: 4,
  },
  capacityText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFF',
    marginTop: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    lineHeight: 24,
  },
  bookButton: {
    backgroundColor: '#FF9C01',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  bookedButton: {
    backgroundColor: '#4A4A4A',
  },
  fullButton: {
    backgroundColor: '#FF4444',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
});

export default EventDetails;