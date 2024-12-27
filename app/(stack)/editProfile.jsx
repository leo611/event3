import { View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import React, { useState } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const EditProfileScreen = () => {
  const params = useLocalSearchParams();
  const { user, updateUser } = useGlobalContext();  // Get both user and updateUser
  
  console.log('Context values:', { user, updateUser }); // Debug log

  const [formData, setFormData] = useState({
    fullName: params?.fullName || '',
    email: params?.email || '',
    phone: params?.phone || '',
    address: params?.address || '',
  });

  const handleUpdate = async () => {
    console.log('Starting update...'); // Debug log
    try {
      if (!params?.id) {
        console.error('No user ID found in params');
        return;
      }

      console.log('Updating user with data:', {
        ...formData,
        id: params.id
      }); // Debug log

      // Call updateUser function
      await updateUser({
        ...formData,
        id: params.id
      });
      
      console.log('Update successful'); // Debug log
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#161622]">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2"
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-[Poppins-Bold] ml-2">
            Edit Profile
          </Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="font-[Poppins-Medium] mb-2 text-white">Full Name</Text>
            <TextInput
              className="bg-[#232533] p-4 rounded-lg font-[Poppins-Regular] text-white"
              value={formData.fullName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
              placeholderTextColor="#666"
              selectionColor="#FF9C01"
            />
          </View>

          <View>
            <Text className="font-[Poppins-Medium] mb-2 text-white">Email</Text>
            <TextInput
              className="bg-[#232533] p-4 rounded-lg font-[Poppins-Regular] text-white"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              placeholderTextColor="#666"
              selectionColor="#FF9C01"
            />
          </View>

          <View>
            <Text className="font-[Poppins-Medium] mb-2 text-white">Phone</Text>
            <TextInput
              className="bg-[#232533] p-4 rounded-lg font-[Poppins-Regular] text-white"
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
              placeholderTextColor="#666"
              selectionColor="#FF9C01"
            />
          </View>

          <View>
            <Text className="font-[Poppins-Medium] mb-2 text-white">Address</Text>
            <TextInput
              className="bg-[#232533] p-4 rounded-lg font-[Poppins-Regular] text-white"
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              multiline
              numberOfLines={3}
              placeholderTextColor="#666"
              selectionColor="#FF9C01"
            />
          </View>

          <TouchableOpacity 
            onPress={handleUpdate}
            className="bg-[#FF9C01] p-4 rounded-lg mt-6"
          >
            <Text className="text-white text-center font-[Poppins-Medium]">
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EditProfileScreen;