import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View, TextInput, Dimensions, Button, Image, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Profile from './profile';
import Following from './following';
import Search from './search';

const Tab = createBottomTabNavigator()

export default class Home extends Component {
    render() {
        return(
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
        
                    if (route.name === 'Profile') {
                        iconName = 'account';
                    } else if (route.name === 'Music') {
                        iconName = 'music';
                    }else {
                        iconName = 'account-search'
                    }
        
                    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                    },
                })}
                tabBarOptions={{
                    activeTintColor: '#4254f5',
                    inactiveTintColor: 'gray'
                }}
            >
                <Tab.Screen name="Music" component={Following} />
                <Tab.Screen name="Search" component={Search} />
                <Tab.Screen name="Profile" component={Profile} />
            </Tab.Navigator>
            </TouchableWithoutFeedback>
        );
    }
}
