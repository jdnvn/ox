import React, { Component } from 'react';
import { StyleSheet, AsyncStorage , Image, View} from 'react-native';
import 'react-native-gesture-handler';
import {NavigationContainer, DarkTheme, DefaultTheme} from '@react-navigation/native';
import {createStackNavigator, HeaderBackground} from '@react-navigation/stack';
import {createSwitchNavigator, createAppContainer} from "react-navigation";
import Login from './components/login';
import Profile from './components/profile'
import Home from './components/home'
import Following from './components/following'
import Queue from './components/queue'
import firebase from './config';
import "firebase/database";
import "firebase/functions";
import {refreshTokens} from './components/login'
import Userprofile from './components/userprofile';
import AuthNav from './AuthNav';
import AppNav from './AppNav';


const createNavigator = (signedIn = false) => {
    return createSwitchNavigator(
        {
            Auth: AuthNav,
            App: AppNav
        },
        {
            initialRouteName: signedIn ? "App" : "Auth"
        }
    )
}

export default createAppContainer(createNavigator)