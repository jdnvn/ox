import React, { Component } from 'react';
import {StyleSheet, Text, View, Dimensions, Button, Image, AsyncStorage, ScrollView, SafeAreaView, ImageBackground, FlatList, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Login from './login';
import {getUserData, getValidSPObj} from './login'
import Following, {getTrackInfo} from './following';
import db from '../database';
import { ListItem } from 'react-native-elements';


export default class Queue extends Component {
    state = {
        queue: []
    }

    async componentDidMount() {
        await this.setEntries()
    }

    setEntries = async () => {
        db.ref("Users/"+this.props.route.params.userId+"/queue").on("value", snapshot => {
            var data = []
            if(snapshot.exists()){
                snapshot.forEach(song=>{
                    if(song!=undefined) data.push(song.val())
                })
            }
            this.setState({queue: data})
        })
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

    renderItems = ({item}) =>
        <ListItem
            title={item['song_title'] + " - " + item['song_artist']}
            containerStyle={{backgroundColor:'black'}}
            titleStyle={{color:'white', fontWeight:'bold'}}
        />

    render(){
        return(
            <SafeAreaView styles={styles.container}>
                                            <TouchableOpacity onPress = {() => this.logout()}>
                            <View style = {styles.hiddenButton}>
                                <Text style = {{color: '#4254f5', fontSize: 15, fontWeight: "700"}}>Log out</Text>
                            </View>
                            </TouchableOpacity>
                <FlatList
                    data={this.state.queue}
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
        height: Dimensions.get('window').height,
        backgroundColor: 'black'
    },
})