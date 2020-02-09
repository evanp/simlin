// Copyright 2019 The Model Authors. All rights reserved.
// Use of this source code is governed by the Apache License,
// Version 2.0, that can be found in the LICENSE file.

import * as React from 'react';

import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

import { createEditor, Node } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Checkbox from '@material-ui/core/Checkbox';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

import { Table, Variable } from '../../engine/vars';
import { ViewElement } from '../../engine/xmile';

import { defined, Series } from '../common';
import { plainDeserialize, plainSerialize } from './drawing/common';

const styles = createStyles({
  card: {
    width: 359,
  },
  cardInner: {
    paddingTop: 52,
  },
  editorActions: {},
  eqnEditor: {
    backgroundColor: 'rgba(245, 245, 245)',
    borderRadius: 4,
    marginTop: 4,
    padding: 4,
    height: 80,
    fontFamily: "'Roboto Mono', monospace",
  },
  buttonLeft: {
    float: 'left',
    marginRight: 'auto',
  },
  buttonRight: {
    float: 'right',
  },
});

interface VariableDetailsPropsFull extends WithStyles<typeof styles> {
  variable: Variable;
  viewElement: ViewElement;
  onDelete: (ident: string) => void;
  onEquationChange: (ident: string, newEquation: string) => void;
  data: Series | undefined;
}

// export type VariableDetailsProps = Pick<VariableDetailsPropsFull, 'variable' | 'viewElement' | 'data'>;

interface VariableDetailsState {
  equation: Node[];
  editor: ReactEditor;
  activeTab: number;
  hasLookupTable: boolean;
}

function equationFromValue(children: Node[]): string {
  return plainSerialize(children);
}

function valueFromEquation(equation: string): Node[] {
  return plainDeserialize(equation);
}

function equationFor(variable: Variable): string {
  return (defined(variable.xmile).eqn || '').trim();
}

export const VariableDetails = withStyles(styles)(
  class InnerVariableDetails extends React.PureComponent<VariableDetailsPropsFull, VariableDetailsState> {
    constructor(props: VariableDetailsPropsFull) {
      super(props);

      const { variable } = props;

      this.state = {
        editor: withHistory(withReact(createEditor())),
        equation: valueFromEquation(equationFor(variable)),
        activeTab: 0,
        hasLookupTable: variable instanceof Table,
      };
    }

    handleEquationChange = (equation: Node[]): void => {
      this.setState({ equation });
    };

    handleVariableDelete = (): void => {
      this.props.onDelete(this.props.viewElement.ident);
    };

    handleNotesChange = (_event: React.ChangeEvent<HTMLInputElement>): void => {};

    handleEquationCancel = (): void => {
      this.setState({
        equation: valueFromEquation(equationFor(this.props.variable)),
      });
    };

    handleEquationSave = (): void => {
      const { equation } = this.state;
      const initialEquation = equationFor(this.props.variable);

      const newEquation = equationFromValue(equation);
      if (initialEquation !== newEquation) {
        this.props.onEquationChange(this.props.viewElement.ident, newEquation);
      }
    };

    formatValue = (value: string | number | (string | number)[]): string | (string | number)[] => {
      return typeof value === 'number' ? value.toFixed(3) : value;
    };

    handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
      this.setState({ activeTab: newValue });
    };

    handleToggleLookupTable = (): void => {
      this.setState(state => ({ hasLookupTable: !state.hasLookupTable }));
    };

    renderEquation() {
      const { data, classes } = this.props;
      const { equation } = this.state;
      const initialEquation = equationFor(this.props.variable);

      let yMin = 0;
      let yMax = 0;
      const series: { x: number; y: number }[] = [];
      for (let i = 0; data && i < data.time.length; i++) {
        const x = data.time[i];
        const y = data.values[i];
        series.push({ x, y });
        if (y < yMin) {
          yMin = y;
        }
        if (y > yMax) {
          yMax = y;
        }
      }
      yMin = Math.floor(yMin);
      yMax = Math.ceil(yMax);

      const charWidth = Math.max(yMin.toFixed(0).length, yMax.toFixed(0).length);
      const yAxisWidth = Math.max(40, 20 + charWidth * 6);

      // enable saving and canceling if the equation has changed
      const equationActionsEnabled = initialEquation !== equationFromValue(equation);

      const { left, right } = {
        left: 'dataMin',
        right: 'dataMax',
      };

      return (
        <div>
          <Slate
            editor={this.state.editor}
            value={this.state.equation}
            onChange={this.handleEquationChange}
            onBlur={this.handleEquationSave}
          >
            <Editable className={classes.eqnEditor} placeholder="Enter an equation..." />
          </Slate>

          <CardActions className={classes.editorActions}>
            <Button size="small" color="secondary" onClick={this.handleVariableDelete} className={classes.buttonLeft}>
              Delete
            </Button>
            <div className={classes.buttonRight}>
              <Button
                size="small"
                color="primary"
                disabled={!equationActionsEnabled}
                onClick={this.handleEquationCancel}
              >
                Cancel
              </Button>
              <Button size="small" color="primary" disabled={!equationActionsEnabled} onClick={this.handleEquationSave}>
                Save
              </Button>
            </div>
          </CardActions>

          {/*<TextField*/}
          {/*  label="Units"*/}
          {/*  fullWidth*/}
          {/*  InputLabelProps={{*/}
          {/*    shrink: true,*/}
          {/*  }}*/}
          {/*  value={''}*/}
          {/*  margin="normal"*/}
          {/*/>*/}

          {/*<TextField*/}
          {/*  label="Notes"*/}
          {/*  fullWidth*/}
          {/*  InputLabelProps={{*/}
          {/*    shrink: true,*/}
          {/*  }}*/}
          {/*  value={defined(this.props.variable.xmile).doc}*/}
          {/*  onChange={this.handleNotesChange}*/}
          {/*  margin="normal"*/}
          {/*/>*/}

          {/*<br />*/}
          <hr />
          <br />
          <LineChart width={327} height={300} data={series}>
            <CartesianGrid horizontal={true} vertical={false} />
            <XAxis allowDataOverflow={true} dataKey="x" domain={[left, right]} type="number" />
            <YAxis
              width={yAxisWidth}
              allowDataOverflow={true}
              domain={[yMin, yMax]}
              type="number"
              dataKey="y"
              yAxisId="1"
            />
            <Tooltip formatter={this.formatValue} />
            <Line yAxisId="1" type="linear" dataKey="y" stroke="#8884d8" animationDuration={300} dot={false} />
          </LineChart>
        </div>
      );
    }

    renderLookup() {
      const { variable } = this.props;
      const { hasLookupTable } = this.state;

      let table;
      if (hasLookupTable && variable instanceof Table) {
        let yMin = 0;
        let yMax = 0;
        const series: { x: number; y: number }[] = [];
        for (let i = 0; i < variable.x.size; i++) {
          const x = defined(variable.x.get(i));
          const y = defined(variable.y.get(i));
          series.push({ x, y });
          if (y < yMin) {
            yMin = y;
          }
          if (y > yMax) {
            yMax = y;
          }
        }
        yMin = Math.floor(yMin);
        yMax = Math.ceil(yMax);

        const charWidth = Math.max(yMin.toFixed(0).length, yMax.toFixed(0).length);
        const yAxisWidth = Math.max(40, 20 + charWidth * 6);

        const { left, right } = {
          left: 'dataMin',
          right: 'dataMax',
        };

        table = (
          <LineChart width={327} height={300} data={series}>
            <CartesianGrid horizontal={true} vertical={false} />
            <XAxis allowDataOverflow={true} dataKey="x" domain={[left, right]} type="number" />
            <YAxis
              width={yAxisWidth}
              allowDataOverflow={true}
              domain={[yMin, yMax]}
              type="number"
              dataKey="y"
              yAxisId="1"
            />
            <Tooltip formatter={this.formatValue} />
            <Line yAxisId="1" type="linear" dataKey="y" stroke="#8884d8" animationDuration={300} dot={false} />
          </LineChart>
        );
      }

      return (
        <div>
          <div>
            <Checkbox checked={hasLookupTable} onChange={this.handleToggleLookupTable} />
            Has Lookup Table
          </div>
          <br />
          {table}
        </div>
      );
    }

    render() {
      const { classes, viewElement } = this.props;
      const { activeTab } = this.state;

      const equationType = viewElement.type === 'stock' ? 'Initial Value' : 'Equation';
      const content = activeTab === 0 ? this.renderEquation() : this.renderLookup();
      const lookupTab = viewElement.type === 'stock' ? undefined : <Tab label="Lookup Function" />;

      return (
        <Card className={classes.card} elevation={1}>
          <Tabs
            className={classes.cardInner}
            variant="fullWidth"
            value={activeTab}
            indicatorColor="primary"
            textColor="primary"
            onChange={this.handleTabChange}
            aria-label="Equation details selector"
          >
            <Tab label={equationType} />
            {lookupTab}
          </Tabs>

          <CardContent>{content}</CardContent>
        </Card>
      );
    }
  },
);
