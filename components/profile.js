import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View, TextInput, Dimensions, Button, Image, AsyncStorage } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Login from './login';
import {getUserData, getValidSPObj} from './login'
import Following, {getTrackInfo} from './following';
import db from '../database';
import {Tile} from 'react-native-elements';

export const follow = async (userId) => {
    dbref = db.ref()
    let currId = await getUserData('userId')
    if(userId !== currId && currId !== null){
        dbref.child("Users/"+currId+"/following").orderByValue().equalTo(userId).once("value", snapshot => {
            if(snapshot.exists()){
                alert("you already follow them")
            }else{
                dbref.child("Users/"+currId+"/following").push().set(userId)
            }
        })
    }
    
}


export default class Profile extends Component {
    state = {
        display_name: ""
    }


    async componentDidMount() {
        let sp = await getValidSPObj()
        let me = await sp.getMe()
        this.setState({
            display_name: await getUserData('display_name'),
            profile_pic: {uri: await getUserData('profile_pic')},
            userId: await getUserData('userId'),
            followercount: me.followers.total
        }) 
        // if(this.state.song !== null){
        //     let sp = await getValidSPObj()
        //     let trackInfo = await getTrackInfo(sp, this.state.song)
        //     this.setState({
        //         song_title: trackInfo.name,
        //         song_artist: trackInfo.artists[0].name
        //     })
        // }
    }

    // async logout() {
    //     await AsyncStorage.removeItem('userId');
    //     await AsyncStorage.removeItem('display_name');
    //     await AsyncStorage.removeItem('uri');
    //     await AsyncStorage.removeItem('accessToken');
    //     await AsyncStorage.removeItem('refreshToken');
    //     await AsyncStorage.removeItem('expirationTime');
    //     this.props.navigation.navigate('Login')
    // }


    render(){
        return(
            <View style={styles.container}>
                <Image source={this.state.profile_pic} style={styles.profileImg} />
                <Text style={styles.text}>{this.state.display_name}</Text>
                <Text style={styles.followers}>{this.state.followercount} Followers</Text>
                {/* <Button title="Log out" onPress={this.logout}></Button> */}
                {/* <Text style={styles.song}>Now Playing:{'\n'}{this.state.song_title}{'\n'}{this.state.song_artist}</Text> */}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 50
    },
    text: {
        fontSize: 30,
        color: 'white'
    },
    followers:{
        fontSize: 20,
        color: '#32a852'
    },
    profileImg: {
        marginLeft: 8,
        height: 80,
        width: 80,
        borderRadius: 40,
        overflow: "hidden"
    },
    song: {
        marginTop: 20,
        fontSize: 20,
        color: '#32a852'
    }
})