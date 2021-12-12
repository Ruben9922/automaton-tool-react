import React from "react";
import MuiDialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from "@material-ui/core/Button";

interface DialogButton {
  content: string;
  onClick: () => void;
  color?: "inherit" | "primary" | "secondary" | "default";
  autoFocus: boolean;
}

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttons: DialogButton[];
};

export default function Dialog({
  open,
  onClose,
  title,
  message,
  buttons,
}: DialogProps) {
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {buttons.map((button: DialogButton, index: number) => (
          <Button
            onClick={button.onClick}
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            color={button.color}
            autoFocus={button.autoFocus}
          >
            {button.content}
          </Button>
        ))}
      </DialogActions>
    </MuiDialog>
  );
}
