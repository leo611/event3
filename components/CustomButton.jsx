import { TouchableOpacity, Text } from 'react-native'
import React from 'react'

const CustomButton = (props) => {
  const { 
    title = 'CustomButton', 
    handlePress = () => {}, 
    containerStyles = {}, 
    textStyles = {}, 
    isLoading = false 
  } = props;

  return (
    <TouchableOpacity 
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
      style={{
        backgroundColor: '#FF9C01',
        borderRadius: 12,
        minHeight: 62,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: isLoading ? 0.5 : 1,
        marginTop: 20,        // Added margin top
        marginBottom: 20,     // Optional: Added margin bottom
        paddingHorizontal: 20,    // Add horizontal padding
        width: '100%',            // Make button full width
        marginHorizontal: 20,     // Add margin from screen edges
        ...containerStyles
      }}
    >
      <Text 
        style={{
          color: '#161622',
          fontFamily: 'Poppins-SemiBold',
          fontSize: 18,
          ...textStyles
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  )
}

export default CustomButton