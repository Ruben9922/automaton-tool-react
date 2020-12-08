import React from "react";
import Input from "./Input";
import View from "./View";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Fab from "@material-ui/core/Fab";
import AddIcon from '@material-ui/icons/Add';
import {makeStyles} from "@material-ui/core/styles";
import {Link} from "react-router-dom";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";

const useStyles = makeStyles((theme) => ({
    fab: {
        position: 'absolute',
        bottom: theme.spacing(4),
        right: theme.spacing(4),
    },
}));

export default function Home({automata, onAutomataChange}) {
    const classes = useStyles();

    const handleRemoveAutomatonClick = index => {
        onAutomataChange(prevAutomata => prevAutomata.delete(index))
    }

    return (
        <>
            {automata.isEmpty() ? (
                <>
                    <Typography variant="h5" component="h1" gutterBottom>
                        Welcome to Automaton Tool!
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        No automata saved yet! Create an automaton and it will show up here.
                    </Typography>
                </>
            ) : (
                <List>
                    {automata.map((automaton, index) => (
                        <React.Fragment key={index}>
                        <ListItem key={index}>
                            <ListItemText
                                primary={`Automaton ${index + 1}`}
                                secondary={`${automaton.get("states").count()} states, ${automaton.get("transitionFunction").count()} transitions`}
                            />
                        </ListItem>
                        <Tooltip title={`Delete Automaton ${index + 1}`}>
                            <IconButton onClick={() => handleRemoveAutomatonClick(index)} aria-label="delete">
                                <DeleteIcon/>
                            </IconButton>
                        </Tooltip>
                        </React.Fragment>
                    ))}
                </List>
            )}
            <Link to="/create">
                <Tooltip title="Add automaton" className={classes.fab}>
                    <Fab color="primary" aria-label="add">
                        <AddIcon/>
                    </Fab>
                </Tooltip>
            </Link>
        </>
    );
}
