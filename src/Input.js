import React from 'react';
import AlphabetInput from "./AlphabetInput";
import StatesInput from "./StatesInput";
import TransitionsInput from "./TransitionsInput";
import {List, Map, OrderedSet} from "immutable";
import {makeStyles} from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Step from "@material-ui/core/Step";
import StepButton from "@material-ui/core/StepButton";
import Stepper from "@material-ui/core/Stepper";
import {useHistory} from "react-router-dom";
import {StepLabel} from "@material-ui/core";
import {NIL} from "uuid";

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    button: {
        marginRight: theme.spacing(1),
    },
    backButton: {
        marginRight: theme.spacing(1),
    },
    completed: {
        display: 'inline-block',
    },
    instructions: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
}));

function createAutomaton(alphabet, states, initialStateIndex, finalStateIndices, transitions) {
    const transitionsToTransitionFunction = transitions => {
        let transitionFunction = Map();
        for (const transition of transitions) {
            const key = Map({
                currentState: transition.get("currentState"),
                symbol: transition.get("symbol"),
            });
            transitionFunction = transitionFunction.set(key, transition.get("nextStates"));
        }
        return transitionFunction;
    }

    return Map({
        alphabet: alphabet,
        states: OrderedSet(states),
        transitionFunction: transitionsToTransitionFunction(transitions),
        initialState: states.get(initialStateIndex),
        finalStates: states.filter((value, index, iter) => finalStateIndices.includes(index)),
    })
}

export default function Input({addAutomaton, onSnackbarOpenChange}) {
    const classes = useStyles();

    const history = useHistory();

    const [alphabet, setAlphabet] = React.useState(OrderedSet());
    const [alphabetPresetIndex, setAlphabetPresetIndex] = React.useState("");
    const [states, setStates] = React.useState(List());
    const [initialStateId, setInitialStateId] = React.useState(NIL);
    const [finalStateIds, setFinalStateIds] = React.useState(OrderedSet());
    const [transitions, setTransitions] = React.useState(List());

    // Error checks to be performed
    // Values may be a single boolean value or a List of boolean values, depending on the nature of the check
    // For example, a check that is performed on the list of states will be a list of boolean values of the same length
    // TODO: Currently `true` means valid which is counterintuitive; might change this
    const stateIds = states.map(state => state.get("id"));
    const errors = Map({
        alphabet: Map({
            isNonEmpty: !alphabet.isEmpty(),
        }),
        states: Map({
            isNonEmpty: !states.isEmpty(),
            areStateNamesNonEmpty: states.map(state => !!state.get("name")),
            areStateNamesUnique: states.map(state1 =>
                states.count(state2 => state2.get("name") === state1.get("name")) === 1
            ),
            exactlyOneInitialState: initialStateId !== NIL,
        }),
        transitions: Map({
            areCurrentStatesNonEmpty: transitions.map(transition => transition.get("currentState") !== ""),
            areCurrentStatesValid: transitions.map(transition => stateIds.includes(transition.get("currentState"))),
            areSymbolsNonEmpty: transitions.map(transition => transition.get("symbol") !== ""),
            areSymbolsValid: transitions.map(transition => alphabet.includes(transition.get("symbol"))),
            areNextStatesNonEmpty: transitions.map(transition => !transition.get("nextStates").isEmpty()),
            areNextStatesValid: transitions.map(transition => transition.get("nextStates").isSubset(stateIds)),
            areTransitionsUnique: transitions.map(transition1 => transitions.count(transition2 =>
                transition1.get("currentState") === transition2.get("currentState")
                && transition1.get("symbol") === transition2.get("symbol")
            ) === 1),
        }),
    });

    // Warning checks to be performed
    // Similar to `errors` but for warnings (issues where the input is still valid)
    const warnings = Map({
        states: Map({
            atLeastOneFinalState: !finalStateIds.isEmpty(),
        }),
    });

    // Messages for each of the error checks
    const errorMessages = Map({
        alphabet: Map({
            isNonEmpty: "Alphabet cannot be empty",
        }),
        states: Map({
            isNonEmpty: "At least one state is required",
            areStateNamesNonEmpty: "State name cannot be left blank",
            areStateNamesUnique: "State name must be unique",
            exactlyOneInitialState: "A state must be selected as the initial state"
        }),
        transitions: Map({
            areCurrentStatesNonEmpty: "Current state cannot be left blank",
            areCurrentStatesValid: "State does not exist",
            areSymbolsNonEmpty: "Symbol cannot be left blank",
            areSymbolsValid: "Symbol does not exist in alphabet",
            areNextStatesNonEmpty: "Next states cannot be empty",
            areNextStatesValid: "One or more states do not exist",
            areTransitionsUnique: "Transition must be unique",
            statesIsNonEmpty: "There are no states",
            alphabetIsNonEmpty: "Alphabet is empty",
        }),
    });

    // Messages for each of the warning checks
    const warningMessages = Map({
        states: Map({
            atLeastOneFinalState: "No state is selected as the final state, so all strings will be rejected by the automaton",
        }),
    });

    const disabled = Map({
        transitions: Map({
            currentState: transitions.map(() => errors.getIn(["states", "isNonEmpty"])),
            symbol: transitions.map(() => errors.getIn(["alphabet", "isNonEmpty"])),
            nextStates: transitions.map(() => errors.getIn(["states", "isNonEmpty"])),
        })
    })

    // For single boolean values, can compute error state by doing !(x1 && ... && xn) (each xi is a check)
    // For lists, need to repeat this for each item in the lists
    const createErrorStateList = (errors, disabled) => {
        let l = errors[0];
        for (let i = 1; i < errors.length; i++) {
            l = l.zipWith((x, y) => x && y, errors[i]);
        }
        l = l.map(x => !x);

        if (disabled) {
            l = disabled.zipWith((x, y) => x && y, l);
        }

        return l;
    }

    // Error state for each input
    // Some inputs may be associated with more than one check - e.g. check state name is non-empty AND unique
    // Hence need to combine error checks into a boolean value for each input
    // Could just check whether helper text is non-empty but may want to display helper text not for an error
    const errorState = Map({
        alphabet: Map({
            alphabet: !errors.getIn(["alphabet", "isNonEmpty"]),
        }),
        states: Map({
            stateName: createErrorStateList([
                errors.getIn(["states", "areStateNamesNonEmpty"]),
                errors.getIn(["states", "areStateNamesUnique"]),
            ])
        }),
        transitions: Map({
            currentState: createErrorStateList([
                errors.getIn(["transitions", "areCurrentStatesNonEmpty"]),
                errors.getIn(["transitions", "areCurrentStatesValid"]),
                errors.getIn(["transitions", "areTransitionsUnique"]),
            ], disabled.getIn(["transitions", "currentState"])),
            symbol: createErrorStateList([
                errors.getIn(["transitions", "areSymbolsNonEmpty"]),
                errors.getIn(["transitions", "areSymbolsValid"]),
                errors.getIn(["transitions", "areTransitionsUnique"]),
            ], disabled.getIn(["transitions", "symbol"])),
            nextStates: createErrorStateList([
                errors.getIn(["transitions", "areNextStatesNonEmpty"]),
                errors.getIn(["transitions", "areNextStatesValid"]),
            ], disabled.getIn(["transitions", "nextStates"])),
        }),
    });

    // Same idea as `createErrorStateList`
    const createHelperTextList = (errors, errorMessages) => {
        let l = errors[0].map(x => x || errorMessages[0]);
        for (let i = 1; i < errors.length; i++) {
            l = l.zipWith((x, y) => x === true ? y : x,
                errors[i].map(y => y || errorMessages[i])
            );
        }
        return l;
    };

    // Helper text for each input
    // Same idea as `errorState`
    const helperText = Map({
        alphabet: Map({
            alphabet: errors.getIn(["alphabet", "isNonEmpty"]) || errorMessages.getIn(["alphabet", "isNonEmpty"]),
        }),
        states: Map({
            stateName: createHelperTextList([
                errors.getIn(["states", "areStateNamesNonEmpty"]),
                errors.getIn(["states", "areStateNamesUnique"]),
            ], [
                errorMessages.getIn(["states", "areStateNamesNonEmpty"]),
                errorMessages.getIn(["states", "areStateNamesUnique"]),
            ]),
        }),
        transitions: Map({
            currentState: createHelperTextList([
                transitions.map(() => errors.getIn(["states", "isNonEmpty"])),
                errors.getIn(["transitions", "areCurrentStatesNonEmpty"]),
                errors.getIn(["transitions", "areCurrentStatesValid"]),
                errors.getIn(["transitions", "areTransitionsUnique"]),
            ], [
                transitions.map(() => errorMessages.getIn(["transitions", "statesIsNonEmpty"])),
                errorMessages.getIn(["transitions", "areCurrentStatesNonEmpty"]),
                errorMessages.getIn(["transitions", "areCurrentStatesValid"]),
                errorMessages.getIn(["transitions", "areTransitionsUnique"]),
            ]),
            symbol: createHelperTextList([
                transitions.map(() => errors.getIn(["alphabet", "isNonEmpty"])),
                errors.getIn(["transitions", "areSymbolsNonEmpty"]),
                errors.getIn(["transitions", "areSymbolsValid"]),
                errors.getIn(["transitions", "areTransitionsUnique"]),
            ], [
                transitions.map(() => errorMessages.getIn(["transitions", "alphabetIsNonEmpty"])),
                errorMessages.getIn(["transitions", "areSymbolsNonEmpty"]),
                errorMessages.getIn(["transitions", "areSymbolsValid"]),
                errorMessages.getIn(["transitions", "areTransitionsUnique"]),
            ]),
            nextStates: createHelperTextList([
                transitions.map(() => errors.getIn(["states", "isNonEmpty"])),
                errors.getIn(["transitions", "areNextStatesNonEmpty"]),
                errors.getIn(["transitions", "areNextStatesValid"]),
            ], [
                transitions.map(() => errorMessages.getIn(["transitions", "statesIsNonEmpty"])),
                errorMessages.getIn(["transitions", "areNextStatesNonEmpty"]),
                errorMessages.getIn(["transitions", "areNextStatesValid"]),
            ]),
        }),
    });

    // List of error messages to display in an alert
    // Some errors can't be associated with an input - e.g. states or transitions list being empty
    // Hence these are displayed in an alert
    const errorAlertText = Map({
        states: List([
            errors.getIn(["states", "isNonEmpty"]) || errorMessages.getIn(["states", "isNonEmpty"]),
            !errors.getIn(["states", "isNonEmpty"]) || errors.getIn(["states", "exactlyOneInitialState"]) || errorMessages.getIn(["states", "exactlyOneInitialState"]),
        ]).filter(x => x !== true)
    });

    // List of warning messages to display in an alert
    const warningAlertText = Map({
        states: List([
            !errors.getIn(["states", "isNonEmpty"]) || warnings.getIn(["states", "atLeastOneFinalState"]) || warningMessages.getIn(["states", "atLeastOneFinalState"]),
        ]).filter(x => x !== true)
    });

    const fixInitialStateId = () => {
        setInitialStateId(prevInitialStateId => stateIds.includes(prevInitialStateId) ? prevInitialStateId : NIL);
    };

    const fixFinalStateIds = () => {
        setFinalStateIds(prevFinalStateIds => prevFinalStateIds.intersect(stateIds));
    };

    const fixTransitionCurrentStates = () => {
        setTransitions(prevTransitions => prevTransitions.map(transition =>
            transition.update("currentState", currentState => stateIds.includes(currentState) ? currentState : "")
        ));
    };

    const fixTransitionSymbol = () => {
        setTransitions(prevTransitions => prevTransitions.map(transition =>
            transition.update("symbol", symbol => alphabet.includes(symbol) ? symbol : "")
        ));
    };

    const fixTransitionNextStates = () => {
        setTransitions(prevTransitions => prevTransitions.map(transition =>
            transition.update("nextStates", nextStates => nextStates.intersect(stateIds))
        ));
    };

    React.useEffect(fixInitialStateId, [stateIds]);
    React.useEffect(fixTransitionSymbol, [alphabet]);
    React.useEffect(fixFinalStateIds, [stateIds]);
    React.useEffect(fixTransitionCurrentStates, [stateIds]);
    React.useEffect(fixTransitionNextStates, [stateIds]);

    const stepContent = [
        <AlphabetInput
            alphabet={alphabet}
            onAlphabetChange={setAlphabet}
            alphabetPresetIndex={alphabetPresetIndex}
            onAlphabetPresetIndexChange={setAlphabetPresetIndex}
            errorState={errorState.get("alphabet")}
            helperText={helperText.get("alphabet")}
        />,
        <StatesInput
            states={states}
            onStatesChange={setStates}
            initialStateId={initialStateId}
            onInitialStateIdChange={setInitialStateId}
            finalStateIds={finalStateIds}
            onFinalStateIdsChange={setFinalStateIds}
            errorState={errorState.get("states")}
            helperText={helperText.get("states")}
            errorAlertText={errorAlertText.get("states")}
            warningAlertText={warningAlertText.get("states")}
        />,
        <TransitionsInput
            transitions={transitions}
            onTransitionsChange={setTransitions}
            alphabet={alphabet}
            states={states}
            errorState={errorState.get("transitions")}
            helperText={helperText.get("transitions")}
        />,
    ];

    const countErrors = key => errorState.get(key).toList().flatten().count(x => x === true)
        + (errorAlertText.has(key) ? errorAlertText.get(key).count() : 0);

    // TODO: Maybe remove this and put errorCount in its own Map
    const steps = List([
        Map({
            label: "Specify alphabet",
            completed: countErrors("alphabet") === 0,
            errorCount: countErrors("alphabet"),
        }),
        Map({
            label: "Specify states",
            completed: countErrors("states") === 0,
            errorCount: countErrors("states"),
            warningCount: warningAlertText.get("states").count(),
        }),
        Map({
            label: "Specify transitions",
            completed: countErrors("transitions") === 0,
            errorCount: countErrors("transitions"),
        }),
    ]);
    const [activeStepIndex, setActiveStepIndex] = React.useState(0);

    const allStepsCompleted = () => steps.every(step => step.get("completed") === true);

    const handleNext = () => {
        const updatedActiveStepIndex =
            activeStepIndex === steps.count() - 1 && !allStepsCompleted()
                ? // It's the last step, but not all steps have been completed
                  // find the first step that has not been completed
                steps.findIndex(step => step.get("completed") === false)
                : activeStepIndex + 1;

        setActiveStepIndex(updatedActiveStepIndex);
    };

    const handleBack = () => setActiveStepIndex(prevActiveStep => prevActiveStep - 1);

    const handleStep = stepIndex => () => setActiveStepIndex(stepIndex);

    const handleFinish = () => {
        let automaton = createAutomaton(alphabet, states, initialStateId, finalStateIds, transitions);
        addAutomaton(automaton);
        history.push("/");
        onSnackbarOpenChange(true);
    };

    return (
        <div className={classes.root}>
            <Stepper alternativeLabel nonLinear activeStep={activeStepIndex} style={{ backgroundColor: "transparent" }}>
                {steps.map((step, index) => (
                    <Step key={index}>
                        <StepButton
                            onClick={handleStep(index)}
                            completed={step.get("completed")}
                            optional={(step.get("errorCount") > 0 && (
                                <Typography variant="caption" color="error">
                                    {step.get("errorCount")} {step.get("errorCount") === 1 ? "error" : "errors"}
                                </Typography>
                            )) || (step.has("warningCount") && step.get("warningCount") > 0 && (
                                <Typography variant="caption">
                                    {step.get("warningCount")} {step.get("warningCount") === 1 ? "warning" : "warnings"}
                                </Typography>
                            ))}
                        >
                            <StepLabel error={step.get("errorCount") > 0}>{step.get("label")}</StepLabel>
                        </StepButton>
                    </Step>
                ))}
            </Stepper>
            <div>
                <div>
                    {stepContent[activeStepIndex]}
                    <div>
                        <Button disabled={activeStepIndex === 0} onClick={handleBack} className={classes.button}>
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleNext}
                            className={classes.button}
                            disabled={activeStepIndex === steps.count() - 1 && allStepsCompleted()}
                        >
                            Next
                        </Button>

                        <Button variant="contained" color="primary" onClick={handleFinish} disabled={!allStepsCompleted()}>
                            Finish
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
