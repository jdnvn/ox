import {createStackNavigator, HeaderBackground} from '@react-navigation/stack';
import {createSwitchNavigator} from "react-navigation";
import Login from './components/login'
import React, { Component } from 'react';

const Auth = createStackNavigator();

export default class AuthNav extends Component {
    render() {
        return(
            <NavigationContainer theme={DarkTheme}>
                <Auth.Navigator>
                    <Auth.Screen
                    name="Login"
                    component={Login}
                    options={{ title: 'Login', headerShown: false}}
                    />
                </Auth.Navigator>
            </NavigationContainer>
        )
    }
}