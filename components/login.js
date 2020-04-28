import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View, TextInput, Dimensions, Button, Image, StatusBar, AsyncStorage, Linking } from 'react-native';
import 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Expo, {Constants, WebBrowser} from 'expo'
import * as AuthSession from 'expo-auth-session';
import axios from 'axios'
import { encode as btoa } from 'base-64';
import firebase from '../config';
import db from '../database';
import SpotifyWebAPI from 'spotify-web-api-js';
import GradientButton from 'react-native-gradient-buttons';
import * as AppAuth from 'expo-app-auth';


const scopesArr = ['user-modify-playback-state','user-read-currently-playing','user-read-playback-state','user-library-modify',
                   'user-library-read','playlist-read-private','playlist-read-collaborative','playlist-modify-public',
                   'playlist-modify-private','user-read-recently-played','user-top-read', 'user-read-private'];
const scopes = scopesArr.join(' ');

const getSpotifyCredentials = async () => {
  const res = await axios.get('https://7beuh3g3ye.execute-api.us-east-2.amazonaws.com/default/spotify-credentials')
  const spotifyCredentials = res.data
  return spotifyCredentials
}

const getAuthorizationCode = async () => {
  try {
    const credentials = await getSpotifyCredentials()
    const redirectUrl = AuthSession.getRedirectUrl();
    // FOR SOME REASON CAN'T CONNECT TO THIS URL?
    const result = await AuthSession.startAsync({
      authUrl:
        'https://accounts.spotify.com/authorize' +
        '?client_id=' + credentials.clientId +
        '&response_type=code'+
        '&redirect_uri=' + encodeURIComponent(redirectUrl) +
        (scopes ? '&scope=' + encodeURIComponent(scopes) : '')   
    });

    return result.params.code 
  } catch (err) {
    alert(err)
    console.log(error)
    return error
  }
}


const getTokens = async () => {
    try {
      const authorizationCode = await getAuthorizationCode()
      const credentials = await getSpotifyCredentials()
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

      const {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
      } = responseJson;
  
      const expirationTime = new Date().getTime() + expiresIn * 1000;
      await setUserData('accessToken', accessToken);
      await setUserData('refreshToken', refreshToken);
      await setUserData('expirationTime', expirationTime.toString());

    } catch (err) {
      console.error(err);
    }
}

export const refreshTokens = async () => {
    try {
      const credentials = await getSpotifyCredentials()
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
        await setUserData('expirationTime', expirationTime.toString());
      }
    } catch (err) {
      console.error(err)
    }
}

export const getValidSPObj = async () => {
  const tokenExpirationTime = await getUserData('expirationTime');
  if (new Date().getTime() > parseInt(tokenExpirationTime)) {
    // access token has expired, so we need to use the refresh token
    await refreshTokens();
  }
  // console.log("past if")
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

export const getUserData = async (field) => {
  try {
    return await AsyncStorage.getItem(field)
  }catch(error){
    return error
  }
}


export default class Login extends Component {

    state = {

    }

    loginSuccess = async (userId, display_name, image, uri) => {
      // await setUserData('authenticated', true)
      const id = await getUserData(userId)
      if(id === null){
        await setUserData('userId', userId)
        await setUserData('display_name', display_name)
        await setUserData('profile_pic', image)
        await setUserData('uri', uri)
      }
      // await setUserData("authenticated", true)
      this.props.navigation.navigate("Home")
    }

    loginFailed = async () => {
      alert("Something went wrong, try logging in again")
    }

    loginHandler = async () => {
      await getTokens()
      let dbref = db.ref()
      try {
        // await getTokens()
        const sp = await getValidSPObj()
        const { id: userId, display_name: display_name, images: images, uri: uri} = await sp.getMe()
        let profile_pic = images.length !== 0 ? images[0].url : "https://firebasestorage.googleapis.com/v0/b/spotify-project-dd13e.appspot.com/o/default.jpg?alt=media&token=fb5e3a36-9fa7-424d-a3b5-1b9f2c79695d"
        dbref.child("Users").orderByChild("userId").equalTo(userId).on("value", snapshot => {
          if (snapshot.exists()) {
            // USER HAS BEEN LOGGED IN BEFORE
          }else{
            
            dbref.child("Users/"+userId).set({
              userId: userId,
              display_name: display_name,
              profile_pic: profile_pic,
              uri: uri,
            })
          }

          sp.getMyCurrentPlayingTrack().then(async track => {
            if(Object.keys(track).length === 0){
              alert("Log in to this Spotify account on any device to start listening!")
            }else{
              if(track.currently_playing_type === "track"){
                dbref.child("Users/"+userId+"/song").set({
                  song_title: track.item.name,
                  song_artist: track.item.artists[0].name,
                  song_uri: track.item.uri,
                  is_playing: track.is_playing
                })
                await AsyncStorage.setItem("song", track.item.uri)
              }
            }
          })
          
        }).then(this.loginSuccess(userId, display_name, profile_pic, uri))
        .catch(async (error) => {
          await loginFailed();
          console.log(error);
        })
      } catch(error) {
        console.log(error)
      }
    }

    // async componentDidMount() {
    //   await this.loginHandler()
    // }

    login = async () => {
        await this.loginHandler()
    }

    // async componentDidMount() {
    //   let auth = await getUserData('authenticated')
    //   if(auth !== null){
    //     this.props.navigation.navigate("Home")
    //   }
    // }

    render() {
        return (
            <View style={styles.container}>
                <Image source={require('../assets/loginlogo.png')}/>
                <Text style={styles.title}>Listen with friends</Text>
                <GradientButton
                    style={{marginTop: Dimensions.get('window').height/10}}
                    gradientBegin='#32a852'
                    gradientEnd='#72c46e'
                    gradientDirection='diagonal'
                    text = 'CONNECT WITH SPOTIFY'
                    height={50}
                    width={200}
                    impact
                    impactStyle='Light'
                    textStyle={{fontSize: 15}}
                    onPressAction={ this.login }
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Dimensions.get('window').height/5
    },
    title: {
      color:'white',
      fontFamily:'Helvetica Neue',
      fontSize:25,
      paddingBottom:15,
      paddingTop: 25
    }
  });