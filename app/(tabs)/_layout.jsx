import { View, Text, Image } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { icons } from '../../constants'

const TabIcon = ({ focused, icon, color, name }) => {
  return (
    <View className='items-center justify-center' style={{ height: 45 }}>
      <Image 
        source={icon} 
        resizeMode='contain'
        tintColor={color}
        style={{
          width: 22,  // Slightly smaller icon
          height: 22,
          marginBottom: 4  // Increased space between icon and text
        }}
      />
      <Text 
        className={`${focused ? 'font-psemibold' : 'font-pregular'}`} 
        style={{ 
          color: color,
          fontSize: 11,  // Slightly larger font
          lineHeight: 13,
          textAlign: 'center',
          width: '100%',  // Ensure text has full width
          paddingHorizontal: 2  // Add some padding on sides
        }}
        numberOfLines={1}
        adjustsFontSizeToFit  // This will help fit longer text
      >
        {name}
      </Text>
    </View>
  )
}

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFA001',
        tabBarInactiveTintColor: '#CDCDE0',
        tabBarStyle: {
          backgroundColor: '#161622',
          borderTopWidth: 1,
          borderTopColor: '#232533',
          height: 65,  // Slightly taller for better touch targets
          paddingBottom: 10,
          paddingTop: 5,
          position: 'absolute',  // Position the tab bar absolutely
          bottom: 15,  // Move up from bottom
          left: 0,
          right: 0,
          elevation: 0,
          borderRadius: 15,  // Optional: adds rounded corners
          marginHorizontal: 10,  // Optional: adds side margins
        }
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <TabIcon 
              focused={focused}
              icon={icons.home}
              color={color}
              name="Home"
            />
          )
        }}
      />
      <Tabs.Screen 
        name="bookmark" 
        options={{
          title: 'Bookmark',
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <TabIcon 
              focused={focused}
              icon={icons.bookmark}
              color={color}
              name="Bookmark"
            />
          )
        }}
      />
      <Tabs.Screen 
        name="create" 
        options={{
          title: 'Create',
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <TabIcon 
              focused={focused}
              icon={icons.plus}
              color={color}
              name="Create"
            />
          )
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <TabIcon 
              focused={focused}
              icon={icons.profile}
              color={color}
              name="Profile"
            />
          )
        }}
      />
    </Tabs>
  )
}

export default TabsLayout