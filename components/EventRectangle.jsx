import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EventRectangle = ({ 
  imageUrl, 
  title, 
  date, 
  location, 
  gaPoint, 
  capacity, 
  registeredCount = 0, 
  onPress,
  showStatus = false,
  status,
  style,
  onCancelRegistration
}) => {
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Date not available';

      // Try to parse the date string
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date string:', dateString);
        return dateString;
      }

      // Format the date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  const handleCancelPress = () => {
    Alert.alert(
      "Cancel Registration",
      "Are you sure you want to cancel your registration for this event?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: onCancelRegistration,
          style: "destructive"
        }
      ]
    );
  };

  const progress = Math.min((registeredCount / capacity) * 100, 100);

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={14} color="#FFA500" />
          <Text style={styles.infoText}>{formatDate(date)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#FFA500" />
          <Text style={styles.infoText}>{location}</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {registeredCount}/{capacity} registered
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.gaText}>{gaPoint}</Text>
          <View style={styles.footerButtons}>
            {showStatus && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{status}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelPress}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    width: '92%',
    alignSelf: 'center',
  },
  image: {
    width: '100%',
    height: 120,
  },
  content: {
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    marginLeft: 6,
    color: '#CCCCCC',
    fontSize: 12,
  },
  progressContainer: {
    marginVertical: 6,
  },
  progressBackground: {
    height: 3,
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
    fontSize: 11,
    marginTop: 3,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  gaText: {
    color: '#FFA500',
    fontWeight: 'bold',
    fontSize: 13,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default EventRectangle;