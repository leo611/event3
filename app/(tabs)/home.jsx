import { View, Text, FlatList, Image, RefreshControl } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../../constants';
import SearchInput from '../../components/SearchInput';
import EmptyState from '../../components/EmptyState';
import { getAllPosts, getLatestPosts } from '../../lib/appwrite';
import useAppwrite from '../../lib/useAppwrite';
import VideoCard from '../../components/VideoCard';
import EventCard from '../../components/EventCard';
import { useRouter, useFocusEffect } from 'expo-router';
import { Client, Databases, Query } from 'react-native-appwrite';
import { databases } from '../../lib/appwrite';
import { config } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';


const Home = () => {
  
  const { user, updateEventRegistrationCount } = useGlobalContext();
  const { data: posts, refetch } = useAppwrite(getAllPosts);
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchEventsWithCounts = async () => {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.eventCollectionId,
        [Query.orderDesc('$createdAt')]
      );

      // Update counts for each event
      const eventsWithCounts = await Promise.all(
        response.documents.map(async (event) => {
          const count = await updateEventRegistrationCount(event.$id);
          return {
            ...event,
            registeredCount: count
          };
        })
      );

      setEvents(eventsWithCounts);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEventsWithCounts();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), fetchEventsWithCounts()]);
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View className="my-6 px-4 space-y-6">
      <View className="justify-between items-start flex-row mb-6">
        <View>
          <Text className="font-pmedium text-sm text-gray-100">
            Welcome Back
          </Text>
          <Text className="text-2xl font-psemibold text-white">
            {user?.name || 'Guest'}
          </Text>
        </View>

        <View className="mt-1.5">
          <Image
            source={images.logoSmall}
            className="w-9 h-10"
            resizeMode="contain"
          />
        </View>
      </View>

      <SearchInput />

      <View className="mt-6" />

      {/* Events Section */}
      {events && events.length > 0 && (
        <View>
          <Text className="text-white text-lg font-psemibold mb-4">
            Latest Events
          </Text>
          <FlatList
            data={events}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <EventCard
                imageUrl={item.image}
                title={item.title}
                date={item.date}
                location={item.location}
                gaPoint={item.gaPoint}
                capacity={item.capacity}
                registeredCount={item.registeredCount || 0}
                onPress={() => handleEventPress(item)}
              />
            )}
            keyExtractor={item => item.$id}
          />
        </View>
      )}

      <View className="mt-6" />

      {/* Videos Section Header */}
      {posts && posts.length > 0 && (
        <View>
          <Text className="text-white text-lg font-psemibold mb-4">
            Latest Videos
          </Text>
        </View>
      )}
    </View>
  );

  const handleEventPress = (event) => {
    router.push({
      pathname: "/(stack)/eventDetails/[id]",
      params: { 
        id: event.$id,
        title: event.title,
        image: event.image,
        date: event.date,
        location: event.location,
        description: event.description,
        capacity: event.capacity,
        gaPoint: event.gaPoint,
        registeredCount: event.registeredCount
      }
    });
  };

  return (
    <SafeAreaView className="bg-primary border-2 h-full">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => <VideoCard video={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            title="No Events Found"
            subtitle="Be the first one to create an event"
          />
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#FFA500"]}
            tintColor="#FFA500"
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        initialNumToRender={5}
      />
    </SafeAreaView>
  );
};

export default Home;