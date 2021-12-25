import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";
import React from "react";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";
import GitHubIcon from "@material-ui/icons/GitHub";
import Button from "@material-ui/core/Button";
import { Link } from "react-router-dom";
import firebase from "../firebase";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

type HeaderProps = {
  authenticated: boolean;
};

export default function Header({ authenticated }: HeaderProps) {
  const classes = useStyles();

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" className={classes.title}>
          Automaton Tool
        </Typography>
        {authenticated ? (
          <Button onClick={() => firebase.auth().signOut()} color="inherit">
            Log Out
          </Button>
        ) : (
          <Button component={Link} to="/login" color="inherit">
            Log In
          </Button>
        )}
        <Tooltip title="GitHub repository">
          <IconButton aria-label="GitHub" href="https://github.com/Ruben9922/automaton-tool-react" color="inherit">
            <GitHubIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
