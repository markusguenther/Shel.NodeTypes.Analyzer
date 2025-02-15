import React, { useState } from 'react';
import Modal from 'react-modal';
import { createUseStyles } from 'react-jss';

import { ToggablePanel, Button, IconButton } from '@neos-project/react-ui-components';

import { useGraph, useIntl } from '../../core';
import { useRecoilValue } from 'recoil';
import { nodeTypesState } from '../../state';

const useStyles = createUseStyles({
    usageTable: {
        '.neos &': {
            '& a': {
                color: 'var(--blue)',
            },
        },
    },
    modal: {
        position: 'absolute',
        top: 'calc(2 * var(--spacing-GoldenUnit))',
        left: 'var(--spacing-GoldenUnit)',
        right: 'var(--spacing-GoldenUnit)',
        bottom: 'var(--spacing-GoldenUnit)',
        color: 'white',
        outline: 'none',
        overflow: 'auto',
        backgroundColor: 'var(--grayDark)',
        '.neos &': {
            padding: 'var(--spacing-GoldenUnit)',
        },
    },
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, .85)',
        zIndex: 10300,
    },
    closeButton: {
        top: 'var(--spacing-Half)',
        right: 'var(--spacing-Half)',
        '.neos &': {
            position: 'absolute',
        },
    },
    usageHeader: {
        '.neos &': {
            fontSize: '1rem',
            marginBottom: 'var(--spacing-GoldenUnit)',
        },
    },
    usageCountByInheritance: {
        '.neos &': {
            marginTop: 'var(--spacing-Full)',
            '& table': {
                marginTop: 'var(--spacing-Half)',
                width: '100%',
                '& td': {
                    color: 'var(--textOnGray)',
                    padding: '4px 0',
                    borderBottom: '1px solid var(--grayLight)',
                },
                '& td:last-child': {
                    textAlign: 'right',
                },
                '& tr:last-child td': {
                    border: 'none',
                },
                '& span': {
                    textOverflow: 'ellipsis',
                    whitespace: 'nowrap',
                    display: 'block',
                    lineHeight: 1.2,
                    width: '230px',
                    overflow: 'hidden',
                },
            },
        },
    },
    usageActions: {
        display: 'flex',
        gap: 'var(--spacing-Half)',
    },
    details: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-Half)',
    },
});

const NodeSelection: React.FC = () => {
    const classes = useStyles();
    const { selectedNodeTypeName, getNodeTypeUsageLinks, endpoints } = useGraph();
    const nodeTypes = useRecoilValue(nodeTypesState);
    const { translate } = useIntl();
    const { usageCount, usageCountByInheritance, abstract, final } = nodeTypes[selectedNodeTypeName];
    const [nodeTypeUsageLinks, setNodeTypeUsageLinks] = useState<NodeTypeUsageLink[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showUsageLinks, setShowUsageLinks] = useState(false);
    const [showDetails, setShowDetails] = useState(true);

    const afterOpenModal = () => {
        setIsLoading(true);
        getNodeTypeUsageLinks(selectedNodeTypeName)
            .then((usageLinks) => usageLinks && setNodeTypeUsageLinks(usageLinks))
            .finally(() => setIsLoading(false));
    };

    const exportUsageLink = new URL(endpoints.exportNodeTypeUsage);
    exportUsageLink.searchParams.set('moduleArguments[nodeTypeName]', selectedNodeTypeName);

    return (
        <>
            <ToggablePanel onPanelToggle={() => setShowDetails(!showDetails)} isOpen={showDetails} style="condensed">
                <ToggablePanel.Header>{translate('inspector.usage.label', 'Details')}</ToggablePanel.Header>
                <ToggablePanel.Contents>
                    <div className={classes.details}>
                        {abstract && <p>{translate('inspector.usage.isAbstract', 'This is an abstract nodetype.')}</p>}
                        {final && <p>{translate('inspector.usage.isFinal', 'This is an final nodetype.')}</p>}
                        {usageCount > 0 && (
                            <>
                                <p>{translate('inspector.usage', `This nodetype is being used ${usageCount} times`)}</p>
                                <div className={classes.usageActions}>
                                    <Button onClick={() => setShowUsageLinks(true)} style="lighter" hoverStyle="brand">
                                        {translate('inspector.usage.show', 'Show usages')}
                                    </Button>
                                    <a href={exportUsageLink.toString()} download className="neos-button">
                                        {translate('inspector.usage.export', 'Export usages')}
                                    </a>
                                </div>
                            </>
                        )}
                        {usageCount == 0 && Object.keys(usageCountByInheritance).length == 0 && (
                            <p>{translate('inspector.usage.unused', 'Not directly used.')}</p>
                        )}
                    </div>
                    {Object.keys(usageCountByInheritance).length > 0 && (
                        <div className={classes.usageCountByInheritance}>
                            <p>
                                {translate(
                                    'inspector.usage.byInheritance',
                                    'This nodetype is being used by the following types via inheritance:'
                                )}
                            </p>
                            <table>
                                <tbody>
                                    {Object.keys(usageCountByInheritance)
                                        .sort()
                                        .map((subTypeName) => (
                                            <tr key={subTypeName}>
                                                <td>
                                                    <span title={subTypeName}>{subTypeName}</span>
                                                </td>
                                                <td>{usageCountByInheritance[subTypeName]}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ToggablePanel.Contents>
            </ToggablePanel>

            <Modal
                isOpen={showUsageLinks}
                onAfterOpen={afterOpenModal}
                onRequestClose={() => setShowUsageLinks(false)}
                contentLabel={selectedNodeTypeName + ' Usage'}
                className={classes.modal}
                overlayClassName={classes.overlay}
            >
                <h2 className={classes.usageHeader}>
                    {translate('inspector.usage.modal.header', 'Usage for')} {selectedNodeTypeName}
                </h2>
                <IconButton
                    className={classes.closeButton}
                    size="small"
                    style="transparent"
                    hoverStyle="brand"
                    icon="times-circle"
                    onClick={() => setShowUsageLinks(false)}
                    title={translate('inspector.usage.modal.close', 'Close')}
                >
                    {translate('inspector.usage.modal.close', 'Close')}
                </IconButton>

                {isLoading ? (
                    <p>{translate('inspector.usage.modal.loading', 'Loading usage links...')}</p>
                ) : (
                    <table className={'neos-table ' + classes.usageTable}>
                        <thead>
                            <tr>
                                <th>{translate('inspector.usage.modal.table.title', 'Title')}</th>
                                <th>{translate('inspector.usage.modal.table.page', 'Page')}</th>
                                <th>{translate('inspector.usage.modal.table.workspace', 'Workspace')}</th>
                                <th>{translate('inspector.usage.modal.table.dimensions', 'Dimensions')}</th>
                                <th>{translate('inspector.usage.modal.table.identifier', 'Node Identifier')}</th>
                                <th>{translate('inspector.usage.modal.table.hidden', 'Hidden')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nodeTypeUsageLinks
                                .sort((a, b) => a.documentTitle.localeCompare(b.documentTitle))
                                .map((link, index) => (
                                    <tr key={index}>
                                        <td>{link.title}</td>
                                        <td>
                                            {link.url ? (
                                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                                    {link.documentTitle}
                                                </a>
                                            ) : (
                                                link.documentTitle
                                            )}
                                        </td>
                                        <td>{link.workspace}</td>
                                        <td>
                                            {Object.keys(link.dimensions).map(
                                                (dimensionName) =>
                                                    dimensionName + ': ' + link.dimensions[dimensionName].join(', ')
                                            )}
                                        </td>
                                        <td>{link.nodeIdentifier}</td>
                                        <td>{link.hidden ? 'Yes' : 'No'}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                )}
            </Modal>
        </>
    );
};

export default React.memo(NodeSelection);
