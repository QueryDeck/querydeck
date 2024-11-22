import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';
import Dashboard from '../components/dashboard/Dashboard';
import Navbar from '../components/interface/navbar/Navbar'
import loadable from '@loadable/component';

const DashboardRoutes = loadable(() => import('./DashboardRoutes'));

const DashboardLayout = ({ location }) => {
  useEffect(() => {
    DashboardRoutes.preload();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if(window.location.pathname.split('/')[1] === 'share') {
    return(
      <DashboardRoutes />
    )
  } else {
    return (
      <div className='fullWidthContainer'>
        <div className="content">
          <Navbar /> 
          <Switch>
            <Route path="/" exact component={Dashboard} />
            <DashboardRoutes />
          </Switch>
        </div>
      </div>
    );
  }
};

DashboardLayout.propTypes = { location: PropTypes.object.isRequired };

export default DashboardLayout;
