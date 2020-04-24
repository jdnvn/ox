import * as firebase from 'firebase';

const firebaseConfig = {
    apiKey: "AIzaSyAzSN0_Y92o94lCu2EcR5bQVGG8TStMxsE",
    authDomain: "spotify-project-dd13e.firebaseapp.com",
    databaseURL: "https://spotify-project-dd13e.firebaseio.com",
    projectId: "spotify-project-dd13e",
    storageBucket: "spotify-project-dd13e.appspot.com",
    messagingSenderId: "845097517139",
    appId: "1:845097517139:web:be2e269512d0eff955c6a6",
    measurementId: "G-62RHV618QR"
  };

export default !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app()