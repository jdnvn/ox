import React, { Component } from 'react';
import { StyleSheet, AsyncStorage } from 'react-native';
import 'react-native-gesture-handler';
import {NavigationContainer, DarkTheme, DefaultTheme} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Login from './components/login';
import Profile from './components/profile'
import Home from './components/home'
import Following from './components/following'
import firebase from './config';
import "firebase/database";
import "firebase/functions";

const Stack = createStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'rgb(255, 45, 85)',
  },
};

export default class App extends Component {
  setRoute = async () => {
    try {
      const auth = await AsyncStorage.getItem('authenticated')
      if(auth === null) {
        return 'Login'
      }else{
        return 'Home'
      }
    } catch(error) {
      alert(error)
    }
  }
  

  render() {
    return (
      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator
          initialRouteName= {this.setRoute}
          screenOptions={{ gestureEnabled: false }}>
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ title: 'Login', headerShown: false}}
          />
          <Stack.Screen
            name="Home"
            component={Home}
            options={{title: 'OX', headerTitleStyle:{color: '#4254f5', fontSize: 25, fontWeight: 'bold', fontFamily: 'Arial Rounded MT Bold'}, headerLeft: null}}
          />
          <Stack.Screen
          name="Profile"
          component={Profile}
          options={{title: 'Profile'}}
          />
          <Stack.Screen
          name="Following"
          component={Following}
          options={{title: 'Following'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}


