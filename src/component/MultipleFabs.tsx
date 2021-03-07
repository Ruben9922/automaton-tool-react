import Fab from "@material-ui/core/Fab";
import Tooltip from "@material-ui/core/Tooltip";
import React from "react";
import {makeStyles, Theme, useTheme} from "@material-ui/core/styles";
import {Zoom} from "@material-ui/core";

const useStyles = makeStyles((theme: Theme) => ({
  fab: {
    position: 'absolute',
    bottom: theme.spacing(4),
    right: theme.spacing(4),
  },
}));

export interface FabProps {
  tooltip: string;
  icon: React.ReactNode;
  action: () => void;
  label: string;
}

type MultipleFabsProps = {
  fabs: (FabProps | undefined)[];
  openFabIndex: number;
};

export default function MultipleFabs({ fabs, openFabIndex }: MultipleFabsProps) {
  const classes = useStyles();
  const theme = useTheme();

  const transitionDuration = {
    enter: theme.transitions.duration.enteringScreen,
    exit: theme.transitions.duration.leavingScreen,
  };

  return (
    <>
      {fabs.map((fab, index) => fab && (
        <Zoom
          key={index}
          in={openFabIndex === index}
          timeout={transitionDuration}
          style={{
            transitionDelay: `${openFabIndex === index ? transitionDuration.exit : 0}ms`,
          }}
          unmountOnExit
        >
          <Tooltip title={fab.tooltip} className={classes.fab}>
            <Fab onClick={fab.action} color="primary" aria-label={fab.label}>
              <>{fab.icon}</>
            </Fab>
          </Tooltip>
        </Zoom>
      ))}
    </>
  );
}
