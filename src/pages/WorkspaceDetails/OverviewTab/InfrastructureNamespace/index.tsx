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
import { FormGroup, Text, TextContent } from '@patternfly/react-core';
import { AppState } from '../../../../store';

import styles from './index.module.css';

export class InfrastructureNamespaceFormGroup extends React.PureComponent<MappedProps> {

  public render(): React.ReactElement {
    const { infrastructureNamespace: { namespaces } } = this.props;

    return (
      <FormGroup label="Kubernetes Namespace" fieldId="infrastructure-namespace" className={styles.kubernetesNamespace}>
        <TextContent>
          <Text className={styles.namespaceName}>
            {namespaces[0].attributes.displayName || namespaces[0].name}
          </Text>
        </TextContent>
      </FormGroup>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  infrastructureNamespace: state.infrastructureNamespace,
});

const connector = connect(
  mapStateToProps,
);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(InfrastructureNamespaceFormGroup);
