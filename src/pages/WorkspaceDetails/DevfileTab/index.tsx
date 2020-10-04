/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import React from 'react';
import {
  Button,
  TextContent,
  Alert,
  AlertActionCloseButton,
  AlertVariant,
} from '@patternfly/react-core';
import DevfileEditor, { DevfileEditor as Editor } from '../../../components/DevfileEditor';
import { connect, ConnectedProps } from 'react-redux';
import { AppState } from '../../../store';
import { selectWorkspaceById } from '../../../store/Workspaces/selectors';
import EditorTools from './EditorTools';

import './DevfileTab.styl';

type Props =
  // selectors
  {
    workspace: che.Workspace | null | undefined,
  } & {
    onSave: (workspace: che.Workspace) => Promise<void>,
  } & MappedProps;

type State = {
  devfile?: che.WorkspaceDevfile,
  hasChanges?: boolean;
  hasRequestErrors?: boolean;
  currentRequestError?: string;
  isDevfileValid?: boolean;
  isExpanded?: boolean;
  copied?: boolean;
};

export class EditorTab extends React.PureComponent<Props, State> {
  private originDevfile: che.WorkspaceDevfile | undefined;
  private readonly devfileEditorRef: React.RefObject<Editor>;

  cancelChanges: () => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      devfile: Object.assign({}, this.props.workspace?.devfile),
      hasChanges: false,
      isDevfileValid: true,
      hasRequestErrors: false,
      currentRequestError: '',
      isExpanded: false,
    };

    this.cancelChanges = (): void => {
      this.updateEditor(this.props.workspace?.devfile);
      this.setState({
        hasChanges: false,
        hasRequestErrors: false,
        currentRequestError: '',
      });
    };

    this.devfileEditorRef = React.createRef<Editor>();
  }

  private init(): void {
    const devfile = Object.assign({}, this.props.workspace?.devfile as che.WorkspaceDevfile);
    if (devfile && (!this.originDevfile || !this.isEqualObject(devfile, this.originDevfile))) {
      this.originDevfile = devfile;
      this.updateEditor(devfile);
      this.setState({
        hasRequestErrors: false,
        currentRequestError: '',
        hasChanges: false,
      });
    }
  }

  componentDidMount(): void {
    this.init();
  }

  componentDidUpdate(): void {
    this.init();
  }

  public render(): React.ReactElement {
    const originDevfile = this.props.workspace?.devfile as che.WorkspaceDevfile;
    const { devfile } = this.state;

    return (
      <React.Fragment>
        {(this.state.currentRequestError) && (
          <React.Fragment>
            <br />
            <Alert variant={AlertVariant.danger} isInline title={this.state.currentRequestError}
              actionClose={(
                <AlertActionCloseButton onClose={() => this.setState({ currentRequestError: '' })} />)
              } />
          </React.Fragment>
        )}
        <TextContent
          className={`workspace-details${this.state.isExpanded ? '-expanded' : ''}`}>
          <EditorTools devfile={devfile as che.WorkspaceDevfile} handleExpand={(isExpanded) => {
            this.setState({ isExpanded: isExpanded });
          }} />
          <DevfileEditor
            ref={this.devfileEditorRef}
            devfile={originDevfile}
            decorationPattern='location[ \t]*(.*)[ \t]*$'
            onChange={(devfile, isValid) => {
              this.onDevfileChange(devfile, isValid);
            }}
          />
          <Button onClick={() => this.cancelChanges()} variant='secondary' className='cancle-button'
            isDisabled={!this.state.hasChanges && this.state.isDevfileValid && !this.state.hasRequestErrors}>
            Cancel
          </Button>
          <Button onClick={async () => await this.onSave()} variant='primary' className='save-button'
            isDisabled={!this.state.hasChanges || !this.state.isDevfileValid || this.state.hasRequestErrors}>
            Save
          </Button>
        </TextContent>
      </React.Fragment>
    );
  }

  private updateEditor(devfile: che.WorkspaceDevfile | undefined): void {
    if (!devfile) {
      return;
    }
    this.devfileEditorRef.current?.updateContent(devfile);
    this.setState({ isDevfileValid: true });
  }

  private onDevfileChange(devfile: che.WorkspaceDevfile, isValid: boolean): void {
    this.setState({ isDevfileValid: isValid });
    if (!isValid) {
      this.setState({ hasChanges: false });
      return;
    }
    if (this.isEqualObject(this.props.workspace?.devfile as che.WorkspaceDevfile, devfile)) {
      this.setState({ hasChanges: false });
      return;
    }
    this.setState({ devfile });
    this.setState({
      hasChanges: true,
      hasRequestErrors: false,
    });
  }

  private async onSave(): Promise<void> {
    const devfile = this.state.devfile;
    if (!devfile) {
      return;
    }
    const newWorkspaceObj = Object.assign({}, this.props.workspace as che.Workspace);
    newWorkspaceObj.devfile = devfile;
    this.setState({
      hasChanges: false,
      hasRequestErrors: false,
      currentRequestError: '',
    });
    try {
      await this.props.onSave(newWorkspaceObj);
    } catch (e) {
      const errorMessage = e.toString().replace(/^Error: /gi, '');
      this.setState({
        hasChanges: true,
        hasRequestErrors: true,
        currentRequestError: errorMessage,
      });
    }
  }

  private sortObject(obj: che.WorkspaceDevfile): che.WorkspaceDevfile {
    return Object.keys(obj).sort().reduce((result: che.WorkspaceDevfile, key: string) => {
      result[key] = obj[key];
      return result;
    }, {} as che.WorkspaceDevfile);
  }

  private isEqualObject(a: che.WorkspaceDevfile | undefined, b: che.WorkspaceDevfile | undefined): boolean {
    if (!a) {
      return !b;
    }
    return JSON.stringify(this.sortObject(a)) == JSON.stringify(this.sortObject(b as che.WorkspaceDevfile));
  }
}

const mapStateToProps = (state: AppState) => ({
  workspace: selectWorkspaceById(state),
});

const connector = connect(
  mapStateToProps,
  null,
  null,
  { forwardRef: true },
);

type MappedProps = ConnectedProps<typeof connector>
export default connector(EditorTab);
