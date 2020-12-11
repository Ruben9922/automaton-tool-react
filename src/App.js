import React from 'react';
import Header from "./Header";
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";
import Home from "./Home";
import Container from "@material-ui/core/Container";
import View from "./View";
import Input from "./Input";
import {List, Map} from "immutable";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";

export default function App() {
    const [automata, setAutomata] = React.useState(List());
    const [snackbarsOpen, setSnackbarsOpen] = React.useState(Map({created: false, deleted: false}));

    const addAutomaton = automaton => setAutomata(prevAutomata => prevAutomata.push(automaton));

    const handleSnackbarOpen = key => setSnackbarsOpen(prevSnackbarsOpen => prevSnackbarsOpen.set(key, true));

    const handleSnackbarClose = (event, reason, key) => {
        if (reason === 'clickaway') {
            return;
        }

        setSnackbarsOpen(prevSnackbarsOpen => prevSnackbarsOpen.set(key, false));
    };

    return (
        <Router>
            <Header/>
            <Container maxWidth="md">
                <Switch>
                    <Route exact path="/">
                        <Home
                            automata={automata}
                            onAutomataChange={setAutomata}
                            onSnackbarOpenChange={() => handleSnackbarOpen("deleted")}
                        />
                    </Route>
                    <Route path="/view">
                        <View/>
                    </Route>
                    <Route path="/create">
                        <Input addAutomaton={addAutomaton} onSnackbarOpenChange={() => handleSnackbarOpen("created")}/>
                    </Route>
                </Switch>
                <Snackbar
                    open={snackbarsOpen.get("created")}
                    autoHideDuration={2000}
                    onClose={(event, reason) => handleSnackbarClose(event, reason, "created")}
                >
                    <Alert
                        elevation={6}
                        variant="filled"
                        onClose={(event, reason) => handleSnackbarClose(event, reason, "created")}
                        severity="success"
                    >
                        Automaton created successfully!
                    </Alert>
                </Snackbar>
                <Snackbar
                    open={snackbarsOpen.get("deleted")}
                    autoHideDuration={2000}
                    onClose={(event, reason) => handleSnackbarClose(event, reason, "deleted")}
                >
                    <Alert
                        elevation={6}
                        variant="filled"
                        onClose={(event, reason) => handleSnackbarClose(event, reason, "deleted")}
                        severity="success"
                    >
                        Automaton deleted successfully!
                    </Alert>
                </Snackbar>
            </Container>
        </Router>
    );
}
