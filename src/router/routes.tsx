import React from 'react';
import { Info, ListBullets, Storefront, Tag, TreeStructure, UsersThree } from '@phosphor-icons/react';
import EntityNavigationButton from 'layout/Sidebar/EntityNavigationButton';
import { Route } from 'models/Routes';

const ConfigurationPage = React.lazy(() => import('pages/ConfigurationPage'));
const EntityPage = React.lazy(() => import('pages/EntityPage'));
const InventoryPage = React.lazy(() => import('pages/InventoryPage'));
const OpenRoamingPage = React.lazy(() => import('pages/OpenRoamingPage'));
const ProvLogsPage = React.lazy(() => import('pages/Notifications/GeneralLogs'));
const VenueNotificationsPage = React.lazy(() => import('pages/Notifications/Notifications'));
const FmsLogsPage = React.lazy(() => import('pages/Notifications/FmsLogs'));
const SecLogsPage = React.lazy(() => import('pages/Notifications/SecLogs'));
const MapPage = React.lazy(() => import('pages/MapPage'));
const ProfilePage = React.lazy(() => import('pages/Profile'));
const OperatorPage = React.lazy(() => import('pages/OperatorPage'));
const OperatorsPage = React.lazy(() => import('pages/OperatorsPage'));
const SubscriberPage = React.lazy(() => import('pages/SubscriberPage'));
const EndpointsPage = React.lazy(() => import('pages/EndpointsPage'));
const MonitoringPage = React.lazy(() => import('pages/MonitoringPage'));
const SystemConfigurationPage = React.lazy(() => import('pages/SystemConfigurationPage'));
const UsersPage = React.lazy(() => import('pages/UsersPage'));
const PoliciesPage = React.lazy(() => import('pages/PoliciesPage'));
const VenuePage = React.lazy(() => import('pages/VenuePage'));

const routes: Route[] = [
  {
    id: 'entity-page',
    path: '/entity/:id',
    name: 'entities.title',
    navName: '',
    icon: () => <TreeStructure size={28} weight="bold" />,
    navButton: (_, toggleSidebar: () => void, route: Route) => (
      <EntityNavigationButton toggleSidebar={toggleSidebar} route={route} />
    ),
    isEntity: true,
    component: EntityPage,
  },
  {
    id: 'venue-page',
    hidden: true,
    path: '/venue/:id',
    name: 'venues.title',
    navName: '',
    icon: () => <TreeStructure size={28} weight="bold" />,
    isEntity: true,
    component: VenuePage,
  },
  {
    id: 'inventory-page',
    path: '/',
    name: 'inventory.title',
    icon: () => <Tag size={28} weight="bold" />,
    component: InventoryPage,
  },
  {
    id: 'operators-page',
    path: '/operators',
    name: 'operator.other',
    icon: () => <Storefront size={28} weight="bold" />,
    component: OperatorsPage,
  },
  {
    id: 'logs-group',
    name: 'controller.devices.logs',
    icon: () => <ListBullets size={28} weight="bold" />,
    children: [
      {
        id: 'logs-devices',
        path: '/logs/notifications',
        name: 'venues.title',
        navName: (t) => `${t('venues.one')} ${t('notification.other')}`,
        component: VenueNotificationsPage,
      },
      {
        id: 'logs-prov',
        path: '/logs/provisioning',
        name: 'controller.provisioning.title',
        navName: (t) => `${t('controller.provisioning.title')} ${t('controller.devices.logs')}`,
        component: ProvLogsPage,
      },
      {
        id: 'logs-security',
        path: '/logs/security',
        name: 'logs.security',
        navName: (t) => `${t('logs.security')} ${t('controller.devices.logs')}`,
        component: SecLogsPage,
      },
      {
        id: 'logs-firmware',
        path: '/logs/firmware',
        name: 'logs.firmware',
        navName: (t) => `${t('logs.firmware')} ${t('controller.devices.logs')}`,
        component: FmsLogsPage,
      },
    ],
  },
  {
    id: 'users-group',
    name: 'users.group_title',
    icon: () => <UsersThree size={28} weight="bold" />,
    children: [
      {
        id: 'users-list-sub',
        path: '/users',
        name: 'users.title',
        component: UsersPage,
      },
      {
        id: 'management-policies',
        path: '/policies',
        name: 'policies.title',
        component: PoliciesPage,
      },
    ],
  },
  {
    id: 'system-group',
    name: 'system.title',
    icon: () => <Info size={28} weight="bold" />,
    children: [
      {
        id: 'system-configuration',
        path: '/systemConfiguration',
        name: 'system.configuration',
        component: SystemConfigurationPage,
      },
      {
        id: 'system-globalroaming',
        path: '/openRoaming',
        name: 'RAW-OpenRoaming',
        label: 'OpenRoaming',
        component: OpenRoamingPage,
      },
      {
        id: 'system-monitoring',
        path: '/systemMonitoring',
        name: 'analytics.monitoring',
        component: MonitoringPage,
      },
      {
        id: 'system-services',
        path: '/services',
        name: 'system.services',
        component: EndpointsPage,
      },
    ],
  },
  {
    id: 'account-page',
    hidden: true,
    path: '/account',
    name: 'account.title',
    icon: () => <UsersThree size={28} weight="bold" />,
    component: ProfilePage,
  },
  {
    id: 'configuration-page',
    hidden: true,
    path: '/configuration/:id',
    name: 'configurations.one',
    icon: () => <UsersThree size={28} weight="bold" />,
    component: ConfigurationPage,
  },
  {
    id: 'operator-page',
    hidden: true,
    path: '/operators/:id',
    name: 'operator.one',
    icon: () => <UsersThree size={28} weight="bold" />,
    component: OperatorPage,
  },
  {
    id: 'subscriber-page',
    hidden: true,
    path: '/subscriber/:id',
    name: 'subscribers.one',
    icon: () => <UsersThree size={28} weight="bold" />,
    component: SubscriberPage,
  },
  {
    id: 'map-page',
    hidden: true,
    path: '/map',
    name: 'common.map',
    icon: () => <UsersThree size={28} weight="bold" />,
    component: MapPage,
  },
];

export default routes;
