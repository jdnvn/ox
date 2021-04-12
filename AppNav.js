import {createStackNavigator, HeaderBackground} from '@react-navigation/stack';
import {createSwitchNavigator} from "react-navigation";
import Profile from './components/profile';
import Home from './components/home';
import Following from './components/following';
import Queue from './components/queue';
import Userprofile from './components/userprofile';
import React, { Component } from 'react';

const App = createStackNavigator();

export default class AppNav extends Component{
    render() {
        return(
            <NavigationContainer theme={DarkTheme}>
                <App.Navigator>
                <App.Screen
                name="Home"
                component={Home}
                options={{headerTitle:(<Image style={styles.headerImage} source={require('./assets/loginlogo.png')} />), headerTitleStyle:{alignSelf:'center'}, headerLeft: null}}
                />
                <App.Screen
                name="Profile"
                component={Profile}
                options={{title: 'Profile'}}
                />
                <App.Screen
                name="Following"
                component={Following}
                options={{title: 'Following'}}
                />
                <App.Screen
                name="Userprofile"
                component={Userprofile}
                options={{title: 'User', headerBackTitle: "   "}}
                />
                <App.Screen
                name="Queue"
                component={Queue}
                />
                </App.Navigator>
            </NavigationContainer>
        )
    }
}