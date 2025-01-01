import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, updateUserProfile } from '../lib/appwrite';
import { databases, config, account } from '../lib/appwrite';
import { Query } from 'react-native-appwrite';

const GlobalContext = createContext({
    user: null,
    setUser: () => {},
    loading: false,
    checkUser: () => {},
});

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

    const debugUserSession = async () => {
        try {
            const currentSession = await account.get();
            if (currentSession) {
                console.log('Current User Session:', currentSession);
                setUser(currentSession);
                setIsLoggedIn(true);
                // Trigger event registrations refresh
                await updateAllEventRegistrations();
            } else {
                console.log('No active user session');
                setUser(null);
                setIsLoggedIn(false);
                setEventRegistrations({});
            }
        } catch (error) {
            console.log('Session debug error:', error);
            setUser(null);
            setIsLoggedIn(false);
            setEventRegistrations({});
        }
    };

    const checkUser = async () => {
        try {
            setisLoading(true);
            const currentUser = await account.get();
            if (currentUser) {
                console.log('User found:', currentUser);
                setIsLoggedIn(true);
                setUser(currentUser);
                // Trigger event registrations refresh
                await updateAllEventRegistrations();
            } else {
                setIsLoggedIn(false);
                setUser(null);
                setEventRegistrations({});
            }
        } catch (error) {
            console.log("Session check error:", error);
            setIsLoggedIn(false);
            setUser(null);
            setEventRegistrations({});
        } finally {
            setisLoading(false);
        }
    };

    // New function to update all event registrations
    const updateAllEventRegistrations = async () => {
        try {
            // Get all events first
            const events = await databases.listDocuments(
                config.databaseId,
                config.eventCollectionId
            );

            // Update registration count for each event
            const promises = events.documents.map(event => 
                updateEventRegistrationCount(event.$id)
            );

            await Promise.all(promises);
        } catch (error) {
            console.error('Error updating all event registrations:', error);
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

    // Check user on mount and when isLoggedIn changes
    useEffect(() => {
        checkUser();
    }, [isLoggedIn]);
  
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
                getEventRegistrationCount,
                checkUser
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
}

export default GlobalProvider;