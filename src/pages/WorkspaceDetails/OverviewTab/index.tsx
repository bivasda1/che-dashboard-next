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
import { Form, PageSection, PageSectionVariants } from '@patternfly/react-core';
import StorageTypeFormGroup from './StorageType';
import { StorageType } from '../../../services/types';
import { WorkspaceNameFormGroup } from './WorkspaceName';
import InfrastructureNamespaceFormGroup from './InfrastructureNamespace';

type Props = {
  onSave: (workspace: che.Workspace) => Promise<void>;
  workspace: che.Workspace;
};

export type State = {
  storageType: StorageType;
  devfile: che.WorkspaceDevfile;
  namespace: string;
  workspaceName: string;
};

export class OverviewTab extends React.Component<Props, State> {
  private isWorkspaceNameChanged = false;
  private workspaceNameCallbacks: { cancelChanges?: () => void } = {};

  constructor(props: Props) {
    super(props);

    if (this.props.workspace) {
      const devfile = Object.assign({}, this.props.workspace.devfile);
      const storageType = this.getStorageType(devfile as che.WorkspaceDevfile);
      const workspaceName = devfile.metadata.name ? devfile.metadata.name : '';
      const namespace = this.props.workspace.namespace ? this.props.workspace.namespace : '';

      this.state = { devfile, storageType, workspaceName, namespace };
    }

  }

  public get hasChanges() {
    return this.isWorkspaceNameChanged;
  }

  public cancelChanges(): void {
    if (this.workspaceNameCallbacks.cancelChanges) {
      this.workspaceNameCallbacks.cancelChanges();
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
    const devfile = this.props.workspace.devfile;
    const storageType = this.getStorageType(devfile);
    const workspaceName = devfile.metadata.name ? devfile.metadata.name : '';
    const namespace = this.state.namespace;

    return (
      <React.Fragment>
        <PageSection
          variant={PageSectionVariants.light}
        >
          <Form isHorizontal>
            <WorkspaceNameFormGroup
              name={workspaceName}
              onSave={_workspaceName => this.handleWorkspaceNameSave(_workspaceName)}
              onChange={_workspaceName => {
                this.isWorkspaceNameChanged = workspaceName !== _workspaceName;
              }}
              callbacks={this.workspaceNameCallbacks}
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

    const newWorkspaceObj = Object.assign({}, workspace);
    newWorkspaceObj.devfile = newDevfile;

    await this.props.onSave(newWorkspaceObj);
  }

}

export default OverviewTab;
