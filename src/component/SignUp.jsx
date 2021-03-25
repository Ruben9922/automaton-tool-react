import React from 'react';
import {makeStyles, Theme} from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Alert from "@material-ui/lab/Alert";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";
import { Link as RouterLink } from "react-router-dom";
import firebase from '../firebase';
import Button from "@material-ui/core/Button";
import FacebookIcon from "@material-ui/icons/Facebook";
import GitHubIcon from "@material-ui/icons/GitHub";

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
      width: '25ch',
    },
  },
}));

export default function SignUp() {
  const classes = useStyles();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await firebase.auth().createUserWithEmailAndPassword(email, password);
    } catch (e) {
      setError(e.message);
    }
  };

  const signInWithProvider = (provider) => async () => {
    setError("");
    try {
      await firebase.auth().signInWithRedirect(provider);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Sign Up
      </Typography>
      <form className={classes.root} onSubmit={handleSubmit}>
        <TextField
          id="email"
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          type="submit"
        >
          Sign up
        </Button>
      </form>
      <Button
        variant="contained"
        onClick={signInWithProvider(new firebase.auth.GoogleAuthProvider())}
      >
        Sign up with Google
      </Button>
      <Button
        variant="contained"
        onClick={signInWithProvider(new firebase.auth.FacebookAuthProvider())}
        startIcon={<FacebookIcon />}
      >
        Sign up with Facebook
      </Button>
      <Button
        variant="contained"
        onClick={signInWithProvider(new firebase.auth.GithubAuthProvider())}
        startIcon={<GitHubIcon />}
      >
        Sign up with GitHub
      </Button>
      <p>
        Already have an account?
        <Link component={RouterLink} to="/login">
          Log in
        </Link>
      </p>
      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}
    </>
  );
}
