import React from 'react';
import Header from "./Header";
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";
import Home from "./Home";

function App() {
    return (
        <Router>
            <Header/>
            <Switch>
                <Route exact path="/">
                    <Home/>
                </Route>
                {/*<Route path="/view">*/}
                {/*    <ViewAutomaton/>*/}
                {/*</Route>*/}
                {/*<Route path="/edit">*/}
                {/*    <EditAutomaton/>*/}
                {/*</Route>*/}
                {/*<Route path="/delete">*/}
                {/*    <DeleteAutomaton/>*/}
                {/*</Route>*/}
            </Switch>
        </Router>
    );
}

export default App;
