import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View, TextInput, Dimensions, Button, Image, AsyncStorage, FlatList, ScrollView } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Profile from './profile';
import db from '../database'
import { getUserData, getValidSPObj, setUserData } from './login';
import { ListItem, Avatar } from "react-native-elements";
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';



export const getTrackInfo = async (sp, uri) => {
  let trackId = uri.slice(14, uri.length + 1)
  const trackInfo = await sp.getTrack(trackId).then(result => result)
  return trackInfo
}


export default class Following extends Component {
  state = {
    isFetching: false,
    userId: ""
  }

  activeDevices = (devices) => {
    let active = false
    devices.forEach(device => {
      if (device.is_active) active = true
    })
    return active
  }

  playSong = async (userId, song) => {
    try {
      let sp = await getValidSPObj()
      let currUser = await sp.getMe()
      let devices = (await sp.getMyDevices()).devices
      let active = this.activeDevices(devices)
      if (devices.length > 0 && !active) {
        let device = devices[0].id
        sp.transferMyPlayback([device], { play: true })
        devices = (await sp.getMyDevices()).devices
        active = this.activeDevices(devices)
      }

      db.ref("Users/" + currUser.id + "/song/listeningTo").once("value", async snapshot => {
        //pause and remove listener if click on same name
        if (snapshot.exists() && snapshot.val() === userId) {
          sp.pause()
          db.ref().child("Users/" + currUser.id + "/song").update({
            listeningTo: null,
            is_playing: false
          })
          db.ref().child("Users/" + userId + "/listeners").orderByValue().equalTo(currUser.id).once("value", snapshot => {
            if (snapshot.exists()) {
              let key = Object.keys(snapshot.val())[0]
              db.ref("Users/" + userId + "/listeners/" + key).remove()
            }
          })
        } else if (currUser.product === "premium" && devices.length > 0 && active) {
          db.ref("Users/" + userId + "/song/listeningTo").once("value", async listening => {
            // If they aren't listening to another user
            if (!listening.exists()) {
              if (snapshot.exists() && snapshot.val() !== userId) {
                let listeningToPrevious = snapshot.val()
                db.ref().child("Users/" + listeningToPrevious + "/listeners").orderByValue().equalTo(currUser.id).once("value", snapshot => {
                  if (snapshot.exists()) {
                    let key = Object.keys(snapshot.val())[0]
                    db.ref("Users/" + listeningToPrevious + "/listeners/" + key).remove()
                  }
                })
              }

              if (song !== null) {
                try {
                  sp.play({ uris: [song] })

                  db.ref().child("Users/" + currUser.id + "/song").update({
                    listeningTo: userId,
                    is_playing: true
                  })
                  // db.ref().child("Users/" + userId + "/listeners").orderByValue().equalTo(currUser.id).on("value", snapshot => {
                  //   if (!snapshot.exists()) {
                  //   }
                  // })
                  db.ref().child("Users/" + userId + "/listeners").push().set(currUser.id)
                } catch (error) {
                  console.log(error)
                }
              }
            } else {
              alert("You can't listen to them because they are currently listening to someone")
            }
          })
          // remove self from previous player's listeners list

        } else if (currUser.product !== "premium") {
          alert("You need Spotify Premium to listen to friends")
        } else {
          alert("Go into Spotify on any device and play a track")
        }
      })
    } catch (error) {
      console.log(error)
    }
  }

  async onRefresh() {
    this.setState({ isFetching: true }, function () { this.setEntries() })
  }

  setEntries = async () => {
    let sp = await getValidSPObj()
    let id = (await sp.getMe()).id

    let data = []

    db.ref().child("Users/" + id + "/following").orderByValue().on("value", snapshot => {
      snapshot.forEach(user => {
        // if(db.ref("Users/"+user.val()+"hidden"))
        db.ref().child("Users/" + user.val() + "/hidden").on("value", value => {
          if (value.exists() && value.val()) {
          } else {
            db.ref().child("Users/" + user.val() + "/song").on("value", snapshot => {
              if (snapshot.exists()) {
                let dataObj = {}
                let obj = snapshot.val()
                dataObj.song_uri = obj["song_uri"]
                dataObj.song_title = obj["song_title"]
                dataObj.song_artist = obj["song_artist"]
                dataObj.is_playing = obj["is_playing"]
                dataObj.listeningTo = obj["listeningTo"]
                db.ref().child("Users/" + user.val()).on("value", object => {
                  let obj = object.val()
                  dataObj.userId = obj["userId"]
                  dataObj.uri = obj["uri"]
                  dataObj.display_name = obj["display_name"]
                  dataObj.profile_pic = obj["profile_pic"]
                })

                data.push(dataObj)
              }
            })
          }
        })
      })
    })
    this.setState({ following: data, isFetching: false })
  }

  updateSong = async () => {
    let sp = await getValidSPObj()
    let currUser = await sp.getMe()
    let currUserId = currUser.id
    sp.getMyCurrentPlayingTrack().then(async track => {
      if (track === null || track.item === null || Object.keys(track).length === 0) {
      } else if (track.currently_playing_type === "track") {
        db.ref().child("Users/" + currUserId + "/song").once("value", async snapshot => {
          if (snapshot.exists()) {
            let song = snapshot.val()
            if (song.song_uri !== track.item.uri) {
              db.ref().child("Users/" + currUserId + "/song").update({
                song_title: track.item.name,
                song_artist: track.item.artists[0].name,
                song_uri: track.item.uri,
                is_playing: track.is_playing
              })

              db.ref("Users/" + currUserId + "/song/listeningTo").once("value", async snapshot => {
                if (snapshot.exists()) {
                  let listeningToUser = snapshot.val()
                  db.ref().child("Users/" + listeningToUser + "/song").on("value", async (object) => {
                    if (object.exists() && object.val().listeningTo === undefined) { //if listeningTo user isnt listening to anybody
                      let song = object.val()
                      if (song.song_uri !== track.item.uri) {
                        try {
                          sp.play({ uris: [song.song_uri] })
                        } catch (error) {
                          console.log(error)
                        }
                      }
                    } else if (object.exists() && object.val().listeningTo !== undefined) {
                      db.ref().child("Users/" + currUserId + "/song").update({
                        listeningTo: null,
                        is_playing: false
                      })
                      db.ref().child("Users/" + listeningToUser + "/listeners").orderByValue().equalTo(currUserId).once("value", snapshot => {
                        if (snapshot.exists()) {
                          let key = Object.keys(snapshot.val())[0]
                          db.ref("Users/" + listeningToUser + "/listeners/" + key).remove()
                        }
                      })
                    }
                  })
                }
              })
            }
          } else {
            db.ref().child("Users/" + currUserId + "/song").update({
              song_title: track.item.name,
              song_artist: track.item.artists[0].name,
              song_uri: track.item.uri,
              is_playing: track.is_playing
            })
          }

        })
      }
    }).catch(error => {
      console.log(error)
    })
    this.setEntries() // call when database updates!
  }


  async componentDidMount() {
    await this.setEntries()
    this.interval = setInterval(this.updateSong, 3000)
    let sp = await getValidSPObj()
    let currUserId = (await sp.getMe()).id
    this.setState({ userId: currUserId })
  }

  async componentWillUnmount() {
    clearInterval(this.interval);
    db.ref().child("Users/" + this.state.userId + "/song").update({
      is_playing: false,
      listeningTo: undefined
    })
  }

  goToProfile = (userId) => {
    this.props.navigation.navigate('Userprofile', { userId: userId, me: this.state.userId })
  }

  renderItems = ({ item }) =>
    <ListItem
      containerStyle={styles.listItem}
      title={item.display_name}
      titleStyle={styles.listTitle}
      leftAvatar={{ source: { uri: item.profile_pic }, onPress: () => this.goToProfile(item.userId) }}
      subtitle={item.song_title + "\n" + item.song_artist}
      subtitleStyle={styles.subtitleStyle}
      subtitleProps={{ onPress: () => this.playSong(item.userId, item.song_uri) }}
      key={item.userId}
      rightElement={
        function () {
          let iconName = ''
          let color = ''
          if (!item.is_playing) {
            iconName = ''
            color = 'gray'
          } else if (item.listeningTo !== undefined) {
            iconName = 'account-multiple'
            color = '#90EE90'
          } else {
            iconName = 'volume-high'
            color = '#90EE90'
          }
          let badge = <Text />
          db.ref().child("Users/" + item.userId + "/listeners").once("value", snapshot => {
            if (snapshot.exists()) {
              let listeners = snapshot.val()
              badge = (<Text style={{ color: 'gray' }}>{Object.keys(listeners).length}</Text>)
            }
          })
          return <View style={{ alignItems: 'center' }}><MaterialCommunityIcons name={iconName} size={20} color={color} />{badge}</View>;
        }
      }
      bottomDivider
      topDivider
      chevron={{ color: 'black' }}
    // onPress={()=>this.playSong(item.userId, item.song_uri)}
    />



  render() {
    return (
      <View>
        <FlatList
          data={this.state.following}
          renderItem={this.renderItems}
          style={{ height: Dimensions.get('window').height }}
          keyExtractor={(item, index) => item.userId}
          onRefresh={() => this.onRefresh()}
          refreshing={this.state.isFetching}
        />
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
  subtitleStyle: {
    color: 'gray'
  }
})
