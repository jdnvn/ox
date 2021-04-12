import React, { Component } from 'react';
import { StyleSheet, AsyncStorage , Image, View} from 'react-native';
import 'react-native-gesture-handler';
import {NavigationContainer, DarkTheme, DefaultTheme} from '@react-navigation/native';
import {createStackNavigator, HeaderBackground} from '@react-navigation/stack';
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
import { createMultiStyleIconSet } from '@expo/vector-icons';
import {AppLoading, SplashScreen} from 'expo';
import {createNavigator} from "./router"

const Stack = createStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'rgb(255, 45, 85)',
  },
};


export default class App extends Component {
  state={
    authenticated: false,
    isLoading: true,
    isSplashReady: false
  }

  async componentDidMount() {
    try {
      const token = await AsyncStorage.getItem('accessToken')
      if(token === null) {
        this.setState({authenticated:false, isLoading: false})
      }else{
        const tokenExpirationTime = await AsyncStorage.getItem('expirationTime');
        if (!tokenExpirationTime || new Date().getTime() > tokenExpirationTime) {
          await refreshTokens();
        }
        this.setState({authenticated:true, isLoading: false})
      }
    } catch(error) {
      alert(error)
    }
  }


  render() {
    // if(!this.state.isSplashReady) {
    //   return (
    //     <AppLoading
    //       startAsync={this.getAuthInfo}
    //       onFinish={()=>this.setState({isLoading:false})}
    //       autoHideSplash={false}
    //     />
    //   );
    // }

    if(this.state.isLoading){
      return (
        <View style={{backgroundColor:'black', alignItems: 'center', justifyContent: 'center', flex: 1}}>
          <Image
            source={require('./assets/splash.png')}
            style={{alignSelf:'center', height:370, width:370}}
          />
        </View>
      );
    }


    return (
      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator>
          {this.state.authenticated === false || AsyncStorage.getItem('accessToken') === null ? (
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ title: 'Login', headerShown: false}}
          />

          ) : [
            <Stack.Screen
            name="Home"
            component={Home}
            options={{headerTitle:(<Image style={styles.headerImage} source={require('./assets/loginlogo.png')} />), headerTitleStyle:{alignSelf:'center'}, headerLeft: null}}
            />,
            <Stack.Screen
            name="Profile"
            component={Profile}
            options={{title: 'Profile'}}
            />,
            <Stack.Screen
            name="Following"
            component={Following}
            options={{title: 'Following'}}
            />,
            <Stack.Screen
            name="Userprofile"
            component={Userprofile}
            options={{title: 'User', headerBackTitle: "   "}}
            />
          ]}

        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}

const styles = StyleSheet.create({
  headerImage: {
    width: 35,
    height: 35,
    alignSelf: 'center'
  }
})

