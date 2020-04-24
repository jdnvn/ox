import React, { Component } from 'react';
import { StyleSheet } from 'react-native';
import 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Login from './components/login';
import firebase from './config';
import "firebase/database";
import "firebase/functions";

const Stack = createStackNavigator();


export default class App extends Component {
  setRoute = async () => {
    // try {
    //   const authenticated = await AsyncStorage.getItem('authenticated')
    //   if (authenticated === null) {
    //     return 'Login'
    //   }
    //   else {
    //     return 'Home'
    //   }
    // } catch (error) {
    //   alert(error)
    // }
    return 'Login'
  }
  

  render() {
    return (
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName= {this.setRoute}
          screenOptions={{ gestureEnabled: false }}>
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ title: 'Login', headerShown: false}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}


