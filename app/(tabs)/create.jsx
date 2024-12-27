import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Platform, Keyboard, KeyboardAvoidingView, Alert } from 'react-native'
import React, { useState, useRef } from 'react'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { createEvent } from '../../lib/appwrite'
import { storage, databases } from '../../lib/appwrite'
import { config } from '../../lib/appwrite'

const Create = () => {
  const router = useRouter()
  const scrollViewRef = useRef(null)
  const [loading, setLoading] = useState(false)
  
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    date: new Date(),
    time: new Date(),
    location: '',
    capacity: '',
    image: null,
    gaPoint: 'GA1',
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const gaPoints = ['GA1', 'GA2', 'GA3', 'GA4', 'GA5', 'GA6', 'GA7', 'GA8']

  const handleCreate = async () => {
    try {
      if (!eventData.title || !eventData.description || !eventData.location || 
          !eventData.capacity || !eventData.image) {
        Alert.alert('Error', 'Please fill in all required fields and upload an image');
        return;
      }

      setLoading(true);

      // Combine date and time
      const combinedDateTime = new Date(eventData.date);
      combinedDateTime.setHours(eventData.time.getHours());
      combinedDateTime.setMinutes(eventData.time.getMinutes());

      // Create event in database
      await databases.createDocument(
        config.databaseId,
        config.eventCollectionId,
        'unique()', // Using string instead of ID.unique()
        {
          title: eventData.title,
          description: eventData.description,
          date: combinedDateTime.toISOString(),
          location: eventData.location,
          capacity: parseInt(eventData.capacity),
          image: eventData.image,
          gaPoint: eventData.gaPoint,
          // Removed createdAt field
        }
      );

      Alert.alert(
        'Success', 
        'Event created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)/home')
          }
        ]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };
   const pickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      if (!result.canceled) {
        setEventData({ ...eventData, image: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setEventData({ ...eventData, date: selectedDate })
    }
  }

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false)
    if (selectedTime) {
      setEventData({ ...eventData, time: selectedTime })
    }
  }

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format time for display
  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleFocus = (event) => {
    // Get the y position of the focused element
    const node = event.target
    node.measure((x, y, width, height, pageX, pageY) => {
      // Scroll to the position with additional offset for better visibility
      scrollViewRef.current?.scrollTo({
        y: pageY - 100, // 100px offset from the top
        animated: true,
      })
    })
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Create New Event</Text>
        
        <View style={styles.formContainer}>
          <Text style={styles.label}>Event Image</Text>
          <TouchableOpacity style={styles.imageUploadButton} onPress={pickImage}>
            {eventData.image ? (
              <Image 
                source={{ uri: eventData.image }} 
                style={styles.previewImage} 
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>Tap to upload image</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Event Title</Text>
          <TextInput
            style={styles.input}
            value={eventData.title}
            onChangeText={(text) => setEventData({...eventData, title: text})}
            placeholder="Enter event title"
            placeholderTextColor="#666"
            onFocus={handleFocus}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={eventData.description}
            onChangeText={(text) => setEventData({...eventData, description: text})}
            placeholder="Enter event description"
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            onFocus={handleFocus}
          />

          {/* Date and Time in same row */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => {
                  setShowDatePicker(true)
                  Keyboard.dismiss()
                }}
              >
                <Text style={styles.dateTimeText}>
                  {formatDate(eventData.date)}
                </Text>
                <Ionicons name="calendar" size={24} color="#FFA500" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={eventData.date}
                  mode="date"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => {
                  setShowTimePicker(true)
                  Keyboard.dismiss()
                }}
              >
                <Text style={styles.dateTimeText}>
                  {formatTime(eventData.time)}
                </Text>
                <Ionicons name="time" size={24} color="#FFA500" />
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={eventData.time}
                  mode="time"
                  onChange={onTimeChange}
                  is24Hour={false}
                />
              )}
            </View>
          </View>

          {/* Location and Capacity in same row */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={eventData.location}
                onChangeText={(text) => setEventData({...eventData, location: text})}
                placeholder="Enter location"
                placeholderTextColor="#666"
                onFocus={handleFocus}
              />
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.label}>Capacity</Text>
              <TextInput
                style={styles.input}
                value={eventData.capacity}
                onChangeText={(text) => setEventData({...eventData, capacity: text})}
                placeholder="Max participants"
                placeholderTextColor="#666"
                keyboardType="numeric"
                onFocus={handleFocus}
              />
            </View>
          </View>

          {/* GA Point Selection */}
          <Text style={styles.label}>GA Point</Text>
          <View style={styles.gaContainer}>
            {gaPoints.map((point) => (
              <TouchableOpacity
                key={point}
                style={[
                  styles.gaButton,
                  eventData.gaPoint === point && styles.gaButtonSelected
                ]}
                onPress={() => setEventData({...eventData, gaPoint: point})}
              >
                <Text style={[
                  styles.gaButtonText,
                  eventData.gaPoint === point && styles.gaButtonTextSelected
                ]}>
                  {point}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={() => {
              Keyboard.dismiss()
              handleCreate()
            }}
          >
            <Text style={styles.buttonText}>Create Event</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 180 : 140, // Increased bottom padding
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
    color: '#fff',
  },
  formContainer: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#111',
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: '#000',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageUploadButton: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#111',
  },
  dateTimeText: {
    color: '#fff',
    fontSize: 16,
  },
  gaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  gaButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#111',
  },
  gaButtonSelected: {
    backgroundColor: '#FFA500',
    borderColor: '#FFA500',
  },
  gaButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  gaButtonTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
})

export default Create