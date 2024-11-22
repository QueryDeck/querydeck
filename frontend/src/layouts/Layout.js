import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { CloseButton, Fade } from '../components/common/Toast';

import DashboardLayout from './DashboardLayout';
import ErrorLayout from './ErrorLayout';

// import { PrivateRoute } from '../PrivateRoute';
import loadable from '@loadable/component';
const AuthCardRoutes = loadable(() => import('../components/auth/card/AuthCardRoutes'));


const Layout = () => {
  useEffect(() => {
    AuthCardRoutes.preload();
  }, []);

  return (
    <Router fallback={<span />}>
      <Switch>
        {/* <Route path="/authentication/card" component={AuthCardRoutes} /> */}
        <Route path="/auth" component={AuthCardRoutes} />
        <Route path="/errors" component={ErrorLayout} />
        {/* <Route path="/" component={DashboardLayout} /> */}
        <Route path="/" component={DashboardLayout} />
      </Switch>
      <ToastContainer transition={Fade} closeButton={<CloseButton />} position={toast.POSITION.BOTTOM_LEFT} />
    </Router>
  );
};

export default Layout;
