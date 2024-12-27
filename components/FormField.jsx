import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { icons } from '../constants'
import { Image } from 'react-native'


const FormField = ({
  title,
  value,
  placeholder,
  handleChangeText,
  otherStyles,
  secure = true, // Add secure prop with default value false
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`space-y-2 ${otherStyles}`}>
      <Text 
        style={{ marginBottom: 8 }} // Use inline style for margin
        className='text-base text-gray-100 font-pmedium'
      >
        {title}
      </Text>
      
      <View 
        style={{
          borderWidth: 2, // Adjust border width for a more natural look
          borderColor: isFocused ? '#B0BEC5' : '#4A4A4A', // Softer border colors
          borderRadius: 12, // Rounded corners
          height: 60, // Height of the text field
          padding: 8, // Padding inside the border
          backgroundColor: '#2C2C2C', // Dark gray background for the form field
          elevation: 2, // Add elevation for Android (shadow effect)
          shadowColor: '#000', // Shadow color for iOS
          shadowOffset: { width: 0, height: 2 }, // Shadow offset
          shadowOpacity: 0.1, // Shadow opacity
          shadowRadius: 4, // Shadow radius
          position: 'relative', // Set position to relative for absolute positioning of the icon
        }}
        className={`w-full items-center`}
      >
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className='flex-1 w-full text-base text-center' // Center the text
          style={{
            paddingVertical: 0, // Remove vertical padding to center the cursor
            fontSize: 18, // Adjust font size to fit the field
            height: '100%', // Ensure the TextInput takes the full height of the container
            color: '#FFFFFF', // Text color set to white for contrast
            textAlign: 'left',
            paddingRight: 40, // Add padding to the right to make space for the icon
          }}
          secureTextEntry={title === 'Password' && !showPassword} // Use secureTextEntry based on the secure prop
          {...props}
        />

        {title === 'Password' && (
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)} 
            style={{ position: 'absolute', right: 10, top: 18 }} // Adjust position
          >
            <Image 
              source={!showPassword ? icons.eye : icons.eyehide} 
              style={{ width: 24, height: 24 }} // Adjust icon size
              resizeMode='contain'
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default FormField