import React from 'react';
import firebase from '../firebase';
import {StyledFirebaseAuth} from "react-firebaseui";
import Typography from "@material-ui/core/Typography";

// Configure FirebaseUI
const uiConfig = {
  signInFlow: 'redirect',
  // Redirect to / after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
  signInSuccessUrl: '/',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
  ],
};

export default function Login() {
  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Sign In
      </Typography>
      <p>Please sign in using one of the following methods:</p>
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
    </>
  );
}
