import React from 'react';
import { createBooking } from '../utils/bookingUtils';
import { validateUserSession } from '../utils/userUtils';
import { useGlobalContext } from '../context/GlobalProvider';
import { useRouter } from 'expo-router';
import { databases } from '../lib/appwrite';

const EventBooking = ({ eventDetails }) => {
    const { user } = useGlobalContext();
    const router = useRouter();

    const handleBooking = async () => {
        try {
            const userValidation = validateUserSession(user);
            if (!userValidation.isValid) {
                console.error('User validation failed:', userValidation.error);
                router.push('/(auth)/login');
                return;
            }

            const booking = await createBooking(databases, user, eventDetails);
            console.log('Booking confirmed:', booking);
            // Add your success handling here
            
        } catch (error) {
            console.error('Booking failed:', error);
            // Add your error handling here
        }
    };

    // Add your component JSX here
};

export default EventBooking; 