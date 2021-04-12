import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View, TextInput, Dimensions, Button, Image, AsyncStorage, ScrollView, FlatList, TouchableWithoutFeedback, Keyboard, TouchableOpacity, SafeAreaView } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Login from './login';
import {getUserData, getValidSPObj} from './login'
import Following from './following';
import {follow} from './profile'
import db from '../database';
import { SearchBar, ListItem } from 'react-native-elements';
import GradientButton from 'react-native-gradient-buttons';
import { TouchableHighlight } from 'react-native-gesture-handler';


export const FollowButton = ({userId, me}) =>{
    let following = false
    db.ref().child("Users/"+me+"/following").orderByValue().equalTo(userId).on("value", snapshot => {
        if(snapshot.exists()){
            following = true
        }
    })

    return following ? (<TouchableOpacity onPress = {() => {follow(userId)}}>
                        <View style = {styles.followingbutton}>
                            <Text style = {{color: 'black', fontSize: 15, fontWeight: "700"}}>Following</Text>
                        </View>
                        </TouchableOpacity>)
                        : (<TouchableOpacity onPress = {() => {follow(userId)}}>
                            <View style = {styles.followbutton}>
                                <Text style = {{color: '#4254f5', fontSize: 15, fontWeight: "700"}}>Follow</Text>
                            </View>
                            </TouchableOpacity>);
}

export default class Search extends Component {
    state = {
        search: '',
    };


    async componentDidMount() {
        this.setState({userId: await getUserData("userId")})
    }

    updateSearch = async search => {
        this.setState({search: search});
        
        let queried = []
        if(search !== ''){
            db.ref().child("Users").orderByChild("userId").on("value", snapshot=>{
                snapshot.forEach(user=>{
                    if(Object.keys(user.val()).length > 1){
                        let username = user.val().display_name.toLowerCase()
                        if(user.val().userId !== this.state.userId && username.includes(this.state.search.toLowerCase())) queried.push(user.val())
                    }
                })
            })
        }
        this.setState({data: queried})
    };

    goToProfile = (userId) => {
        this.props.navigation.navigate('Userprofile', { userId: userId, me: this.state.userId })
    }

    renderItems = ({item}) =>
      <ListItem 
        containerStyle = {styles.listItem}
        component={TouchableHighlight}
        title={item.display_name} 
        titleStyle={styles.listTitle}
        leftAvatar={{source: {uri: item.profile_pic}}}
        onPress={() => this.goToProfile(item.userId)}
        bottomDivider
        topDivider
        // rightElement={<FollowButton userId={item.userId} me={this.state.userId}></FollowButton>}

      />

    cancelSearch = () => {
        this.setState({search: ''})
    }

    render() {
        const {search} = this.state.search
        const scrollEnabled = this.state.screenHeight
        return (
            <ScrollView>
                <SearchBar
                    placeholder="Search for a friend"
                    onChangeText={text => this.updateSearch(text)}
                    onCancel={this.cancelSearch}
                    value={this.state.search}
                    containerStyle={styles.search}
                    inputStyle={styles.searchinput}
                />
                <FlatList
                    data={this.state.data}
                    renderItem={this.renderItems}
                />
            </ScrollView>
        );
    }
    
}
const styles = StyleSheet.create({
    // container: {
    //     marginTop: 50,
    //     height: Dimensions.get('window').height
    // },
    listItem: {
        backgroundColor: 'black',
        shadowColor: 'black',
        borderTopColor: 'black',
        borderBottomColor: 'black',
    },
    listTitle: {
        color: 'white',
    },
    followbutton:{
        // backgroundColor: '#4254f5',
        borderColor: '#4254f5',
        borderWidth: 1,
        alignItems: 'center', 
        justifyContent: 'center', 
        borderRadius: 10,
        height: 35,
        width: 80,

    },
    followingbutton:{
        alignItems: 'center', 
        justifyContent: 'center', 
        borderRadius: 10,
        height: 35,
        width: 80,
        backgroundColor: '#4254f5',
    },
    search: {
        backgroundColor:'#141414'
    },
})