import React from "react";
import Input from "./Input";
import {List} from "immutable";

export default function Home() {
    const [automata, setAutomata] = React.useState(List());

    return (
        <Input onAutomatonChange={setAutomata}/>
    );
}
