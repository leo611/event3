import { View, Text, Image } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { icons } from '../../constants'
import { MaterialIcons } from '@expo/vector-icons';

const TabIcon = ({ focused, icon, color, name, isIcon }) => {
  return (
    <View className='items-center justify-center' style={{ height: 45 }}>
      {isIcon ? (
        <MaterialIcons name={icon} size={22} color={color} style={{ marginBottom: 4 }} />
      ) : (
        <Image 
          source={icon} 
          resizeMode='contain'
          tintColor={color}
          style={{
            width: 22,
            height: 22,
            marginBottom: 4
          }}
        />
      )}
      <Text 
        className={`${focused ? 'font-psemibold' : 'font-pregular'}`} 
        style={{ 
          color: color,
          fontSize: 11,
          lineHeight: 13,
          textAlign: 'center',
          width: '100%',
          paddingHorizontal: 2
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
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
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
          position: 'absolute',
          bottom: 15,
          left: 0,
          right: 0,
          elevation: 0,
          borderRadius: 15,
          marginHorizontal: 10,
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
        name="scoring" 
        options={{
          title: 'Scoring',
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <TabIcon 
              focused={focused}
              icon="assessment"  // Using MaterialIcons name directly
              color={color}
              name="Scoring"
              isIcon={true}  // Add this prop to use MaterialIcons
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