import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, updateUserProfile } from '../lib/appwrite';
import { databases, config } from '../lib/appwrite';
import { Query } from 'react-native-appwrite';

// Create the context
const GlobalContext = createContext();

// Create the hook for using the context
export const useGlobalContext = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobalContext must be used within a GlobalProvider');
    }
    return context;
};

export function GlobalProvider({ children }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setisLoading] = useState(true);
    const [eventRegistrations, setEventRegistrations] = useState({});

    const debugUserSession = () => {
        if (user) {
            console.log('Current User Session:', {
                userId: user.$id,
                name: user.name,
                email: user.email,
                createdAt: user.$createdAt,
                sessionStarted: new Date().toISOString()
            });
        } else {
            console.log('No active user session');
        }
    };

    const updateEventRegistrationCount = async (eventId) => {
        try {
            const bookings = await databases.listDocuments(
                config.databaseId,
                config.bookingCollectionId,
                [Query.equal('eventId', [eventId])]
            );
            const count = bookings.documents.length;
            
            setEventRegistrations(prev => ({
                ...prev,
                [eventId]: count
            }));
            
            return count;
        } catch (error) {
            console.error('Error updating registration count:', error);
            return 0;
        }
    };

    const getEventRegistrationCount = (eventId) => {
        return eventRegistrations[eventId] || 0;
    };

    const updateUser = async (userData) => {
        console.log('updateUser called with:', userData);
        try {
            if (!userData.id) {
                throw new Error('No user ID provided');
            }
            const updatedUser = await updateUserProfile(userData.id, {
                email: userData.email,
                studentID: user?.studentID,
                accountId: user?.accountId,
                avatar: user?.avatar,
                fullName: userData.fullName,
                phone: userData.phone,
                address: userData.address
            });
            
            setUser(updatedUser);
            return updatedUser;
        } catch (error) {
            console.error('Error in updateUser:', error);
            throw error;
        }
    };

    useEffect(() => {
        debugUserSession();
    }, [user]);

    useEffect(() => {
        getCurrentUser()
        .then((res) => {
            if(res) {
                setIsLoggedIn(true);
                setUser(res);
            } else {
                setIsLoggedIn(false);
                setUser(null);
                setEventRegistrations({});
            }
        })
        .catch((error) => {
            console.log(error);
        })
        .finally(() => {
            setisLoading(false);
        });
    }, []);

    return (
        <GlobalContext.Provider
            value={{
                isLoggedIn,
                setIsLoggedIn,
                user,
                setUser,
                isLoading,
                updateUser,
                eventRegistrations,
                updateEventRegistrationCount,
                getEventRegistrationCount
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
}

export default GlobalProvider;