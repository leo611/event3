import { Client, Account, ID, Databases, Avatars, Query, Storage } from 'react-native-appwrite';
export const config = {
   endpoint: 'https://cloud.appwrite.io/v1',
   platform: 'com.tarumt.aora',
   projectId: '673ee4ad001dcff15e0d',
   databaseId: '673ee652003c0a9958fe',
   userCollectionId: '673ee6850004ebefac7a',
   photoCollectionId: '673ee6e0001137c7d728',
   videoCollectionId: '673ee6fd003a7ad25b1d',
   storageId: '67418fe70031b76a7cf6',
   eventCollectionId: '6752a2f4002da4e61006',
   bookingCollectionId: '6763b1cc0035fb43b1b5',
};

const {
   endpoint,
   platform,
   projectId,
   databaseId,
   userCollectionId,
   photoCollectionId,
   videoCollectionId,
   storageId,
   eventCollectionId,
   bookingCollectionId,
} = config;
// Init your React Native SDK
const client = new Client();
client
   .setEndpoint(config.endpoint)
   .setProject(config.projectId)
   .setPlatform(config.platform);
export const account = new Account(client);
export const avatars = new Avatars(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { Query };
// User Management Functions
export const createUser = async(email, password, studentID) => {
   try {
       await cleanupSessions();
        const newAccount = await account.create(
           ID.unique(), 
           email,
           password,
           studentID
       );
        if(!newAccount) throw new Error('Failed to create account');
        const avatarUrl = avatars.getInitials(studentID);
       const session = await signIn(email, password);
       
       if (!session) throw new Error('Failed to create session');
        const newUser = await databases.createDocument(
           databaseId,
           userCollectionId,
           ID.unique(),
           {
               accountId: newAccount.$id,
               email,
               studentID,
               avatar: avatarUrl
           }
       );
        return newUser;
   } catch (error) {
       console.log("Create user error:", error);
       throw new Error(error.message || 'Failed to create user account');
   }
};
export const cleanupSessions = async () => {
   try {
       const sessions = await account.listSessions();
       if (sessions && sessions.sessions.length > 0) {
           await account.deleteSessions();
       }
   } catch (error) {
       console.log("Cleanup error:", error);
   }
};
export const signIn = async (email, password) => {
   try {
       await cleanupSessions();
       const session = await account.createEmailPasswordSession(email, password);
       if (!session) throw new Error('Failed to create session');
       return session;
   } catch (error) {
       console.log("Sign in error:", error);
       if (error.code === 401) {
           throw new Error('Invalid email or password');
       }
       throw new Error(error.message || 'Failed to sign in');
   }
};
export const getCurrentUser = async () => {
   try {
       const currentAccount = await account.get();
       if(!currentAccount) throw Error;
        const currentUser = await databases.listDocuments(
           databaseId,
           userCollectionId,
           [Query.equal('accountId', currentAccount.$id)]
       );
        if(!currentUser) throw Error;
       return currentUser.documents[0];
   } catch (error) {
       console.log(error);
       return null;
   }
};
// Event Management Functions
export const createEvent = async (eventData) => {
    try {
        // Upload image and get URL
        const imageUrl = await uploadFile(eventData.image);
        
        // Create the event document
        const response = await databases.createDocument(
            databaseId,
            eventCollectionId,
            ID.unique(),
            {
                title: eventData.title,
                description: eventData.description,
                date: eventData.date,
                location: eventData.location,
                capacity: parseInt(eventData.capacity),
                image: imageUrl, // Store the complete image URL
                gaPoint: eventData.gaPoint,
                createdAt: new Date().toISOString(),
            }
        );
         if (!response) {
            throw new Error('Failed to create event');
        }
         return response;
    } catch (error) {
        console.error('Error in createEvent:', error);
        throw error;
    }
};
 // Add helper function to upload files
 const uploadFile = async (uri) => {
    try {
        // Read the file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
         // Create file in Appwrite Storage
        const file = await storage.createFile(
            storageId,
            ID.unique(),
            Buffer.from(base64, 'base64')
        );
         // Get the file view URL
        const fileUrl = storage.getFileView(storageId, file.$id);
         return fileUrl;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
  } ;
export const getLatestPosts = async () => {
   try {
       const events = await databases.listDocuments(
           databaseId,
           eventCollectionId,
           [
               Query.orderDesc('$createdAt'),
               Query.limit(100)
           ]
       );
        return events.documents;
   } catch (error) {
       console.error('Error in getLatestPosts:', error);
       return null;
   }
};
export const getAllPosts = async () => {
   try {
       const posts = await databases.listDocuments(
           databaseId,
           videoCollectionId
       );
       return posts.documents;
   } catch (error) {
       throw new Error(error);
   }
};
// Booking Management Functions
export const createBooking = async (eventData, userId) => {
    try {
        const booking = await databases.createDocument(
            databaseId,
            bookingCollectionId,
            ID.unique(),
            {
                userId: userId,
                eventId: eventData.id,
                eventTitle: eventData.title,
                eventImage: eventData.image || '',
                eventDate: eventData.date,
                eventLocation: eventData.location || '',
                bookingDate: new Date().toISOString(),
                status: 'confirmed' // Add default status
            }
        );
        return booking;
    } catch (error) {
        console.error('Create booking error:', error);
        throw error;
    }
 };
 
 export const checkBookingStatus = async (eventId, userId) => {
    try {
        const bookings = await databases.listDocuments(
            databaseId,
            bookingCollectionId,
            [
                Query.equal('eventId', eventId),
                Query.equal('userId', userId)
            ]
        );
        return bookings.documents.length > 0;
    } catch (error) {
        console.error('Check booking status error:', error);
        throw error;
    }
 };
 
 export const getEventRegisteredCount = async (eventId) => {
    try {
        const bookings = await databases.listDocuments(
            databaseId,
            bookingCollectionId,
            [Query.equal('eventId', eventId)]
        );
        return {
            count: bookings.documents.length,
            bookings: bookings.documents
        };
    } catch (error) {
        console.error('Get registered count error:', error);
        return { count: 0, bookings: [] };
    }
 };
 
 export const getUserBookings = async (userId) => {
    try {
        const bookings = await databases.listDocuments(
            databaseId,
            bookingCollectionId,
            [
                Query.equal('userId', userId),
                Query.orderDesc('$createdAt')
            ]
        );
        return bookings.documents;
    } catch (error) {
        console.error('Error getting user bookings:', error);
        throw error;
    }
 };
export const getEventDetails = async (eventId) => {
   try {
       const event = await databases.getDocument(
           databaseId,
           eventCollectionId,
           eventId
       );
       return event;
   } catch (error) {
       console.error('Error getting event details:', error);
       throw error;
   }
};
export const updateUserProfile = async (userId, userData) => {
   try {
       const updatedUser = await databases.updateDocument(
           databaseId,
           userCollectionId,
           userId,
           userData
       );
       return updatedUser;
   } catch (error) {
       console.error('Error updating user profile:', error);
       throw error;
   }
};
