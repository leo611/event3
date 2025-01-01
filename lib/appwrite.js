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
   activityScoresCollectionId: '676e19f3002a91d15af7',
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
   activityScoresCollectionId,
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
       // First check if user exists
       try {
           const checkSession = await account.createEmailPasswordSession(email, password);
           if (checkSession) {
               // If login succeeds, user exists
               await account.deleteSession('current');
               throw new Error('User already exists');
           }
       } catch (error) {
           // If login fails with 401, user doesn't exist - continue with creation
           if (error.code !== 401) {
               throw error;
           }
       }

       // Create new account
       const newAccount = await account.create(
           ID.unique(), 
           email,
           password,
           studentID
       );

       if(!newAccount) throw new Error('Failed to create account');

       // Create session for new account
       const session = await account.createEmailPasswordSession(email, password);
       
       if (!session) throw new Error('Failed to create session');

       const avatarUrl = avatars.getInitials(studentID);
       
       // Create user document
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
       if (error.message === 'User already exists') {
           throw new Error('An account with this email already exists');
       }
       throw new Error(error.message || 'Failed to create user account');
   }
};
export const cleanupSessions = async () => {
   try {
       const sessions = await account.listSessions();
       if (sessions && sessions.sessions.length > 0) {
           // Delete each session individually instead of all at once
           for (const session of sessions.sessions) {
               try {
                   await account.deleteSession(session.$id);
               } catch (error) {
                   console.log("Error deleting session:", error);
               }
           }
       }
   } catch (error) {
       // If error is permission related, ignore it
       if (error.code !== 401) {
           console.log("Cleanup error:", error);
       }
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
// Add these new functions for activity scoring

export const createActivityScore = async (scoreData) => {
    try {
        const score = await databases.createDocument(
            databaseId,
            activityScoresCollectionId,
            ID.unique(),
            {
                eventId: scoreData.eventId,
                eventTitle: scoreData.eventTitle,
                accountId: scoreData.accountId,
                studentId: scoreData.studentId,
                role: scoreData.role,
                ga1: parseInt(scoreData.ga1),
                ga2: parseInt(scoreData.ga2),
                ga3: parseInt(scoreData.ga3),
                ga4: parseInt(scoreData.ga4),
                ga5: parseInt(scoreData.ga5),
                ga6: parseInt(scoreData.ga6),
                ga7: parseInt(scoreData.ga7),
                ga8: parseInt(scoreData.ga8),
                totalScore: parseInt(scoreData.totalScore),
                level: parseInt(scoreData.level),
                dateAwarded: new Date().toISOString()
            }
        );
        return score;
    } catch (error) {
        console.error('Create activity score error:', error);
        throw error;
    }
};

export const getEventScores = async (eventId) => {
    try {
        const scores = await databases.listDocuments(
            databaseId,
            activityScoresCollectionId,
            [Query.equal('eventId', eventId)]
        );
        return scores.documents;
    } catch (error) {
        console.error('Get event scores error:', error);
        throw error;
    }
};

export const getUserScores = async (accountId) => {
    try {
        const scores = await databases.listDocuments(
            databaseId,
            activityScoresCollectionId,
            [
                Query.equal('accountId', accountId),
                Query.orderDesc('dateAwarded')
            ]
        );
        return scores.documents;
    } catch (error) {
        console.error('Get user scores error:', error);
        throw error;
    }
};

export const updateActivityScore = async (scoreId, scoreData) => {
    try {
        const updatedScore = await databases.updateDocument(
            databaseId,
            activityScoresCollectionId,
            scoreId,
            {
                role: scoreData.role,
                ga1: parseInt(scoreData.ga1),
                ga2: parseInt(scoreData.ga2),
                ga3: parseInt(scoreData.ga3),
                ga4: parseInt(scoreData.ga4),
                ga5: parseInt(scoreData.ga5),
                ga6: parseInt(scoreData.ga6),
                ga7: parseInt(scoreData.ga7),
                ga8: parseInt(scoreData.ga8),
                totalScore: parseInt(scoreData.totalScore),
                level: parseInt(scoreData.level),
                dateAwarded: new Date().toISOString()
            }
        );
        return updatedScore;
    } catch (error) {
        console.error('Update activity score error:', error);
        throw error;
    }
};

// Add this new function to check if email exists
export const checkEmailExists = async (email) => {
   try {
       // Try to get account by email
       await account.get();
       return true;
   } catch (error) {
       if (error.code === 401) {
           return false;
       }
       throw error;
   }
};
