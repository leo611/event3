import { View, Text, ScrollView, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../../constants';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { Link, router } from 'expo-router';
import { createUser } from '../../lib/appwrite';
import { account } from './../../lib/appwrite';  // Make sure to import your Appwrite account instance

const SignUp = () => {
  const [form, setform] = useState({
    studentID: '',
    email: '',
    password: ''
  });

  const [isSubmitting, setisSubmitting] = useState(false);

  const clearExistingSession = async () => {
    try {
      await account.deleteSession('current');
    } catch (error) {
      // If there's no session to delete, that's fine - we can proceed
      if (error.code !== 401) {
        throw error; // Re-throw if it's a different error
      }
    }
  };

  const submit = async () => {
    if (!form.studentID || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all the fields');
      return;
    }

    setisSubmitting(true);

    try {
      const result = await createUser(form.email, form.password, form.studentID);
      router.replace('/home');
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to sign up. Please try again.'
      );
    } finally {
      setisSubmitting(false);
    }
};

  return (
    <SafeAreaView className='bg-primary h-full'>
      <ScrollView>
        <View className='w-full justify-center min-h-[82vh] px-4 my-6'>
          <Image source={images.logo} resizeMode='contain' className='w-[115px] h-[35px]' />

          <Text className='text-2xl text-white text-semibold mt-10 font=psemibold'>
            Sign up to Aora
          </Text>

          <FormField 
            title="StudentID"
            value={form.studentID}
            handleChangeText={(e) => setform({ ...form, studentID: e })} 
            otherStyles='mt-10'        
          />

          <FormField 
            title="Email"
            value={form.email}
            handleChangeText={(e) => setform({ ...form, email: e })} 
            otherStyles='mt-7'
            keyboardType='email-address'         
          />

          <FormField 
            title="Password"
            value={form.password}
            handleChangeText={(e) => setform({ ...form, password: e })} 
            otherStyles='mt-7'        
          />  

          <CustomButton 
            title='Sign up'
            handlePress={submit}
            containerStyles={{ width: '100%', maxWidth: 380 }}
            isLoading={isSubmitting}
          />

          <View className='justify-center pt-5 flex-row gap-2'>
            <Text className='text-lg text-gray-100 font-pregular'>
              Have an account already?
            </Text>
            <Link href='/sign-in' className='text-lg font-psemibold text-secondary'>Sign in</Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default SignUp;