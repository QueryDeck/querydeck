import React, { Fragment, useEffect, useContext } from 'react';
import AppContext from '../../context/Context';
import { useHistory } from 'react-router-dom';

const Dashboard = () => {
  const { setNavbarDisplay } = useContext(AppContext)
  // State

  const history = useHistory()

  useEffect(() => {
    setNavbarDisplay(false)
    history.replace('/apps')
    // eslint-disable-next-line
  }, []);

  return (
    <Fragment>
      Dashboard
    </Fragment>
  );
};

export default Dashboard;
