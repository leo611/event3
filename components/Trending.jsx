import { View, Text, Image, TouchableOpacity } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';

const Trending = ({ posts }) => {
  const router = useRouter();

  const formatDate = (dateString) => {
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

  const handlePress = (post) => {
    router.push({
      pathname: "/(stack)/eventDetails/[id]",
      params: { 
        id: post.$id,
        title: post.title,
        image: post.image,
        date: post.date,
        location: post.location,
        description: post.description
      }
    });
  };

  return (
    <View>
      {posts.map((post) => (
        <TouchableOpacity
          key={post.$id}
          className="bg-gray-800 overflow-hidden shadow-lg mb-4"
          style={{
            borderColor: 'white',
            borderWidth: 3,
            borderRadius: 20,
            marginBottom: 20,
            padding: 12
          }}
          onPress={() => handlePress(post)}
        >
          <View className="flex-row items-center">
            {/* Left side - Image */}
            <Image
              source={{ uri: post.image }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 15,
                marginRight: 20  // Increased margin between image and text
              }}
              resizeMode="cover"
            />
            
            {/* Right side - Information */}
            <View className="flex-1" style={{ paddingRight: 10 }}>
              <Text 
                className="text-white font-psemibold text-lg"
                numberOfLines={1}
                style={{ marginBottom: 12 }}  // Increased spacing after title
              >
                {post.title}
              </Text>
              
              {/* Date and Location with icons */}
              <View style={{ gap: 10 }}>  {/* Increased spacing between date and location */}
                <View className="flex-row items-center">
                  <Text className="text-white" style={{ marginRight: 12 }}>📅</Text>
                  <Text 
                    className="text-white font-pmedium text-sm"
                    numberOfLines={1}
                  >
                    {formatDate(post.date)}
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  <Text className="text-white" style={{ marginRight: 12 }}>📍</Text>
                  <Text 
                    className="text-white font-pmedium text-sm"
                    numberOfLines={1}
                  >
                    {post.location}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default Trending;