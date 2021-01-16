import React from 'react';
import Header from "./Header";
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import Home from "./Home";
import Container from "@material-ui/core/Container";
import View from "./View";
import Input from "./Input";
import {List, Map, Record} from "immutable";
import Snackbar from "@material-ui/core/Snackbar";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import {makeStyles} from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import {v4 as uuidv4} from "uuid";

const useStyles = makeStyles((theme) => ({
  close: {
    padding: theme.spacing(0.5),
  },
}));

export default function App() {
  const classes = useStyles();

  const [automata, setAutomata] = React.useState(List());
  const [snackPack, setSnackPack] = React.useState(List());
  const [open, setOpen] = React.useState(false);
  const [messageInfo, setMessageInfo] = React.useState(undefined);

  const messages = Map({
    automatonAdded: "Automaton created",
    automatonDeleted: "Automaton deleted",
    stateDeleted: "State deleted",
  });

  React.useEffect(() => {
    if (snackPack.count() && !messageInfo) {
      // Set a new snack when we don't have an active one
      setMessageInfo(snackPack.first());
      setSnackPack(prevSnackPack => prevSnackPack.shift());
      setOpen(true);
    } else if (snackPack.count() && messageInfo && open) {
      // Close an active snack when a new one is added
      setOpen(false);
    }
  }, [snackPack, messageInfo, open]);

  const SnackbarMessage = Record({
    id: uuidv4(),
    message: "",
  });

  const handleSnackbarOpen = messageKey => () => {
    setSnackPack(prevSnackPack => prevSnackPack.push(SnackbarMessage({
      message: messages.get(messageKey),
    })));
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const handleSnackbarExited = () => {
    setMessageInfo(undefined);
  };

  const addAutomaton = automaton => setAutomata(prevAutomata => prevAutomata.push(automaton));

  return (
    <Router>
      <Header/>
      <Container maxWidth="md">
        <Switch>
          <Route exact path="/">
            <Home
              automata={automata}
              onAutomataChange={setAutomata}
              openSnackbar={handleSnackbarOpen("automatonDeleted")}
            />
          </Route>
          <Route path="/view">
            <View/>
          </Route>
          <Route path="/create">
            <Input addAutomaton={addAutomaton} openSnackbar={handleSnackbarOpen("automatonAdded")}/>
          </Route>
        </Switch>
        <Snackbar
          key={messageInfo ? messageInfo.key : undefined}
          open={open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          onExited={handleSnackbarExited}
          message={messageInfo ? messageInfo.message : undefined}
          action={
            <React.Fragment>
              <Button color="secondary" size="small" onClick={handleSnackbarClose}>
                UNDO
              </Button>
              <IconButton
                aria-label="close"
                color="inherit"
                className={classes.close}
                onClick={handleSnackbarClose}
              >
                <CloseIcon />
              </IconButton>
            </React.Fragment>
          }
        />
      </Container>
    </Router>
  );
}
