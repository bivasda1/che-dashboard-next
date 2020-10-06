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
import { connect, ConnectedProps } from 'react-redux';
import { Form, PageSection, PageSectionVariants } from '@patternfly/react-core';
import { AppState } from '../../../store';
import StorageTypeFormGroup, { StorageType } from './StorageType';
import { WorkspaceNameFormGroup } from './WorkspaceName';
import InfrastructureNamespaceFormGroup from './InfrastructureNamespace';
import { selectWorkspaceById } from '../../../store/Workspaces/selectors';

type Props = {
  onSave: (workspace: che.Workspace) => Promise<void>
} & MappedProps;

export type State = {
  storageType?: StorageType;
  devfile?: che.WorkspaceDevfile;
  namespace?: string;
  workspaceName?: string;
};

export class OverviewTab extends React.Component<Props, State> {
  private readonly workspaceNameRef: React.RefObject<WorkspaceNameFormGroup>;

  constructor(props: Props) {
    super(props);

    if (this.props.workspace) {
      const devfile = Object.assign({}, this.props.workspace?.devfile);
      const storageType = this.getStorageType(devfile as che.WorkspaceDevfile);
      const workspaceName = devfile.metadata.name ? devfile.metadata.name : '';
      const namespace = this.props.workspace?.namespace;

      this.state = { devfile, storageType, workspaceName, namespace };
    }

    this.workspaceNameRef = React.createRef<WorkspaceNameFormGroup>();
  }

  public get hasChanges() {
    return this.workspaceNameRef.current && this.workspaceNameRef.current?.state.hasChanges;
  }

  public cancelChanges(): void {
    if (this.workspaceNameRef.current && this.workspaceNameRef.current?.cancelChanges) {
      this.workspaceNameRef.current?.cancelChanges();
    }
  }

  private async handleWorkspaceNameSave(workspaceName: string): Promise<void> {
    const devfile = this.state.devfile;
    if (!devfile) {
      return;
    }
    devfile.metadata.name = workspaceName;
    this.setState({ devfile, workspaceName });
    await this.onSave();
  }

  private handleStorageSave(storageType: StorageType): void {
    const devfile = this.state.devfile;
    if (!devfile) {
      return;
    }
    switch (storageType) {
      case StorageType.persistent:
        if (devfile.attributes) {
          delete devfile.attributes.persistVolumes;
          delete devfile.attributes.asyncPersist;
          if (Object.keys(devfile.attributes).length === 0) {
            delete devfile.attributes;
          }
        }
        break;
      case StorageType.ephemeral:
        if (!devfile.attributes) {
          devfile.attributes = {};
        }
        devfile.attributes.persistVolumes = 'false';
        delete devfile.attributes.asyncPersist;
        break;
      case StorageType.async:
        if (!devfile.attributes) {
          devfile.attributes = {};
        }
        devfile.attributes.persistVolumes = 'false';
        devfile.attributes.asyncPersist = 'true';
        break;
    }

    this.setState({ storageType, devfile });
    this.onSave();
  }

  private getStorageType(devfile: che.WorkspaceDevfile): StorageType {
    let storageType: StorageType;
    // storage type
    if (devfile.attributes && devfile.attributes.persistVolumes === 'false') {
      const isAsync = devfile.attributes && devfile.attributes.asyncPersist === 'true';
      if (isAsync) {
        storageType = StorageType.async;
      } else {
        storageType = StorageType.ephemeral;
      }
    } else {
      storageType = StorageType.persistent;
    }
    return storageType;
  }

  public render(): React.ReactElement {
    const namespace = this.state.namespace as string;
    const devfile = this.props.workspace?.devfile as che.WorkspaceDevfile;
    const storageType = this.getStorageType(devfile);
    const workspaceName = devfile.metadata.name as string;

    return (
      <React.Fragment>
        <PageSection
          variant={PageSectionVariants.light}
        >
          <Form isHorizontal>
            <WorkspaceNameFormGroup
              name={workspaceName}
              onSave={_name => this.handleWorkspaceNameSave(_name)}
              ref={this.workspaceNameRef}
            />
            <InfrastructureNamespaceFormGroup namespace={namespace} />
            <StorageTypeFormGroup
              storageType={storageType}
              onChange={_storageType => this.handleStorageSave(_storageType)}
            />
          </Form>
        </PageSection>
      </React.Fragment>
    );
  }

  private async onSave(): Promise<void> {
    const workspace = this.props.workspace;
    const newDevfile = this.state.devfile as che.WorkspaceDevfile;

    const newWorkspaceObj = Object.assign({}, workspace) as che.Workspace;
    newWorkspaceObj.devfile = newDevfile;

    await this.props.onSave(newWorkspaceObj);
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
export default connector(OverviewTab);
