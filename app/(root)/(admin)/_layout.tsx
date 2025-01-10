import { View, Text, Image } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import icons from '@/constants/icons'

const TabIcon = ({ focused, icon, title}: 
    {focused: boolean; icon: any; title: string;}) => (
    <View className="flex-1 mt-3 flex flex-col items-center">
        <Image source={icon} tintColor={focused ? '#0061ff' : 
            '#666876'} resizeMode="contain" className="size-6" />

        <Text className={`${focused ? 'text-primary-300 font-rubik-medium' 
            : 'text-black-200 font-rubik'} text-xs w-full text-center mt-1`}>
            {title} 
        </Text>    
    </View>
)

const TabsLayout = () => {
  return (
    <Tabs
        screenOptions={{
            tabBarShowLabel: false,
            tabBarStyle: {  
                backgroundColor: 'white',
                position: 'absolute',
                borderTopColor: '#0061FF1A',
                borderTopWidth: 1,
                minHeight: 70,
                }
        }}    
    >
        <Tabs.Screen
            name="assign"
            options={{
                title:"Assign",
                headerShown: false,
                tabBarIcon: ({ focused}) => (
                    <View>
                        <TabIcon icon={icons.location} 
                        focused={focused} title="Assign" />
                    </View>
                )
            }}
        />

        <Tabs.Screen
            name="hour"
            options={{
                title:"Hours",
                headerShown: false,
                tabBarIcon: ({ focused}) => (
                    <View>
                        <TabIcon icon={icons.calendar} 
                        focused={focused} title="Hours" />
                    </View>
                )
            }}
        />

        <Tabs.Screen
            name="jobsite"
            options={{
                title:"Job Sites",
                headerShown: false,
                tabBarIcon: ({ focused}) => (
                    <View>
                        <TabIcon icon={icons.edit} 
                        focused={focused} title="Job Sites" />
                    </View>
                )
            }}
        />
        
        <Tabs.Screen
            name="aprofile"
            options={{
                title:"Profile",
                headerShown: false,
                tabBarIcon: ({ focused}) => (
                    <View>
                        <TabIcon icon={icons.person} 
                        focused={focused} title="Profile" />
                    </View>
                )
            }}
        />
    </Tabs>    
  )
}

export default TabsLayout