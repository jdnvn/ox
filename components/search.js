import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View, TextInput, Dimensions, Button, Image, AsyncStorage, ScrollView, FlatList, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Login from './login';
import {getUserData} from './login'
import Following from './following';
import {follow} from './profile'
import db from '../database';
import { SearchBar, ListItem } from 'react-native-elements';
import GradientButton from 'react-native-gradient-buttons';

export default class Search extends Component {
    state = {
        search: '',
    };

    async componentDidMount() {
        this.setState({userId: await getUserData("userId")})
    }

    updateSearch = search => {
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

    renderItems = ({item}) =>
      <ListItem 
        containerStyle = {styles.listItem}
        title={item.display_name} 
        titleStyle={styles.listTitle}
        leftAvatar={{source: {uri: item.profile_pic}}}
        bottomDivider
        topDivider
        rightElement={
            <GradientButton
                    gradientBegin='#32a852'
                    gradientEnd='#72c46e'
                    gradientDirection='diagonal'
                    text = 'Follow'
                    height={40}
                    width={90}
                    impact
                    impactStyle='Light'
                    textStyle={{fontSize: 15}}
                    onPressAction={() => follow(item.userId)}
                />
        }
      />

    cancelSearch = () => {
        this.setState({search: ''})
    }

    render() {
        const {search} = this.state.search

        return (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View>
                <SearchBar
                    placeholder="Search for a user"
                    onChangeText={text => this.updateSearch(text)}
                    onCancel={this.cancelSearch}
                    value={this.state.search}
                />
                <FlatList
                    data={this.state.data}
                    renderItem={this.renderItems}
                />
                </View>
            </TouchableWithoutFeedback>
        );
    }
    
}
const styles = StyleSheet.create({
    listItem: {
        backgroundColor: '#383838',
        shadowColor: 'black',
        borderTopColor: 'black',
        borderBottomColor: 'black'
    },
    listTitle: {
        color: 'white'
    }
})