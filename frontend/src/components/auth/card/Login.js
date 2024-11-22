import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../LoginForm';

import AuthCardLayout from '../../../layouts/AuthCardLayout';

const Login = () => {
  return (
    <AuthCardLayout
      leftSideContent={
        <Fragment>
          <p>
            Don't have an account?
            <br />
            {/* <Link className="text-white text-underline" to="/authentication/card/register"> */}
            <Link className="text-white text-underline" to="/auth/register">
              Get started!
            </Link>
          </p>
        </Fragment>
      }
    >
      <h3>Account Login</h3>
      <LoginForm layout="card" hasLabel />
    </AuthCardLayout>
  );
};

export default Login;