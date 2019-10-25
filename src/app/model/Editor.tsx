// Copyright 2019 The Model Authors. All rights reserved.
// Use of this source code is governed by the Apache License,
// Version 2.0, that can be found in the LICENSE file.

import * as React from 'react';

import { List, Map, Set } from 'immutable';

import { History } from 'history';

import { Project, stdProject } from '../../engine/project';
import { Sim } from '../../engine/sim';
import { Stock as StockVar } from '../../engine/vars';
import { FileFromJSON, Point as XmilePoint, UID, View, ViewElement } from '../../engine/xmile';

import { Canvas, fauxTargetUid, inCreationCloudUid, inCreationUid } from './drawing/Canvas';
import { Point } from './drawing/common';
import { canvasToXmileAngle, takeoffθ } from './drawing/Connector';
import { UpdateCloudAndFlow, UpdateFlow, UpdateStockAndFlows } from './drawing/Flow';

import { baseURL, defined, Series } from '../common';

import IconButton from '@material-ui/core/IconButton';
import Input from '@material-ui/core/Input';
import Paper from '@material-ui/core/Paper';
import Snackbar from '@material-ui/core/Snackbar';

import ClearIcon from '@material-ui/icons/Clear';
import EditIcon from '@material-ui/icons/Edit';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';

import SpeedDial, { CloseReason } from '@material-ui/lab/SpeedDial';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';

import { AuxIcon } from './AuxIcon';
import { Toast } from './ErrorToast';
import { FlowIcon } from './FlowIcon';
import { LinkIcon } from './LinkIcon';
import { ModelPropertiesDrawer } from './ModelPropertiesDrawer';
import { Status } from './Status';
import { StockIcon } from './StockIcon';

import { createStyles, Theme } from '@material-ui/core/styles';
import withStyles, { WithStyles } from '@material-ui/core/styles/withStyles';
import { VariableDetails } from './VariableDetails';

function radToDeg(r: number): number {
  return (r * 180) / Math.PI;
}

const styles = ({ spacing, palette }: Theme) =>
  createStyles({
    root: {},
    speedDial: {
      position: 'absolute',
      bottom: spacing(2),
      right: spacing(3),
    },
    searchbox: {
      position: 'relative',
      top: 0,
      left: 0,
      paddingLeft: 64,
      paddingTop: 12,
      paddingBottom: 12,
      paddingRight: 70,
      height: '100%',
      width: '100%',
    },
    menuButton: {
      marginLeft: 4,
      position: 'absolute',
      zIndex: 100,
      left: 0,
      top: 0,
      display: 'block',
      color: '#666',
    },
    paper: {
      position: 'absolute',
      top: 8,
      left: 8,
      height: 48,
      width: 359, // 392
    },
    varDetails: {
      position: 'absolute',
      top: 8,
      left: 8,
    },
    searchButton: {
      color: '#aaa',
    },
    divider: {
      position: 'absolute',
      top: 0,
      right: 0,
      height: 28,
      marginTop: 10,
      marginRight: 54,
      borderLeftWidth: 1,
      borderLeftStyle: 'solid',
      borderColor: '#ddd',
    },
    editor: {
      boxSizing: 'border-box',
      overflow: 'hidden',
    },
    editorBg: {
      background: '#f2f2f2',
      // background: '#fffff8',
      width: '100%',
      height: '100%',
      position: 'fixed',
    },
    selectedTool: {
      backgroundColor: palette.secondary.main,
    },
  });

class ModelError implements Error {
  name = 'ModelError';
  message: string;
  constructor(msg: string) {
    this.message = msg;
  }
}

interface EditorState {
  modelErrors: List<Error>;
  project?: Project;
  modelName: string;
  dialOpen: boolean;
  dialVisible: boolean;
  selectedTool: 'stock' | 'flow' | 'aux' | 'link' | undefined;
  sim?: Sim;
  data: Map<string, Series>;
  selection: Set<UID>;
  snackbarErrors: List<string>;
  drawerOpen: boolean;
}

interface EditorProps extends WithStyles<typeof styles> {
  username: string;
  projectName: string;
  embedded?: boolean;
  baseURL?: string;
  history?: History;
}

export const Editor = withStyles(styles)(
  class InnerEditor extends React.PureComponent<EditorProps, EditorState> {
    constructor(props: EditorProps) {
      super(props);

      this.state = {
        modelErrors: List(),
        modelName: 'main',
        dialOpen: false,
        dialVisible: true,
        selectedTool: undefined,
        data: Map(),
        selection: Set(),
        snackbarErrors: List<string>(),
        drawerOpen: false,
      };

      setTimeout(async () => {
        const project = await this.loadModel();
        if (!project) {
          return;
        }
        await this.loadSim(project);
      });
    }

    private scheduleSimRun(): void {
      setTimeout(async () => {
        if (!this.state.project) {
          return;
        }
        try {
          await this.loadSim(this.state.project);
        } catch (err) {
          console.log(`TODO: surface sim error '${err.message}'`);
        }
      });
    }

    private async loadSim(project: Project): Promise<void> {
      try {
        const sim = new Sim(project, defined(project.main), false);
        await sim.runToEnd();
        const names = await sim.varNames();
        const data = await sim.series(...names);
        setTimeout(async () => {
          await sim.close();
        });
        this.setState({ data });
      } catch (e) {
        this.setState({
          modelErrors: this.state.modelErrors.push(e),
        });
      }
    }

    private getBaseURL(): string {
      return this.props.baseURL !== undefined ? this.props.baseURL : baseURL;
    }

    private appendModelError(msg: string) {
      this.setState((prevState: EditorState) => ({
        modelErrors: prevState.modelErrors.push(new ModelError(msg)),
      }));
    }

    private async loadModel(): Promise<Project | undefined> {
      const base = this.getBaseURL();
      const apiPath = `${base}/api/projects/${this.props.username}/${this.props.projectName}`;
      const response = await fetch(apiPath);
      if (response.status >= 400) {
        this.appendModelError(`unable to load ${apiPath}`);
        return;
      }

      const projectResponse = await response.json();
      const fileJSON = JSON.parse(projectResponse.file);
      let file;
      try {
        file = FileFromJSON(fileJSON);
      } catch (err) {
        this.appendModelError(`FileFromJSON: ${err.message}`);
        return;
      }

      const [project, err2] = stdProject.addFile(defined(file));
      if (err2 || !project) {
        this.appendModelError(`addFile: ${err2 && err2.message}`);
        return;
      }

      this.setState({
        project,
      });

      return project;
    }

    handleDialClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      this.setState({
        dialOpen: !this.state.dialOpen,
        selectedTool: this.state.dialOpen ? undefined : this.state.selectedTool,
      });
    };

    handleDialClose = (e: React.SyntheticEvent<{}>, reason: CloseReason) => {
      if (reason === 'mouseLeave' || reason === 'blur') {
        return;
      }
      this.setState({
        dialOpen: false,
        selectedTool: undefined,
      });
    };

    handleRename = (oldName: string, newName: string) => {
      this.setState(prevState => {
        if (!prevState.project) {
          return {};
        }
        let newProject;
        try {
          newProject = prevState.project.rename(prevState.modelName, oldName, newName);
        } catch (err) {
          // if we don't do this, react yells because "update functions should be pure"
          setTimeout(() => {
            this.setState(prevState => ({
              snackbarErrors: prevState.snackbarErrors.push(err.message),
            }));
          });
          return {};
        }
        this.scheduleSimRun();
        return {
          project: newProject,
        };
      });
    };

    handleSelection = (selection: Set<UID>) => {
      this.setState({
        selection,
      });
    };

    handleSelectionDelete = () => {
      const selection = this.state.selection;
      const { modelName } = this.state;
      const updatePath = ['models', modelName, 'xModel', 'views', 0];
      const project = defined(this.state.project).updateIn(
        updatePath,
        (view: View): View => {
          const getName = (ident: string) => {
            for (const e of view.elements) {
              if (e.hasName && e.ident === ident) {
                return e;
              }
            }
            throw new Error(`unknown name ${ident}`);
          };
          const elements = view.elements.filter((element: ViewElement) => {
            return !selection.contains(element.uid);
          });
          return view.merge({ elements });
        },
      );
      this.setState({
        project,
        selection: Set(),
      });
    };

    handleFlowAttach = (flow: ViewElement, targetUid: number, cursorMoveDelta: Point) => {
      let { selection } = this.state;
      const { modelName } = this.state;
      const updatePath = ['models', modelName, 'xModel', 'views', 0];
      let isCreatingNew = false;
      let stockDetachingIdent: string | undefined;
      let stockAttachingIdent: string | undefined;
      let sourceStockIdent: string | undefined;
      let uidToDelete: number | undefined;
      let updatedCloud: ViewElement | undefined;
      let newClouds = List<ViewElement>();
      let project = defined(this.state.project).updateIn(
        updatePath,
        (view: View): View => {
          let nextUid = view.nextUid;
          const getUid = (uid: number) => {
            for (const e of view.elements) {
              if (e.uid === uid) {
                return e;
              }
            }
            throw new Error(`unknown uid ${uid}`);
          };
          let elements = view.elements.map((element: ViewElement) => {
            if (element.uid !== flow.uid) {
              return element;
            }

            const oldTo = getUid(defined(defined(defined(element.pts).last()).uid));
            let newCloud = false;
            let updateCloud = false;
            let to: ViewElement;
            if (targetUid) {
              if (oldTo.type === 'cloud') {
                uidToDelete = oldTo.uid;
              }
              to = getUid(targetUid);
            } else if (oldTo.type === 'cloud') {
              updateCloud = true;
              to = oldTo.merge({
                x: oldTo.cx - cursorMoveDelta.x,
                y: oldTo.cy - cursorMoveDelta.y,
              });
            } else {
              newCloud = true;
              to = new ViewElement({
                uid: nextUid++,
                type: 'cloud',
                x: oldTo.cx - cursorMoveDelta.x,
                y: oldTo.cy - cursorMoveDelta.y,
                flowUid: flow.uid,
              });
            }

            if (oldTo.uid !== to.uid) {
              if (oldTo.type === 'stock') {
                stockDetachingIdent = oldTo.ident;
              }
              if (to.type === 'stock') {
                stockAttachingIdent = to.ident;
              }
            }

            const moveDelta = {
              x: oldTo.cx - to.cx,
              y: oldTo.cy - to.cy,
            };
            const pts = (element.pts || List<XmilePoint>()).map((point, i) => {
              if (point.uid !== oldTo.uid) {
                return point;
              }
              return point.set('uid', to.uid);
            });
            to = to.merge({
              x: oldTo.cx,
              y: oldTo.cy,
              width: undefined,
              height: undefined,
            });
            element = element.set('pts', pts);

            [to, element] = UpdateCloudAndFlow(to, element, moveDelta);
            if (newCloud) {
              newClouds = newClouds.push(to);
            } else if (updateCloud) {
              updatedCloud = to;
            }

            return element;
          });
          // we might have updated some clouds
          elements = elements.map((element: ViewElement) => {
            if (updatedCloud && updatedCloud.uid === element.uid) {
              return updatedCloud;
            }
            return element;
          });
          // if we have something to delete, do it here
          elements = elements.filter(e => e.uid !== uidToDelete);
          if (flow.uid === inCreationUid) {
            flow = flow.merge({
              uid: nextUid++,
            });
            const firstPt = defined(defined(flow.pts).first());
            const sourceUid = firstPt.uid;
            if (sourceUid === inCreationCloudUid) {
              const newCloud = new ViewElement({
                type: 'cloud',
                uid: nextUid++,
                x: firstPt.x,
                y: firstPt.y,
                flowUid: flow.uid,
              });
              elements = elements.push(newCloud);
              flow = flow.set(
                'pts',
                (flow.pts || List()).map(pt => {
                  if (pt.uid === inCreationCloudUid) {
                    return pt.set('uid', newCloud.uid);
                  }
                  return pt;
                }),
              );
            } else if (sourceUid) {
              const sourceStock = getUid(sourceUid);
              sourceStockIdent = sourceStock.ident;
            }
            const lastPt = defined(defined(flow.pts).last());
            if (lastPt.uid === fauxTargetUid) {
              let newCloud = false;
              let to: ViewElement;
              if (targetUid) {
                to = getUid(targetUid);
                stockAttachingIdent = to.ident;
                cursorMoveDelta = {
                  x: 0,
                  y: 0,
                };
              } else {
                to = new ViewElement({
                  type: 'cloud',
                  uid: nextUid++,
                  x: lastPt.x,
                  y: lastPt.y,
                  flowUid: flow.uid,
                });
                newCloud = true;
              }
              flow = flow.set(
                'pts',
                (flow.pts || List()).map(pt => {
                  if (pt.uid === fauxTargetUid) {
                    return pt.set('uid', to.uid);
                  }
                  return pt;
                }),
              );
              [to, flow] = UpdateCloudAndFlow(to, flow, cursorMoveDelta);
              if (newCloud) {
                elements = elements.push(to);
              }
            }
            elements = elements.push(flow);
            selection = Set([flow.uid]);
            isCreatingNew = true;
          }
          elements = elements.concat(newClouds);
          return view.merge({ nextUid, elements });
        },
      );
      if (isCreatingNew) {
        project = project.addNewVariable(this.state.modelName, flow.type, defined(flow.name));
        if (sourceStockIdent) {
          project = project.addStocksFlow(this.state.modelName, sourceStockIdent, flow.ident, 'out');
        }
      }
      if (stockAttachingIdent) {
        project = project.addStocksFlow(this.state.modelName, stockAttachingIdent, flow.ident, 'in');
      }
      if (stockDetachingIdent) {
        project = project.removeStocksFlow(this.state.modelName, stockDetachingIdent, flow.ident, 'in');
      }
      this.setState({ project, selection });
      this.scheduleSimRun();
    };

    handleLinkAttach = (link: ViewElement, newTarget: string) => {
      let { selection } = this.state;
      const { modelName } = this.state;
      const updatePath = ['models', modelName, 'xModel', 'views', 0];
      const project = defined(this.state.project).updateIn(
        updatePath,
        (view: View): View => {
          const getName = (ident: string) => {
            for (const e of view.elements) {
              if (e.hasName && e.ident === ident) {
                return e;
              }
            }
            throw new Error(`unknown name ${ident}`);
          };
          const getUid = (uid: number) => {
            for (const e of view.elements) {
              if (e.uid === uid) {
                return e;
              }
            }
            throw new Error(`unknown uid ${uid}`);
          };
          let elements = view.elements.map((element: ViewElement) => {
            if (element.uid !== link.uid) {
              return element;
            }

            const from = getName(defined(element.from));
            const oldTo = getName(defined(element.to));
            const to = getName(defined(newTarget));

            const oldθ = Math.atan2(oldTo.cy - from.cy, oldTo.cx - from.cx);
            const newθ = Math.atan2(to.cy - from.cy, to.cx - from.cx);
            const diffθ = oldθ - newθ;
            const angle = (element.angle || 180) + radToDeg(diffθ);

            return element.merge({
              angle,
              to: newTarget,
            });
          });
          let nextUid = view.nextUid;
          if (link.uid === inCreationUid) {
            const fromName = defined(link.from);
            const from = defined(elements.find(e => e.hasName && e.ident === fromName));
            const to = defined(elements.find(e => e.hasName && e.ident === newTarget));

            const oldθ = Math.atan2(0 - from.cy, 0 - from.cx);
            const newθ = Math.atan2(to.cy - from.cy, to.cx - from.cx);
            const diffθ = oldθ - newθ;
            const angle = (link.angle || 180) + radToDeg(diffθ);

            const newLink = link.merge({
              uid: nextUid++,
              to: newTarget,
              angle,
            });
            elements = elements.push(newLink);
            selection = Set([newLink.uid]);
          }
          return view.merge({ nextUid, elements });
        },
      );
      this.setState({ project, selection });
    };

    handleCreateVariable = (element: ViewElement) => {
      const updatePath = ['models', this.state.modelName, 'xModel', 'views', 0];
      let project = defined(this.state.project).updateIn(
        updatePath,
        (view: View): View => {
          let nextUid = view.nextUid;
          element = element.set('uid', nextUid++);
          const elements = view.elements.push(element);
          return view.merge({ nextUid, elements });
        },
      );

      project = project.addNewVariable(this.state.modelName, element.type, defined(element.name));

      this.setState({
        project,
        selection: Set(),
      });
    };

    handleSelectionMove = (delta: Point, arcPoint?: Point) => {
      const origElements = defined(defined(defined(this.state.project).model(this.state.modelName)).view(0)).elements;
      let origNamedElements = Map<string, ViewElement>();
      for (const e of origElements) {
        if (e.hasName) {
          origNamedElements = origNamedElements.set(e.ident, e);
        }
      }
      const selection = this.state.selection;
      const updatePath = ['models', this.state.modelName, 'xModel', 'views', 0];
      const project = defined(this.state.project).updateIn(
        updatePath,
        (view: View): View => {
          const getName = (ident: string) => {
            for (const e of view.elements) {
              if (e.hasName && e.ident === ident) {
                return e;
              }
            }
            throw new Error(`unknown name ${name}`);
          };
          const getUid = (uid: UID) => {
            for (const e of view.elements) {
              if (e.uid === uid) {
                return e;
              }
            }
            throw new Error(`unknown UID ${uid}`);
          };

          let updatedElements = List<ViewElement>();

          let elements = view.elements.map((element: ViewElement) => {
            if (!selection.has(element.uid)) {
              return element;
            }

            if (selection.size === 1 && element.type === 'flow') {
              const pts = defined(element.pts);
              const sourceId = defined(defined(pts.get(0)).uid);
              const source = getUid(sourceId);

              const sinkId = defined(defined(pts.get(pts.size - 1)).uid);
              const sink = getUid(sinkId);

              const ends = List<ViewElement>([source, sink]);
              const [newElement, newUpdatedClouds] = UpdateFlow(element, ends, delta);
              element = newElement;
              updatedElements = updatedElements.concat(newUpdatedClouds);
            } else if (selection.size === 1 && element.type === 'cloud') {
              const flow = defined(getUid(defined(element.flowUid)));
              const [newCloud, newUpdatedFlow] = UpdateCloudAndFlow(element, flow, delta);
              element = newCloud;
              updatedElements = updatedElements.push(newUpdatedFlow);
            } else if (selection.size === 1 && element.type === 'stock') {
              const stock = defined(defined(this.getModel()).vars.get(element.ident)) as StockVar;
              const flowNames: List<string> = stock.inflows.concat(stock.outflows);
              const flows: List<ViewElement> = flowNames.map(ident => {
                for (const element of view.elements) {
                  if (element.hasName && element.ident === ident) {
                    return element;
                  }
                }
                throw new Error('unreachable');
              });
              const [newElement, newUpdatedFlows] = UpdateStockAndFlows(element, flows, delta);
              element = newElement;
              updatedElements = updatedElements.concat(newUpdatedFlows);
            } else if (element.type === 'connector') {
              const from = getName(defined(element.from));
              const to = getName(defined(element.to));
              const newTakeoffθ = takeoffθ({ element, from, to, arcPoint: defined(arcPoint) });
              const newTakeoff = canvasToXmileAngle(radToDeg(newTakeoffθ));
              element = element.merge({
                angle: newTakeoff,
              });
            } else {
              element = element.merge({
                x: defined(element.x) - delta.x,
                y: defined(element.y) - delta.y,
              });
            }
            return element;
          });

          const updatedFlowsByUid: Map<UID, ViewElement> = updatedElements.toMap().mapKeys((_, e) => e.uid);
          elements = elements.map(element => {
            if (updatedFlowsByUid.has(element.uid)) {
              return defined(updatedFlowsByUid.get(element.uid));
            }
            return element;
          });

          let namedElements = Map<string, ViewElement>();
          let selectedElements = Map<string, ViewElement>();
          for (const e of elements) {
            if (!e.hasName) {
              continue;
            }
            if (selection.has(e.uid)) {
              selectedElements = selectedElements.set(e.ident, e);
            }
            namedElements = namedElements.set(e.ident, selectedElements.get(e.ident, e));
          }

          elements = elements.map((element: ViewElement) => {
            if (element.type !== 'connector') {
              return element.hasName ? defined(namedElements.get(element.ident)) : element;
            }
            const fromName = defined(element.from);
            const toName = defined(element.to);
            // if it hasn't been updated, nothing to do
            if (!(selectedElements.has(fromName) || selectedElements.has(toName))) {
              return element;
            }
            const from = defined(selectedElements.get(fromName) || namedElements.get(fromName));
            const to = defined(selectedElements.get(toName) || namedElements.get(toName));
            const atan2 = Math.atan2;
            const oldTo = defined(origNamedElements.get(toName));
            const oldFrom = defined(origNamedElements.get(fromName));
            const oldθ = atan2(oldTo.cy - oldFrom.cy, oldTo.cx - oldFrom.cx);
            const newθ = atan2(to.cy - from.cy, to.cx - from.cx);
            const diffθ = oldθ - newθ;

            return element.update('angle', angle => {
              return defined(angle) + radToDeg(diffθ);
            });
          });
          return view.merge({ elements });
        },
      );
      this.setState({
        project,
      });
    };

    handleExitEditor = () => {
      if (this.props.history) {
        this.props.history.push('/');
      }
    };

    handleDrawerToggle = (isOpen: boolean) => {
      this.setState({
        drawerOpen: isOpen,
      });
    };

    handleStartTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newSimSpec = defined(this.state.project).simSpec.set('start', Number(event.target.value));
      this.setState(prevState => {
        this.scheduleSimRun();
        return {
          project: defined(prevState.project).setSimSpec(newSimSpec),
        };
      });
    };

    handleStopTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newSimSpec = defined(this.state.project).simSpec.set('stop', Number(event.target.value));
      this.setState(prevState => {
        this.scheduleSimRun();
        return {
          project: defined(prevState.project).setSimSpec(newSimSpec),
        };
      });
    };

    handleDtChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newSimSpec = defined(this.state.project).simSpec.set('dt', Number(event.target.value));
      this.setState(prevState => {
        this.scheduleSimRun();
        return {
          project: defined(prevState.project).setSimSpec(newSimSpec),
        };
      });
    };

    handleTimeUnitsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newSimSpec = defined(this.state.project).simSpec.set('timeUnits', event.target.value);
      this.setState(prevState => {
        return {
          project: defined(prevState.project).setSimSpec(newSimSpec),
        };
      });
    };

    getDrawer() {
      if (!this.state.project || this.props.embedded) {
        return;
      }

      const model = this.state.project.model(this.state.modelName);
      if (!model) {
        return;
      }

      const simSpec = defined(this.state.project.simSpec);

      return (
        <ModelPropertiesDrawer
          modelName={this.props.projectName}
          open={this.state.drawerOpen}
          onExit={this.handleExitEditor}
          onDrawerToggle={this.handleDrawerToggle}
          startTime={simSpec.start}
          stopTime={simSpec.stop}
          dt={simSpec.dt}
          timeUnits={simSpec.timeUnits || ''}
          onStartTimeChange={this.handleStartTimeChange}
          onStopTimeChange={this.handleStopTimeChange}
          onDtChange={this.handleDtChange}
          onTimeUnitsChange={this.handleTimeUnitsChange}
        />
      );
    }

    getModel() {
      if (!this.state.project) {
        return;
      }
      const modelName = this.state.modelName;
      return this.state.project.model(modelName);
    }

    getCanvas() {
      if (!this.state.project) {
        return;
      }

      const { embedded } = this.props;

      const model = this.getModel();
      if (!model) {
        return;
      }
      return (
        <Canvas
          embedded={!!embedded}
          project={this.state.project}
          model={model}
          view={defined(model.view(0))}
          data={this.state.data}
          selectedTool={this.state.selectedTool}
          selection={this.state.selection}
          onRenameVariable={this.handleRename}
          onSetSelection={this.handleSelection}
          onMoveSelection={this.handleSelectionMove}
          onMoveFlow={this.handleFlowAttach}
          onAttachLink={this.handleLinkAttach}
          onCreateVariable={this.handleCreateVariable}
          onClearSelectedTool={this.handleClearSelectedTool}
          onDeleteSelection={this.handleSelectionDelete}
        />
      );
    }

    handleCloseSnackbar = (msg: string) => {
      this.setState(prevState => ({
        snackbarErrors: prevState.snackbarErrors.filter(message => message !== msg),
      }));
    };

    getSnackbar() {
      const { embedded } = this.props;

      if (embedded) {
        return undefined;
      }

      return (
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={this.state.snackbarErrors.size > 0}
          autoHideDuration={6000}
        >
          <div>
            {this.state.snackbarErrors.map((msg, i) => (
              <Toast variant="warning" onClose={this.handleCloseSnackbar} message={msg} key={i} />
            ))}
          </div>
        </Snackbar>
      );
    }

    // FIXME: use a map
    getNamedSelectedElement(): ViewElement | undefined {
      if (this.state.selection.size !== 1) {
        return;
      }

      if (!this.state.project || !this.state.modelName) {
        return;
      }

      const uid = defined(this.state.selection.first());
      const model = this.state.project.model(this.state.modelName);
      if (!model) {
        return;
      }
      const view = defined(model.xModel.views.get(0));

      for (const e of view.elements) {
        if (e.uid === uid && e.hasName) {
          return e;
        }
      }

      return;
    }

    handleShowDrawer = () => {
      this.setState({
        drawerOpen: true,
      });
    };

    getSearchBar() {
      const { embedded } = this.props;
      const classes = this.props.classes;

      if (embedded) {
        return undefined;
      }

      const namedElement = this.getNamedSelectedElement();
      let name;
      let placeholder: string | undefined = 'Find in Model';
      if (namedElement) {
        name = defined(namedElement.name).replace('\\n', ' ');
        placeholder = undefined;
      }

      return (
        <Paper className={classes.paper} elevation={2}>
          <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={this.handleShowDrawer}>
            <MenuIcon />
          </IconButton>
          <Input
            key={name}
            className={classes.searchbox}
            disableUnderline={true}
            placeholder={placeholder}
            inputProps={{
              'aria-label': 'Description',
            }}
            defaultValue={name}
            endAdornment={name ? undefined : <SearchIcon className={classes.searchButton} />}
          />
          <div className={classes.divider} />
          <Status status="ok" />
        </Paper>
      );
    }

    handleEquationChange = (ident: string, newEquation: string) => {
      if (!this.state.project) {
        return;
      }

      const project = this.state.project.setEquation(this.state.modelName, ident, newEquation);
      this.setState({ project });
      this.scheduleSimRun();
    };

    getVariableDetails() {
      const { embedded } = this.props;
      const classes = this.props.classes;

      if (embedded) {
        return;
      }

      const namedElement = this.getNamedSelectedElement();
      if (!namedElement) {
        return;
      }

      const model = defined(this.state.project).model(this.state.modelName);
      if (!model) {
        return;
      }

      const variable = defined(model.vars.get(namedElement.ident));
      const series = this.state.data.get(namedElement.ident);

      return (
        <div className={classes.varDetails}>
          <VariableDetails
            key={`vd-${namedElement.ident}`}
            variable={variable}
            viewElement={namedElement}
            data={series}
            onEquationChange={this.handleEquationChange}
          />
        </div>
      );
    }

    handleClearSelectedTool = () => {
      this.setState({ selectedTool: undefined });
    };

    handleSelectStock = (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      this.setState({
        selectedTool: 'stock',
      });
    };

    handleSelectFlow = (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      this.setState({
        selectedTool: 'flow',
      });
    };

    handleSelectAux = (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      this.setState({
        selectedTool: 'aux',
      });
    };

    handleSelectLink = (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      this.setState({
        selectedTool: 'link',
      });
    };

    getEditorControls() {
      const { embedded } = this.props;
      const classes = this.props.classes;
      const { dialOpen, dialVisible, selectedTool } = this.state;

      if (embedded) {
        return undefined;
      }

      return (
        <SpeedDial
          ariaLabel="SpeedDial openIcon example"
          className={classes.speedDial}
          hidden={!dialVisible}
          icon={<SpeedDialIcon icon={<EditIcon />} openIcon={<ClearIcon />} />}
          onClick={this.handleDialClick}
          onClose={this.handleDialClose}
          open={dialOpen}
        >
          <SpeedDialAction
            icon={<StockIcon />}
            tooltipTitle="Stock"
            onClick={this.handleSelectStock}
            className={selectedTool === 'stock' ? classes.selectedTool : undefined}
          />
          <SpeedDialAction
            icon={<FlowIcon />}
            tooltipTitle="Flow"
            onClick={this.handleSelectFlow}
            className={selectedTool === 'flow' ? classes.selectedTool : undefined}
          />
          <SpeedDialAction
            icon={<AuxIcon />}
            tooltipTitle="Variable"
            onClick={this.handleSelectAux}
            className={selectedTool === 'aux' ? classes.selectedTool : undefined}
          />
          <SpeedDialAction
            icon={<LinkIcon />}
            tooltipTitle="Link"
            onClick={this.handleSelectLink}
            className={selectedTool === 'link' ? classes.selectedTool : undefined}
          />
        </SpeedDial>
      );
    }

    render() {
      const { embedded, classes } = this.props;

      const classNames = classes.editor + (embedded ? '' : ' ' + classes.editorBg);

      return (
        <div className={classNames}>
          {this.getDrawer()}
          {this.getVariableDetails()}
          {this.getSearchBar()}
          {this.getCanvas()}
          {this.getSnackbar()}
          {this.getEditorControls()}
        </div>
      );
    }
  },
);
