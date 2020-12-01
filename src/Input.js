import React from 'react';
import Container from "@material-ui/core/Container";
import AlphabetInput from "./AlphabetInput";
import StatesInput from "./StatesInput";
import TransitionsInput from "./TransitionsInput";
import {List, Map, OrderedSet, Set} from "immutable";
import {makeStyles} from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import {Step, StepButton, Stepper} from "@material-ui/core";

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
            transitionFunction.set(new Map({
                currentState: transition.currentState,
                symbol: transition.symbol,
            }), transition.nextState);
        }
        return transitionFunction;
    }

    return Map({
        alphabet: OrderedSet(alphabet.split("")),
        states: OrderedSet(states),
        transitionFunction: transitionsToTransitionFunction(transitions),
        initialState: states.get(initialStateIndex),
        finalStates: states.filter((value, index, iter) => finalStateIndices.includes(index)),
    })
}

export default function Input({onAutomatonChange}) {
    const classes = useStyles();

    const [alphabet, setAlphabet] = React.useState("");
    const [states, setStates] = React.useState(List());
    const [initialStateIndex, setInitialStateIndex] = React.useState(-1);
    const [finalStateIndices, setFinalStateIndices] = React.useState(OrderedSet());
    const [transitions, setTransitions] = React.useState(List());

    const [activeStep, setActiveStep] = React.useState(0);
    const [completed, setCompleted] = React.useState(Set());
    const steps = ["Specify alphabet", "Specify states", "Specify transitions"];

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <AlphabetInput alphabet={alphabet} onAlphabetChange={setAlphabet}/>
                );
            case 1:
                return (
                    <StatesInput
                        states={states}
                        onStatesChange={setStates}
                        initialStateIndex={initialStateIndex}
                        onInitialStateIndexChange={setInitialStateIndex}
                        finalStateIndices={finalStateIndices}
                        onFinalStateIndicesChange={setFinalStateIndices}
                    />
                );
            case 2:
                return (
                    <TransitionsInput
                        transitions={transitions}
                        onTransitionsChange={setTransitions}
                        alphabet={alphabet}
                        states={states}
                    />
                );
            default:
                return (
                    <p>Unknown step</p>
                );
        }
    }

    const totalSteps = () => steps.length;

    const completedSteps = () => completed.count();

    const allStepsCompleted = () => completedSteps() === totalSteps();

    const isLastStep = () => activeStep === totalSteps() - 1;

    const handleNext = () => {
        const newActiveStep =
            isLastStep() && !allStepsCompleted()
                ? // It's the last step, but not all steps have been completed
                  // find the first step that has been completed
                steps.findIndex((step, i) => !completed.includes(i))
                : activeStep + 1;

        setActiveStep(newActiveStep);
    };

    const handleBack = () => setActiveStep((prevActiveStep) => prevActiveStep - 1);

    const handleStep = step => () => setActiveStep(step);

    const handleComplete = () => {
        setCompleted(prevCompleted => prevCompleted.add(activeStep));

        /**
         * Sigh... it would be much nicer to replace the following if conditional with
         * `if (!this.allStepsComplete())` however state is not set when we do this,
         * thus we have to resort to not being very DRY.
         */
        if (completed.count() === totalSteps()) {
            let automaton = createAutomaton();
            onAutomatonChange(automaton);
        } else {
            handleNext();
        }
    };

    const handleReset = () => {
        setActiveStep(0);
        setCompleted(Set());
    };

    const isStepComplete = step => completed.includes(step);

    return (
        <Container maxWidth="md">
            <div className={classes.root}>
                <Stepper alternativeLabel nonLinear activeStep={activeStep}>
                    {steps.map((label, index) => {
                        const stepProps = {};
                        // if (isStepSkipped(index)) {
                        //     stepProps.completed = false;
                        // }
                        return (
                            <Step key={label} {...stepProps}>
                                <StepButton
                                    onClick={handleStep(index)}
                                    completed={isStepComplete(index)}
                                >
                                    {label}
                                </StepButton>
                            </Step>
                        );
                    })}
                </Stepper>
                <div>
                    <div>
                        {getStepContent(activeStep)}
                        <div>
                            <Button disabled={activeStep === 0} onClick={handleBack} className={classes.button}>
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleNext}
                                className={classes.button}
                            >
                                Next
                            </Button>

                            {activeStep !== steps.length &&
                            (completed.includes(activeStep) ? (
                                <Typography variant="caption" className={classes.completed}>
                                    Step {activeStep + 1} already completed
                                </Typography>
                            ) : (
                                <Button variant="contained" color="primary" onClick={handleComplete}>
                                    {completedSteps() === totalSteps() - 1 ? 'Finish' : 'Complete Step'}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
}
