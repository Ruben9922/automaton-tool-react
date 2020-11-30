import React from 'react';
import Container from "@material-ui/core/Container";
import AlphabetInput from "./AlphabetInput";
import StatesInput from "./StatesInput";
import TransitionsInput from "./TransitionsInput";
import {List, OrderedSet} from "immutable";

export default function Home() {
    const [automata, setAutomata] = React.useState([]);

    const [alphabet, setAlphabet] = React.useState("");
    const [states, setStates] = React.useState(List());
    const [initialStateIndex, setInitialStateIndex] = React.useState(-1);
    const [finalStateIndices, setFinalStateIndices] = React.useState(OrderedSet());
    const [transitions, setTransitions] = React.useState(List());

    return (
        <Container maxWidth="md">
            <AlphabetInput alphabet={alphabet} onAlphabetChange={setAlphabet}/>
            <StatesInput
                states={states}
                onStatesChange={setStates}
                initialStateIndex={initialStateIndex}
                onInitialStateIndexChange={setInitialStateIndex}
                finalStateIndices={finalStateIndices}
                onFinalStateIndicesChange={setFinalStateIndices}
            />
            <TransitionsInput
                transitions={transitions}
                onTransitionsChange={setTransitions}
                alphabet={alphabet}
                states={states}
            />
        </Container>
    );
}
