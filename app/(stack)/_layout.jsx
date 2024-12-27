import { Stack } from 'expo-router';
import React from 'react';

export default function StackLayout() {
    return (
        <Stack>
            <Stack.Screen 
                name="eventDetails/[id]" 
                options={{
                    headerShown: false
                }}
            />
            <Stack.Screen 
                name="editProfile" 
                options={{
                    title: "Edit Profile",
                    headerStyle: {
                        backgroundColor: '#161622'
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontFamily: 'Poppins-Medium'
                    },
                    presentation: 'modal'
                }}
            />
        </Stack>
    );
}