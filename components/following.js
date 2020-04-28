import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View, TextInput, Dimensions, Button, Image, AsyncStorage, FlatList, ScrollView } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Profile from './profile';
import db from '../database'
import { getUserData, getValidSPObj, setUserData } from './login';
import {ListItem, Avatar} from "react-native-elements";
import { MaterialCommunityIcons } from '@expo/vector-icons';



const playSong = async (userId, song) => {
    let sp = await getValidSPObj()
    let currUser = await sp.getMe()
    console.log(userId)
    if(currUser.product === "premium") {
        let listeningTo = await AsyncStorage.getItem("ListeningTo")
        if(listeningTo !== null && listeningTo === userId){
            sp.pause()
            await AsyncStorage.removeItem("ListeningTo")
        }else{
            sp.play({uris: [song]})
            let trackInfo = await getTrackInfo(sp, song)
            db.ref().child("Users").orderByChild("userId").equalTo(currUser.id).on("value", snapshot => {
                if(snapshot.exists()){
                    db.ref().child("Users/"+currUser.id+"/song").set({
                        song_title: trackInfo.name,
                        song_artist: trackInfo.artists[0].name,
                        song_uri: trackInfo.uri,
                        is_playing: true
                    })
                }
            })
            await setUserData("ListeningTo", userId)
            await setUserData("song", uri)
        }
    }else{
        alert("You need Spotify Premium for that track")
    }
}

export const getTrackInfo = async (sp, uri) => {
    let trackId = uri.slice(14, uri.length+1)
    const trackInfo = await sp.getTrack(trackId).then(result => result)
    return trackInfo
}


export default class Following extends Component {
    state = {
        isFetching: false
    }

    async onRefresh() {
        this.setState({isFetching: true}, function(){ this.setEntries() })
    }

    setEntries = async () => {
        let sp = await getValidSPObj()
        let id = (await sp.getMe()).id

        let data = []
        
        db.ref().child("Users/"+id+"/following").orderByValue().on("value", snapshot=>{
            snapshot.forEach(user=>{
                db.ref().child("Users/"+user.val()+"/song").on("value", snapshot => {
                    if(snapshot.exists()){
                        let dataObj = {}
                        db.ref().child("Users/"+user.val()).on("value", object=>{
                            let obj = object.val()
                            dataObj.display_name = obj["display_name"]
                            dataObj.profile_pic = obj["profile_pic"]
                            dataObj.userId = obj["userId"]
                            dataObj.uri = obj["uri"]
                        })
                        db.ref().child("Users/"+user.val()+"/song").on("value", object=>{
                            let obj = object.val()
                            dataObj.song_uri = obj["song_uri"]
                            dataObj.song_title = obj["song_title"]
                            dataObj.song_artist = obj["song_artist"]
                            dataObj.is_playing = obj["is_playing"]
                        })
                        data.push(dataObj)
                    }
                })
            })
        })
        this.setState({following: data, isFetching: false})
    }

    async componentDidMount() {
        await this.setEntries() // call when database updates!
        let sp = await getValidSPObj()
        let currUserId = (await sp.getMe()).id
        this.interval = setInterval(async () => {
            let nowPlaying = await AsyncStorage.getItem("song")
            sp.getMyCurrentPlayingTrack().then(async track => {
                if(Object.keys(track).length === 0){
                }else if(track.currently_playing_type === "track" && track.item.uri !== nowPlaying){

                    let listeningToUser = await AsyncStorage.getItem("ListeningTo")
                    if(listeningToUser !== null){
                        db.ref().child("Users/"+listeningToUser+"/song").on("value", async (object)=>{
                            let song = object.val()
                            if(song !== null && song.uri !== track.item.uri){
                                playSong(listeningToUser, song.uri)
                            }
                        })
                    }
                    let trackItem = track.item
                    db.ref().child("Users").orderByChild("userId").equalTo(currUserId).on("value", snapshot => {
                        if(snapshot.exists()){
                            db.ref().child("Users/"+currUserId+"/song").set({
                                song_title: trackItem.name,
                                song_artist: trackItem.artists[0].name,
                                song_uri: trackItem.uri,
                                is_playing: track.is_playing
                            })
                        }
                    })

                    await setUserData("song", trackItem.uri)
                }
            }).catch(error=>{
                console.log(error)
            })
            this.setEntries() // call when database updates!
        }, 3000)
    }
    

    renderItems = ({item}) =>
      <ListItem 
        containerStyle = {styles.listItem}
        title={item.display_name}
        titleStyle={styles.listTitle} 
        leftAvatar={{source: {uri: item.profile_pic}}} 
        subtitle={item.song_title+"\n"+item.song_artist}
        subtitleStyle={styles.subtitleStyle} 
        rightIcon={
            function(){
                let iconName = item.is_playing ? 'volume-high' : 'sleep'
                return <MaterialCommunityIcons name={iconName} size={25} color='#90EE90' />;
            }
        }
        bottomDivider
        topDivider
        chevron = {{color: 'black'}}
        onPress={() => playSong(item.userId, item.song_uri)}
      />
    

    
    render(){
        return(
            <View>
                <ScrollView>
                    <FlatList
                        data={this.state.following}
                        renderItem={this.renderItems}
                        keyExtractor={item => item.userId}
                        onRefresh={() => this.onRefresh()}
                        refreshing={this.state.isFetching}
                    />
                </ScrollView>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    listItem: {
        backgroundColor: 'black',
        shadowColor: 'black',
        borderTopColor: 'black',
        borderBottomColor: 'black'
    },
    listTitle: {
        color: 'white',
        fontWeight: 'bold'
    },
    subtitleStyle:{
        color: 'gray'
    }
})