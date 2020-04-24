import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View, TextInput, Dimensions, Button, Image, StatusBar, AsyncStorage } from 'react-native';
import 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Expo, {Constants} from 'expo'
import * as AuthSession from 'expo-auth-session';
import axios from 'axios'
import { encode as btoa } from 'base-64';
import firebase from '../config';
import db from '../database';


const scopesArr = ['user-modify-playback-state','user-read-currently-playing','user-read-playback-state','user-library-modify',
                   'user-library-read','playlist-read-private','playlist-read-collaborative','playlist-modify-public',
                   'playlist-modify-private','user-read-recently-played','user-top-read'];
const scopes = scopesArr.join(' ');

const getSpotifyCredentials = async () => {
  const res = await axios.get('https://7beuh3g3ye.execute-api.us-east-2.amazonaws.com/default/spotify-credentials')
  const spotifyCredentials = res.data
  return spotifyCredentials
}

const getAuthorizationCode = async () => {
//   try {
    const credentials = await getSpotifyCredentials() //we wrote this function above
    const redirectUrl = AuthSession.getRedirectUrl();
    const result = await AuthSession.startAsync({
      authUrl:
        'https://accounts.spotify.com/authorize' +
        '?client_id=' +
        credentials.clientId +
        '&response_type=code' +
        '&redirect_uri=' +
        encodeURIComponent(redirectUrl) +
        (scopes ? '&scope=' + encodeURIComponent(scopes) : '')
    });
    if (result.errorCode !== undefined) {
        console.log(result.errorCode)
        return
    }
//   } catch (err) {
//     console.error(err)
//   }
  return result.params.code
}

const writeUserData = (spotifyid) => {
  db.ref('Users/').set({
      spotifyid
  }).then((data)=>{
      //success callback
      console.log('data ' , data)
  }).catch((error)=>{
      //error callback
      console.log('error ' , error)
  })
}



const getTokens = async () => {
    try {
      const authorizationCode = await getAuthorizationCode() //we wrote this function above
      const credentials = await getSpotifyCredentials() //we wrote this function above (could also run this outside of the functions and store the credentials in local scope)
      const credsB64 = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credsB64}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${
          credentials.redirectUri
        }`,
      });
      const responseJson = await response.json();
      // destructure the response and rename the properties to be in camelCase to satisfy my linter ;)
      const {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
      } = responseJson;
  
      const expirationTime = new Date().getTime() + expiresIn * 1000;
      await setUserData('accessToken', accessToken);
      await setUserData('refreshToken', refreshToken);
      await setUserData('expirationTime', expirationTime);
    } catch (err) {
      console.error(err);
    }
}

export const refreshTokens = async () => {
    try {
      const credentials = await getSpotifyCredentials() //we wrote this function above
      const credsB64 = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
      const refreshToken = await getUserData('refreshToken');
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credsB64}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
      });
      const responseJson = await response.json();
      if (responseJson.error) {
        await getTokens();
      } else {
        const {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          expires_in: expiresIn,
        } = responseJson;
  
        const expirationTime = new Date().getTime() + expiresIn * 1000;
        await setUserData('accessToken', newAccessToken);
        if (newRefreshToken) {
          await setUserData('refreshToken', newRefreshToken);
        }
        await setUserData('expirationTime', expirationTime);
      }
    } catch (err) {
      console.error(err)
    }
}

export const getValidSPObj = async () => {
  const tokenExpirationTime = await getUserData('expirationTime');
  console.log(tokenExpirationTime)
  if (new Date().getTime() > tokenExpirationTime) {
    // access token has expired, so we need to use the refresh token
    await refreshTokens();
  }
  const accessToken = await getUserData('accessToken');
  var sp = new SpotifyWebAPI();
  await sp.setAccessToken(accessToken);
  return sp;
}

export const setUserData = async (field, value) => {
  try {
    await AsyncStorage.setItem(field, value)
  }catch(error){
    console.log(error)
  }
}

export const getUserData = async (field, value) => {
  try {
    return await AsyncStorage.getItem(field, value)
  }catch(error){
    return error
  }
}

export default class Login extends Component {
    state = {
      
    }

    loginHandler = async () => {
      await getTokens()
      const sp = await getValidSPObj()
    //   dbref = db.ref("Users")
    //   try {
    //     // await getTokens()
    //     const sp = await getValidSPObj()
    //     const { id: userId, display_name: display_name, images: images, uri: uri} = await sp.getMe()
    //     dbref.child("userId").equalTo(userId).once("value").then(snapshot => {
    //       if (snapshot.exists()) {
    //         let userData = snapshot.val()
    //         console.log(userData)
    //       }else{
    //         dbref.set({
    //           userId: userId,
    //           display_name: display_name,
    //           images: images,
    //           uri: uri,
    //           playing: null
    //         })
    //       }
    //     })
    //   } catch(error) {
    //     console.log(error)
    //   }
    }

    render() {
        this.loginHandler()
        return (
            <View style={styles.container}>
                <Text>Login</Text>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });