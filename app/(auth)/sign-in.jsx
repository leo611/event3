import { View, Text ,ScrollView,Image} from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {images} from '../../constants';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton'
import {Link, router} from 'expo-router'
import { signIn } from '../../lib/appwrite';

const SignIn = () => {
  const [form, setform] = useState({
    email: '',
    password: ''
  })

  const [isSubmitting, setisSubmitting] = useState(false)

  const submit = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all the fields');
      return;
    }
    

     // Add email validation
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(form.email)) {
       Alert.alert('Error', 'Please enter a valid email address');
       return;
     }

    setisSubmitting(true);

    try {
      // Try to sign in directly
      await signIn(form.email.trim(), form.password);  // Added trim() to remove any whitespace
      router.replace('/home');
    } catch (error) {
      console.error('Sign in error:', error);
      // More specific error messages
      if (error.message.includes('email')) {
        Alert.alert('Error', 'Please enter a valid email address');
      } else {
        Alert.alert(
          'Error', 
          error.message || 'Failed to sign in. Please try again.'
        );
      }
    } finally {
      setisSubmitting(false);
    }
  };

  return (
    <SafeAreaView className='bg-primary h-full'>
      <ScrollView>
        <View className='w-full justify-center min-h-[82vh] px-4 my-6'>
          <Image source={images.logo}
          resize mode='contain' className='w-[115px] h-[35px]' />

          <Text className='text-2xl text-white text-semibold mt-10 font=psemibold'>
            Log in to Aora
          </Text>

          <FormField 
          title="Email"
          value={form.email}
          handleChangeText={(e) => setform({...form,email: e})} 
          otherStyles='mt-7'
          keyboardType='email-address'         
          />

          <FormField 
          title="Password"
          value={form.password}
          handleChangeText={(e) => setform({...form,password: e})} 
          otherStyles='mt-7'        
          />  

          
            <CustomButton 
              title='Sign In'
              handlePress={submit}
              containerStyles={{ width: '100%', maxWidth: 380 }} // Set width to 100% or a max width
              isLoading={isSubmitting}
            />
         

          <View className='justify-center pt-5 flex-row gap-2'>
            <Text className='text-lg text-gray-100 font-pregular'>
              Don't have an account?
              
            </Text>
            <Link href='/sign-up' className='text-lg font-psemibold text-secondary'>Sign Up</Link>

          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignIn