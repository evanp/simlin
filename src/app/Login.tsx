// Copyright 2019 The Model Authors. All rights reserved.
// Use of this source code is governed by the Apache License,
// Version 2.0, that can be found in the LICENSE file.

import * as React from 'react';

import Button from '@material-ui/core/Button';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';

import Logo from './model-icon.svg';

import { exists } from './common';

const styles = createStyles({
  loginOuter: {
    display: 'table',
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  loginMiddle: {
    display: 'table-cell',
    verticalAlign: 'middle',
  },
  loginInner: {
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
  },
  loginDisabled: {
    pointerEvents: 'none',
    opacity: 0,
  },
});

interface LoginPropsFull extends WithStyles<typeof styles> {
  disabled: boolean;
}

export type LoginProps = Pick<LoginPropsFull, 'disabled'>;

export const Login = withStyles(styles)(
  class extends React.Component<LoginPropsFull> {
    constructor(props: LoginPropsFull) {
      super(props);
    }

    loginClick = (): void => {
      const location = exists(/http(s?):\/\/[^\/]*/.exec(window.location.href))[0];
      window.location.href = `${location}/auth/google`;
    };

    render() {
      const { classes } = this.props;
      const disabledClass = this.props.disabled ? classes.loginDisabled : '';
      return (
        <div className={classes.loginOuter}>
          <div className={classes.loginMiddle}>
            <div className={classes.loginInner}>
              <Logo />
              <br />
              <div className={disabledClass}>
                <Button variant="contained" color="primary" onClick={this.loginClick}>
                  Sign in with Google
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  },
);
