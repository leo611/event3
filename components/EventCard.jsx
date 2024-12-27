import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EventCard = ({ imageUrl, title, date, location, gaPoint, capacity, registeredCount = 0, onPress }) => {
  // Format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate progress percentage
  const progress = Math.min((registeredCount / capacity) * 100, 100);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        
        <View style={styles.infoContainer}>
          <Ionicons name="calendar-outline" size={16} color="#FFA500" />
          <Text style={styles.infoText}>{formatDate(date)}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Ionicons name="location-outline" size={16} color="#FFA500" />
          <Text style={styles.infoText}>{location}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {registeredCount}/{capacity} registered
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.infoContainer}>
            <Ionicons name="people-outline" size={16} color="#FFA500" />
            <Text style={styles.infoText}>{capacity} pax</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.gaText}>{gaPoint}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 280,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    marginLeft: 6,
    color: '#CCCCCC',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  gaText: {
    color: '#FFA500',
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFA500',
  },
  progressText: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
});

export default EventCard;