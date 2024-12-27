import { ID } from 'appwrite';
import { config } from '../lib/appwrite';

export const createBooking = async (databases, user, eventDetails) => {
    if (!user || !user.$id) {
        throw new Error('User must be logged in to create a booking');
    }

    try {
        console.log('Creating booking with:', {
            userId: user.$id,
            eventId: eventDetails.$id,
            eventTitle: eventDetails.title
        });

        const booking = await databases.createDocument(
            config.databaseId,
            config.bookingCollectionId,
            ID.unique(),
            {
                userId: user.$id,
                eventId: eventDetails.$id,
                eventTitle: eventDetails.title,
                eventImage: eventDetails.image,
                eventLocation: eventDetails.location,
                capacity: eventDetails.capacity,
                bookingDate: new Date().toISOString(),
            }
        );

        console.log('Booking created successfully:', {
            bookingId: booking.$id,
            userId: booking.userId,
            eventTitle: booking.eventTitle,
            verificationCheck: booking.userId === user.$id
        });

        return booking;

    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
};

export const formatDate = (dateString) => {
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

export const calculateRemainingSpots = (capacity, registeredCount) => {
  return capacity - registeredCount;
}; 