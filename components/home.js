import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View, TextInput, Dimensions, Button, Image, TouchableWithoutFeedback, Keyboard, AsyncStorage } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Profile from './profile';
import Following from './following';
import Search from './search';
import db from '../database';
import {getValidSPObj} from './login'
import { getUserData, setUserData } from './login';

const Tab = createBottomTabNavigator()

export default class Home extends Component {
  async componentDidMount() {
    try {
      let auth = AsyncStorage.getItem('authenticated')

      if (auth === null) {
        AsyncStorage.setItem('authenticated', true)
      }
    } catch (error) {
      alert(error)
      console.log(error)
    }

    let dbref = db.ref()
    const sp = await getValidSPObj()
    const { id: userId, images: images } = await sp.getMe()
    const profile_pic = images.length > 0 ? images[0].url : "https://firebasestorage.googleapis.com/v0/b/spotify-project-dd13e.appspot.com/o/default.jpg?alt=media&token=fb5e3a36-9fa7-424d-a3b5-1b9f2c79695d"
    dbref.child("Users/" + userId).update({ profile_pic: profile_pic })
  }

  render() {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Profile') {
                iconName = 'account';
              } else if (route.name === 'Music') {
                iconName = 'music';
              } else {
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
