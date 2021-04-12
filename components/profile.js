import React, { Component } from 'react';
import { StyleSheet, Text, View, Dimensions, Button, Image, AsyncStorage, ScrollView, SafeAreaView, ImageBackground, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Login from './login';
import { getUserData, getValidSPObj } from './login'
import Following, { getTrackInfo } from './following';
import db from '../database';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const follow = async (userId) => {
  let dbref = db.ref()
  let currId = await getUserData('userId')
  if (userId !== currId && currId !== null) {
    dbref.child("Users/" + currId + "/following").orderByValue().equalTo(userId).once("value", snapshot => {
      let followers = db.ref("Users/" + userId + "/followers")
      if (snapshot.exists()) {
        let key = Object.keys(snapshot.val())[0]
        db.ref("Users/" + currId + "/following/" + key).remove()
        followers.transaction(function (currFollowers) {
          return (currFollowers - 1 || 0)
        })
      } else {
        dbref.child("Users/" + currId + "/following").push().set(userId)
        followers.transaction(function (currFollowers) {
          return (currFollowers || 0) + 1
        })
      }
    })
  }
}


export default class Profile extends Component {
  state = {
    display_name: "",
    albumCovers: [],
    profile_pic: ""
  }

  // HiddenButton = () => {
  //     let hidden = false
  //     db.ref("Users/"+this.state.userId+"/hidden").on("value", snapshot=>{
  //         if(snapshot.exists()){
  //             hidden = snapshot.val()
  //         }
  //     })

  //     return hidden ? (<TouchableOpacity onPress = {() => {this.hide()}}>
  //                     <View style = {styles.hiddenbutton}>
  //                         <MaterialCommunityIcons name={'ghost'} size={30} color={'#90EE90'} />
  //                     </View>
  //                     </TouchableOpacity>)
  //                     : (<TouchableOpacity onPress = {() => {this.hide}}>
  //                     <View style = {styles.hiddenbutton}>
  //                         <MaterialCommunityIcons name={'ghost-off'} size={30} color={'#90EE90'} />
  //                     </View>
  //                     </TouchableOpacity>)

  // }

  async componentDidMount() {
    let sp = await getValidSPObj()
    let me = await sp.getMe()

    this.setState({
      display_name: await getUserData('display_name'),
      userId: await getUserData('userId'),
    })

    db.ref().child("Users/" + me.id).on("value", snapshot => {
      if (snapshot.exists()) {
        let user = snapshot.val()
        this.setState({
          profile_pic: user.profile_pic,
          followerCount: user.followers,
          followingCount: user.following ? Object.keys(user.following).length : 0,
          song_title: user.song.song_title,
          song_artist: user.song.song_artist,
          hidden: user.hidden ? "Hidden in feed" : "Visable in feed"
        })
      }
    })


    // let recent = await sp.getMyRecentlyPlayedTracks()
    // if(recent !== null){
    //     let recentlyPlayed = recent.items[0].track
    //     this.setState({
    //         song_title: recentlyPlayed.name,
    //         song_artist: recentlyPlayed.artists[0].name
    //     })
    // }else{
    //     this.setState({
    //         song_title: "",
    //         song_artist: ""
    //     })
    // }


    let top = await sp.getMyTopArtists()
    if (top !== null) {
      let topArtists = top.items
      let albumCovers = []

      let i = 0
      for (let i = 0; i < topArtists.length; i++) {
        if (i > 4) break
        albumCovers.push(topArtists[i].images[0].url)
      }

      this.setState({ albumCovers: albumCovers })
    }
  }

  async logout() {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('display_name');
    await AsyncStorage.removeItem('uri');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('expirationTime');
    this.props.navigation.navigate('Login')
  }

  toggleHidden = async () => {
    try {
      db.ref("Users/" + this.state.userId + "/hidden").once("value", snapshot => {
        let status = false
        if (snapshot.exists()) {
          status = !snapshot.val()
        } else {
          status = true
        }
        db.ref("Users/" + this.state.userId + "/hidden").set(status)
        let label = status ? "Hidden in feed" : "Visable in feed"
        this.setState({ hidden: label })
      })
    } catch (error) {
      console.log(error)
    }
  }


  render() {
    return (
      //     <View style={styles.container}>
      //         <Image source={this.state.profile_pic} style={styles.profileImg} />

      //         {/* <Button title="Log out" onPress={this.logout}></Button> */}

      //     </View>
      // <SafeAreaView styles={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} styles={styles.container}>
        <ImageBackground
          style={styles.headerBackground}
          blurRadius={10}
          source={{uri: this.state.profile_pic}}>

          <View style={{ alignSelf: 'center' }}>
            <Image source={{uri: this.state.profile_pic}} style={styles.profileImg} />
          </View>
          <View style={styles.infoContainer}>
            <View>
              <Text style={[styles.text, { fontWeight: '300', fontSize: 35, textAlign: 'center' }]}>{this.state.display_name}</Text>
              <Text style={styles.followers}>{this.state.followingCount} Following | {this.state.followerCount} Followers</Text>
            </View>
            <TouchableOpacity onPress={() => this.toggleHidden()}>
              <View style={styles.hiddenButton}>
                <Text style={{ color: '#adadad', fontSize: 15, fontWeight: "700" }}>{this.state.hidden}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ImageBackground>
        <View style={styles.song}>
          <Text style={[styles.text, { color: '#4254f5', fontSize: 20 }]}>Last Played:</Text>
          <Text style={[styles.text, { fontSize: 20, textAlign: 'center' }]}>{this.state.song_title}{'\n'}{this.state.song_artist}</Text>
        </View>
        {/* <this.HiddenButton/> */}
        <Text style={[styles.text, { color: '#4254f5', fontSize: 20, textAlign: 'center', marginTop: 25 }]}>My Top Artists:</Text>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ marginTop: 20, marginBottom: 25 }} bounces='true'>
          {
            this.state.albumCovers.map(uri => {
              return <Image source={{ uri: uri }} style={styles.albumCover} resizeMode="cover" />
            })
          }

        </ScrollView>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    height: Dimensions.get('window').height
  },
  text: {
    fontFamily: 'HelveticaNeue',
    color: 'white'
  },
  followers: {
    marginTop: 5,
    fontSize: 17,
    textAlign: 'center',
    color: '#adadad',
    fontWeight: '700',
    shadowOpacity: 13,
    shadowRadius: 7
  },
  profileImg: {
    marginTop: 25,
    height: 125,
    width: 125,
    borderRadius: 180,
    overflow: "hidden"
  },
  title: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 20,
    color: '#90EE90'
  },
  song: {
    // flex: 1,
    textAlign: 'center',
    alignItems: 'center',
    marginTop: -10,
    // marginHorizontal: 30,
    backgroundColor: '#141414',
    paddingVertical: 10,
    borderRadius: 16
  },
  infoContainer: {
    alignSelf: "center",
    alignItems: "center",
    marginTop: 11,

  },
  albumCover: {
    width: 220,
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 10
  },
  image: {
    flex: 1,
    width: 180,
    height: 200,
    shadowOpacity: 20
  },
  headerBackground: {
    height: Dimensions.get('window').height / (2.8)
  },
  hiddenButton: {
    marginTop: 5
  }
})
