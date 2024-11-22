import React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

// interface/apps
import AppsList from '../components/interface/apps/AppsList'
import CreateApp from '../components/interface/apps/CreateApp'

// Security
import Security from '../components/interface/security/Security'

// Deploy
import Deploy from '../components/interface/deploy/Deploy'

// interface/databases
import DatabasesList from '../components/interface/databases/DatabasesList'
import Database from '../components/interface/databases/Database'
import CreateDatabase from '../components/interface/databases/CreateDatabase'

// Redux testing
import { APInew } from '../app/projects/[subdomain]/api/engine/new'
import { APIsaved } from '../app/projects/[subdomain]/api/engine/saved'
import { APIlist } from '../app/projects/[subdomain]/api/list/list'

const ReduxRoutes = ({ match: { url } }) => (
  <Switch>
    {/* API */}
    {/* <Route
      exact
      path={`/projects/:subdomain/api/new`}
      render={
        (props) => <APInew
          subdomain={props.match.params.subdomain}
        />
      }
    />
    <Route
      exact
      path={`/projects/:subdomain/api/:query_id`}
      render={
        (props) => <APIsaved
          query_id={props.match.params.query_id}
          subdomain={props.match.params.subdomain}
        />
      }
    /> */}
  </Switch>
)

const AppRoutes = ({ match: { url } }) => (
  <Switch>
    {/* Apps */}
    <Route
      exact
      path={`/apps`}
      render={
        () => <AppsList />
      }
    />
    <Route
      exact
      path={`/apps/new`}
      render={
        () => <CreateApp />
      }
    />


    {/* Security */}
    <Route
      exact
      path={`/apps/:appid/security`}
      render={
        props => <Security
          appid={props.match.params.appid}
        />
      }
    />
    <Route
      exact
      path={`/apps/:appid/security/:section`}
      render={
        props => <Security
          appid={props.match.params.appid}
          section={props.match.params.section}
        />
      }
    />
    <Route
      exact
      path={`/apps/:appid/security/:section/:roleId`}
      render={
        props => <Security
          appid={props.match.params.appid}
          section={props.match.params.section}
          roleId={props.match.params.roleId}
        />
      }
    />
    {/* Deploy */}
    <Route
      exact
      path={`/apps/:appid/deploy`}
      render={
        props => <Deploy
          appid={props.match.params.appid}
        />
      }
    />

        {/* Deploy */}
  <Route
      exact
      path={`/github/auth-callback`}
      render={
        props => <Deploy
          appid={props.match.params.appid}
          redirect={true}
        />
      }
    />



    {/* Databases */}
    <Route
      exact
      path={`/apps/:appid/data-sources`}
      render={
        props => <DatabasesList
          appid={props.match.params.appid}
        />
      }
    />
    <Route
      exact
      path={`/apps/:appid/data-sources/new`}
      render={
        props => <CreateDatabase
          appid={props.match.params.appid}
        />
      }
    />
    <Route
      exact
      path={`/apps/:appid/data-sources/:db_id`}
      render={
        props => <Database
          appid={props.match.params.appid}
          db_id={props.match.params.db_id}
        />
      }
    />

    {/* API */}
    <Route
      exact
      path={`/apps/:subdomain/api`}
      render={
        props => <APIlist
          subdomain={props.match.params.subdomain}
        />
      }
    />
    <Route
      exact
      path={`/apps/:subdomain/api/new`}
      render={
        (props) => <APInew
          subdomain={props.match.params.subdomain}
        />
      }
    />
    <Route
      exact
      path={`/apps/:subdomain/api/:query_id`}
      render={
        (props) => <APIsaved
          query_id={props.match.params.query_id}
          subdomain={props.match.params.subdomain}
        />
      }
    />
    {/* <Route
      exact
      path={`/apps/:appid/api/new`}
      render={
        props => <Query
          appid={props.match.params.appid}
          mode='api'
        />
      }
    />
    <Route
      exact
      path={`/apps/:appid/api/:query_id`}
      render={
        props => <Query
          appid={props.match.params.appid}
          query_id={props.match.params.query_id}
          mode='api'
      />
      }
    /> */}
    
    {/* Logs */}
    {/* <Route
      exact
      path={`/apps/:appid/logs`}
      render={
        props => <Logs
          appid={props.match.params.appid}
        />
      }
    /> */}


    
    {/*Redirect*/}
    <Redirect to="/errors/404" />
  </Switch>
)

const DashboardRoutes = () => (
  <Switch>
    {/* Redux */}
    <Route
      component={ReduxRoutes}
      path="/projects"
    />

    {/*Apps*/}
    <Route
      component={AppRoutes}
      path="/apps"
    />
    {/*Github Redirect Url*/}
    <Route
      component={AppRoutes}
      path="/github"
    />
    {/*Redirect*/}
    <Redirect to="/errors/404" />
  </Switch>
)

export default DashboardRoutes
