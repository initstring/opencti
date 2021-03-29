import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { createPaginationContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import {
  map, keys, groupBy, assoc, compose,
} from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Typography from '@material-ui/core/Typography';
import { ExpandMore } from '@material-ui/icons';
import { Link } from 'react-router-dom';
import { truncate } from '../../../../utils/String';
import { resolveLink } from '../../../../utils/Entity';
import ItemIcon from '../../../../components/ItemIcon';
import inject18n from '../../../../components/i18n';
import StixCoreObjectLabels from '../stix_core_objects/StixCoreObjectLabels';

const styles = (theme) => ({
  container: {
    padding: '0 0 20px 0',
  },
  expansionPanel: {
    backgroundColor: theme.palette.background.paper,
  },
  itemIcon: {
    color: theme.palette.primary.main,
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: '33.33%',
    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
  expansionPanelContent: {
    padding: 0,
  },
  list: {
    width: '100%',
  },
  icon: {
    color: theme.palette.primary.main,
  },
  noResult: {
    top: 180,
    left: 50,
    right: 0,
    textAlign: 'center',
    position: 'absolute',
    color: '#ffffff',
    fontSize: 15,
    zIndex: -5,
    backgroundColor: theme.palette.background.default,
  },
});

class StixDomainObjectsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = { expandedPanels: {} };
  }

  handleChangePanel(panelKey, event, expanded) {
    this.setState({
      expandedPanels: assoc(panelKey, expanded, this.state.expandedPanels),
    });
  }

  isExpanded(type, numberOfEntities, numberOfTypes) {
    if (this.state.expandedPanels[type] !== undefined) {
      return this.state.expandedPanels[type];
    }
    if (numberOfEntities === 1) {
      return true;
    }
    return numberOfTypes === 1;
  }

  render() {
    const {
      t, classes, data, fd,
    } = this.props;
    const stixDomainObjectsNodes = map(
      (n) => n.node,
      data.stixDomainObjects.edges,
    );
    const byType = groupBy((stixDomainObject) => stixDomainObject.entity_type);
    const stixDomainObjects = byType(stixDomainObjectsNodes);
    const stixDomainObjectsTypes = keys(stixDomainObjects);
    if (stixDomainObjectsTypes.length !== 0) {
      return (
        <div className={classes.container}>
          {stixDomainObjectsTypes.map((type) => (
            <Accordion
              key={type}
              expanded={this.isExpanded(
                type,
                stixDomainObjects[type].length,
                stixDomainObjectsTypes.length,
              )}
              onChange={this.handleChangePanel.bind(this, type)}
              classes={{ root: classes.expansionPanel }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                className={classes.summary}
              >
                <Typography className={classes.heading}>
                  {t(`entity_${type}`)}
                </Typography>
                <Typography classes={{ root: classes.secondaryHeading }}>
                  {stixDomainObjects[type].length}{' '}
                  {stixDomainObjects[type].length < 2
                    ? t('entity')
                    : t('entities')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                classes={{ root: classes.expansionPanelContent }}
              >
                <List classes={{ root: classes.list }}>
                  {stixDomainObjects[type].map((stixDomainObject) => {
                    const link = resolveLink(stixDomainObject.entity_type);
                    if (link) {
                      return (
                        <ListItem
                          key={stixDomainObject.id}
                          divider={true}
                          button={true}
                          component={Link}
                          to={`${link}/${stixDomainObject.id}`}
                        >
                          <ListItemIcon classes={{ root: classes.itemIcon }}>
                            <ItemIcon type={type} />
                          </ListItemIcon>
                          <ListItemText
                            primary={truncate(
                              stixDomainObject.x_mitre_id
                                ? `[${stixDomainObject.x_mitre_id}] ${stixDomainObject.name}`
                                : stixDomainObject.name
                                    || stixDomainObject.attribute_abstract
                                    || stixDomainObject.content
                                    || stixDomainObject.opinion
                                    || `${fd(
                                      stixDomainObject.first_observed,
                                    )} - ${fd(stixDomainObject.last_observed)}`,
                              100,
                            )}
                            secondary={truncate(
                              stixDomainObject.description,
                              150,
                            )}
                          />
                          <ListItemSecondaryAction>
                            <StixCoreObjectLabels
                              labels={stixDomainObject.objectLabel}
                              variant="inSearch"
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    }
                    return (
                      <ListItem
                        key={stixDomainObject.id}
                        divider={true}
                        button={false}
                      >
                        <ListItemIcon classes={{ root: classes.itemIcon }}>
                          <ItemIcon type={type} />
                        </ListItemIcon>
                        <ListItemText
                          primary={truncate(stixDomainObject.name, 100)}
                          secondary={truncate(
                            stixDomainObject.description,
                            150,
                          )}
                        />
                        <ListItemSecondaryAction>
                          <StixCoreObjectLabels
                            labels={stixDomainObject.objectLabel}
                            variant="inSearch"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      );
    }
    return (
      <div className={classes.noResult}>
        {t('No entities were found for this search.')}
      </div>
    );
  }
}

StixDomainObjectsContainer.propTypes = {
  reportId: PropTypes.string,
  reportObjectRefs: PropTypes.array,
  data: PropTypes.object,
  limit: PropTypes.number,
  classes: PropTypes.object,
  t: PropTypes.func,
  fld: PropTypes.func,
  fd: PropTypes.func,
};

export const stixDomainObjectsLinesSubTypesQuery = graphql`
  query StixDomainObjectsLinesSubTypesQuery(
    $type: String!
    $includeParents: Boolean
  ) {
    subTypes(type: $type, includeParents: $includeParents) {
      edges {
        node {
          id
          label
        }
      }
    }
  }
`;

export const stixDomainObjectsLinesQuery = graphql`
  query StixDomainObjectsLinesQuery(
    $search: String
    $count: Int!
    $cursor: ID
    $orderBy: StixDomainObjectsOrdering
    $orderMode: OrderingMode
    $filters: [StixDomainObjectsFiltering]
  ) {
    ...StixDomainObjectsLines_data
      @arguments(
        search: $search
        count: $count
        cursor: $cursor
        orderBy: $orderBy
        orderMode: $orderMode
        filters: $filters
      )
  }
`;

export const stixDomainObjectsLinesSearchQuery = graphql`
  query StixDomainObjectsLinesSearchQuery(
    $search: String
    $types: [String]
    $count: Int
    $filters: [StixDomainObjectsFiltering]
  ) {
    stixDomainObjects(
      search: $search
      types: $types
      first: $count
      filters: $filters
    ) {
      edges {
        node {
          id
          entity_type
          ... on AttackPattern {
            name
            description
            x_mitre_id
          }
          ... on Note {
            attribute_abstract
            content
          }
          ... on ObservedData {
            first_observed
            last_observed
          }
          ... on Opinion {
            opinion
          }
          ... on Report {
            name
          }
          ... on Campaign {
            name
            description
          }
          ... on CourseOfAction {
            name
            description
          }
          ... on Individual {
            name
            description
          }
          ... on Organization {
            name
            description
          }
          ... on Sector {
            name
            description
          }
          ... on Indicator {
            name
            description
          }
          ... on Infrastructure {
            name
            description
          }
          ... on IntrusionSet {
            name
            description
          }
          ... on Position {
            name
            description
          }
          ... on City {
            name
            description
          }
          ... on Country {
            name
            description
          }
          ... on Region {
            name
            description
          }
          ... on Malware {
            name
            description
          }
          ... on ThreatActor {
            name
            description
          }
          ... on Tool {
            name
            description
          }
          ... on Vulnerability {
            name
            description
          }
          ... on XOpenCTIIncident {
            name
            description
          }
          createdBy {
            ... on Identity {
              id
              name
              entity_type
            }
          }
          objectMarking {
            edges {
              node {
                definition
              }
            }
          }
        }
      }
    }
  }
`;

const StixDomainObjectsLines = createPaginationContainer(
  StixDomainObjectsContainer,
  {
    data: graphql`
      fragment StixDomainObjectsLines_data on Query
      @argumentDefinitions(
        search: { type: "String" }
        count: { type: "Int", defaultValue: 25 }
        cursor: { type: "ID" }
        orderBy: { type: "StixDomainObjectsOrdering", defaultValue: name }
        orderMode: { type: "OrderingMode", defaultValue: asc }
        filters: { type: "[StixDomainObjectsFiltering]" }
      ) {
        stixDomainObjects(
          search: $search
          first: $count
          after: $cursor
          orderBy: $orderBy
          orderMode: $orderMode
          filters: $filters
        ) @connection(key: "Pagination_stixDomainObjects") {
          edges {
            node {
              id
              entity_type
              id
              entity_type
              ... on AttackPattern {
                name
                description
                x_mitre_id
              }
              ... on Campaign {
                name
                description
              }
              ... on Note {
                attribute_abstract
                content
              }
              ... on ObservedData {
                first_observed
                last_observed
              }
              ... on Opinion {
                opinion
              }
              ... on Report {
                name
              }
              ... on CourseOfAction {
                name
                description
              }
              ... on Individual {
                name
                description
              }
              ... on Organization {
                name
                description
              }
              ... on Sector {
                name
                description
              }
              ... on Indicator {
                name
                description
              }
              ... on Infrastructure {
                name
                description
              }
              ... on IntrusionSet {
                name
                description
              }
              ... on Position {
                name
                description
              }
              ... on City {
                name
                description
              }
              ... on Country {
                name
                description
              }
              ... on Region {
                name
                description
              }
              ... on Malware {
                name
                description
              }
              ... on ThreatActor {
                name
                description
              }
              ... on Tool {
                name
                description
              }
              ... on Vulnerability {
                name
                description
              }
              ... on XOpenCTIIncident {
                name
                description
              }
              objectLabel {
                edges {
                  node {
                    id
                    value
                    color
                  }
                }
              }
            }
          }
        }
      }
    `,
  },
  {
    direction: 'forward',
    getConnectionFromProps(props) {
      return props.data && props.data.stixDomainObjects;
    },
    getFragmentVariables(prevVars, totalCount) {
      return {
        ...prevVars,
        count: totalCount,
      };
    },
    getVariables(props, { count, cursor }, fragmentVariables) {
      return {
        count,
        cursor,
        orderBy: fragmentVariables.orderBy,
        orderMode: fragmentVariables.orderMode,
      };
    },
    query: stixDomainObjectsLinesQuery,
  },
);

export default compose(inject18n, withStyles(styles))(StixDomainObjectsLines);
