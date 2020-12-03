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
import {List} from "immutable";

export default function App() {
    const [automata, setAutomata] = React.useState(List());

    const addAutomaton = automaton => setAutomata(prevAutomata => prevAutomata.push(automaton));

    return (
        <Router>
            <Header/>
            <Container maxWidth="md">
                <Switch>
                    <Route exact path="/">
                        <Home automata={automata}/>
                    </Route>
                    <Route path="/view">
                        <View/>
                    </Route>
                    <Route path="/create">
                        <Input addAutomaton={addAutomaton}/>
                    </Route>
                </Switch>
            </Container>
        </Router>
    );
}
