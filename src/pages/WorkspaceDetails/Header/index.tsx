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
import { PageSection, Text, TextContent, Label } from '@patternfly/react-core';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import {
  BanIcon,
  InProgressIcon,
  ResourcesFullIcon,
  ErrorCircleOIcon,
  PauseCircleIcon,
} from '@patternfly/react-icons/dist/js/icons';
import { ROUTE } from '../../../route.enum';
import { WorkspaceStatus } from '../../../services/api/workspaceStatus';
import { SECTION_THEME } from '../index';

import './Header.styl';

type Props = {
  status: string | undefined;
  workspaceName: string;
};

class Header extends React.PureComponent<Props> {

  private get statusLabel(): React.ReactElement {
    const { status } = this.props;

    let color: 'blue' | 'cyan' | 'green' | 'orange' | 'purple' | 'red' | 'grey';

    switch (status) {
      case WorkspaceStatus[WorkspaceStatus.STOPPED]:
        color = 'grey';
        return (<Label color={color} icon={<BanIcon color={color} />}>{status}</Label>);
      case WorkspaceStatus[WorkspaceStatus.RUNNING]:
        color = 'green';
        return (<Label color={color} icon={<ResourcesFullIcon color={color} />}>{status}</Label>);
      case WorkspaceStatus[WorkspaceStatus.ERROR]:
        color = 'red';
        return (<Label color={color} icon={<ErrorCircleOIcon color={color} />}>{status}</Label>);
      case WorkspaceStatus[WorkspaceStatus.PAUSED]:
        color = 'orange';
        return (<Label color={color} icon={<PauseCircleIcon color={color} />}>{status}</Label>);
      default:
        color = 'blue';
        return (<Label color={color} icon={<InProgressIcon className="rotate" color={color} />}>{status}</Label>);
    }
  }

  public render(): React.ReactElement {
    const { workspaceName } = this.props;

    return (
      <PageSection variant={SECTION_THEME} className='workspace-details-header'>
        <Breadcrumb>
          <BreadcrumbItem to={`/#${ROUTE.WORKSPACES}`}>
            Workspaces
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{workspaceName}</BreadcrumbItem>
        </Breadcrumb>
        <TextContent>
          <Text component='h1'>
            {workspaceName}{this.statusLabel}
          </Text>
        </TextContent>
      </PageSection>
    );
  }
}

export default Header;
