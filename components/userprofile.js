import React, { Component } from 'react';
import { StyleSheet, Text, View, Dimensions, Button, Image, AsyncStorage, ScrollView, SafeAreaView, ImageBackground, FlatList, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Login from './login';
import { getUserData, getValidSPObj } from './login'
import Following, { getTrackInfo } from './following';
import db from '../database';
import { FollowButton } from './search'
import { ListItem } from 'react-native-elements';


export default class Userprofile extends Component {
  state = {
    display_name: "",
    profile_pic: "",
    userId: "",
    me: "",
    listeners: []
  }


  async componentDidMount() {
    this.setState({ userId: this.props.route.params.userId, me: this.props.route.params.me })
    await this.setEntries()
    db.ref().child("Users").orderByChild("userId").equalTo(this.props.route.params.userId).on("value", snapshot => {
      if (snapshot.exists()) {
        let obj = snapshot.val()[this.props.route.params.userId]
        this.setState({
          display_name: obj.display_name,
          profile_pic: obj.profile_pic,
          song_title: obj.song ? obj.song.song_title : "",
          song_artist: obj.song ? obj.song.song_artist : "",
          is_playing: obj.song ? obj.song.is_playing : false,
          followingCount: obj.following ? Object.keys(obj.following).length : 0,
          followersCount: obj.followers ? obj.followers : 0
        })

      } else {
        this.setState({
          notfound: true
        })
        alert('not found')
      }
    })
  }

  renderItems = ({ item }) =>
    <ListItem
      title={item.display_name}
      containerStyle={{ backgroundColor: 'black' }}
      titleStyle={{ color: 'white', fontWeight: 'bold', alignSelf: 'center' }}
    />


  setEntries = async () => {
    db.ref("Users/" + this.props.route.params.userId + "/listeners").on("value", snapshot => {
      var data = []
      if (snapshot.exists()) {
        snapshot.forEach(user => {
          if (user.val() === this.props.route.params.me) {
            data.push({ display_name: "You" })
          } else {
            db.ref().child("Users/" + user.val() + "/display_name").once("value", snapshot => {
              if (snapshot.exists()) {
                var listener = {}
                listener.display_name = snapshot.val()
                data.push(listener)
              }
            })
          }
        })
      }
      this.setState({ listeners: data })
    })
  }


  render() {
    return (
      //     <View style={styles.container}>
      //         <Image source={this.state.profile_pic} style={styles.profileImg} />

      //         {/* <Button title="Log out" onPress={this.logout}></Button> */}

      //     </View>
      <SafeAreaView styles={styles.container}>
        {/* <ScrollView showsVerticalScrollIndicator={false} styles={styles.container}> */}
        <View>
          <ImageBackground
            style={styles.headerBackground}
            blurRadius={20}
            source={{ uri: this.state.profile_pic }}
          >

            <View style={{ alignSelf: 'center' }}>
              <Image source={{ uri: this.state.profile_pic }} style={styles.profileImg} />
            </View>
            <View style={styles.infoContainer}>
              <Text style={[styles.text, { fontWeight: '300', fontSize: 35 }]}>{this.state.display_name}</Text>
              <Text style={styles.followers}>{this.state.followingCount} Following | {this.state.followersCount} Followers</Text>
            </View>
            <View style={styles.followbutton}>
              <FollowButton userId={this.state.userId} me={this.state.me}></FollowButton>
            </View>
          </ImageBackground>

        </View>
        {/* </ScrollView> */}
        <View style={styles.song}>
          <Text style={[styles.text, { color: '#4254f5', fontSize: 20 }]}>Last Played:</Text>
          <Text style={[styles.text, { fontSize: 20, textAlign: 'center' }]}>{this.state.song_title}{'\n'}{this.state.song_artist}</Text>
        </View>

        <Text style={[styles.text, { color: '#4254f5', fontSize: 20, alignSelf: 'center', marginTop: 15 }]}>Listeners</Text>
        <FlatList
          data={this.state.listeners}
          renderItem={this.renderItems}
        // style={{height: Dimensions.get('window').height}}
        // keyExtractor={(item, index) => item.userId}
        // onRefresh={() => this.onRefresh()}
        // refreshing={this.state.isFetching}
        />
      </SafeAreaView>
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
    fontSize: 18,
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
    height: 100,
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
  followbutton: {
    marginTop: 10,
    alignItems: 'center'
  }
})
