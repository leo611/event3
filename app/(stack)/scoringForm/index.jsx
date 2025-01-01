import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useRef } from 'react';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createActivityScore } from '../../../lib/appwrite';

const ScoringForm = () => {
  const params = useLocalSearchParams();
  const scrollViewRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState({
    role: 'Participant',
    ga1: '',
    ga2: '',
    ga3: '',
    ga4: '',
    ga5: '',
    ga6: '',
    ga7: '',
    ga8: '',
    level: '3'
  });

  const calculateTotal = () => {
    const total = Object.keys(scores)
      .filter(key => key.startsWith('ga'))
      .reduce((sum, key) => sum + (parseInt(scores[key]) || 0), 0);
    return total;
  };

  const validateScores = () => {
    for (let i = 1; i <= 8; i++) {
      const score = parseInt(scores[`ga${i}`]);
      if (isNaN(score) || score < 0 || score > 3) {
        Alert.alert('Invalid Score', `GA${i} score must be between 0 and 3`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      if (!validateScores()) return;
      
      setLoading(true);
      const totalScore = calculateTotal();

      const scoreData = {
        ...scores,
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        accountId: params.accountId,
        studentId: params.studentId,
        totalScore,
      };

      await createActivityScore(scoreData);
      Alert.alert('Success', 'Scores saved successfully');
      router.back();
    } catch (error) {
      console.error('Error saving scores:', error);
      Alert.alert('Error', 'Failed to save scores');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#161622]">
        <ActivityIndicator size="large" color="#FF9C01" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#161622',
          },
          headerTintColor: '#fff',
          headerTitle: `Score: ${params.participantName || 'Participant'}`,
          headerTitleStyle: {
            fontFamily: 'Poppins-Medium',
          },
        }} 
      />
      
      <SafeAreaView className="flex-1 bg-[#161622]">
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="p-4">
            <View className="mb-6">
              <Text className="text-white text-xl font-psemibold mb-2">
                Score Participant
              </Text>
              <Text className="text-gray-400 font-pregular">
                Student ID: {params.studentId}
              </Text>
              <Text className="text-gray-400 font-pregular">
                Event: {params.eventTitle}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-white font-pmedium mb-2">Role</Text>
              <TextInput
                value={scores.role}
                onChangeText={(text) => setScores(prev => ({...prev, role: text}))}
                className="bg-[#232533] text-white p-3 rounded-lg font-pregular"
                placeholderTextColor="#666"
              />
            </View>

            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <View key={num} className="mb-4">
                <Text className="text-white font-pmedium mb-2">
                  GA{num} Score (0-3)
                </Text>
                <TextInput
                  value={scores[`ga${num}`]}
                  onChangeText={(text) => {
                    setScores(prev => ({...prev, [`ga${num}`]: text}));
                    // Auto scroll to next input when number is entered
                    if (text.length === 1 && num < 8) {
                      scrollViewRef.current?.scrollTo({
                        y: (num * 100), // Approximate height of each input section
                        animated: true
                      });
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                  className="bg-[#232533] text-white p-3 rounded-lg font-pregular"
                  placeholderTextColor="#666"
                  returnKeyType={num === 8 ? "done" : "next"}
                />
              </View>
            ))}

            <View className="mb-4">
              <Text className="text-white font-pmedium mb-2">Level (1-3)</Text>
              <TextInput
                value={scores.level}
                onChangeText={(text) => setScores(prev => ({...prev, level: text}))}
                keyboardType="numeric"
                maxLength={1}
                className="bg-[#232533] text-white p-3 rounded-lg font-pregular"
                placeholderTextColor="#666"
              />
            </View>

            <View className="mb-6">
              <Text className="text-white font-pmedium text-lg">
                Total Score: {calculateTotal()}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              className="bg-[#FF9C01] p-4 rounded-lg mb-6"
            >
              <Text className="text-white text-center font-pmedium">
                Submit Scores
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default ScoringForm;