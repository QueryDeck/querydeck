import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet'
import PropTypes from 'prop-types';
// import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button, Form, FormGroup, Input } from 'reactstrap';
import withRedirect from '../../hoc/withRedirect';
import api from '../../api'

// Abort controllers for cancelling network requests
let forgotPasswordController

const ForgetPasswordForm = ({ setRedirect, setRedirectUrl, layout }) => {
  // State
  const [email, setEmail] = useState('');

  useEffect(() => {
    forgotPasswordController = new AbortController()

    return () => {
      forgotPasswordController.abort()
    }
    // eslint-disable-next-line
  }, [])

  const forgotPassword = () => {
    api.post('/account/forgot-pass', {
        email,
        signal: forgotPasswordController
    }).then(res => {
        console.log('res', res.data)
        toast.success(`An email is sent to ${email} with password reset link`)
    }).catch(err => {
        console.error(err)
    })
}

  // Handler
  const handleSubmit = e => {
    e.preventDefault();
    if (email) {
      forgotPassword()
      // toast.success(`An email is sent to ${email} with password reset link`);
      setRedirect(true);
    }
  };

  useEffect(() => {
    setRedirectUrl(`/auth/confirm-mail`);
  }, [setRedirectUrl, layout]);

  return (
    <Form className="mt-4" onSubmit={handleSubmit}>
      <Helmet>
        <title>
          Forgot Password | QueryDeck
        </title>
      </Helmet>
      <FormGroup>
        <Input
          className="form-control"
          placeholder="Email address"
          value={email}
          onChange={({ target }) => setEmail(target.value)}
          type="email"
        />
      </FormGroup>
      <FormGroup>
        <Button color="primary" block disabled={!email}>
          Send reset link
        </Button>
      </FormGroup>
      {/* <Link className="fs--1 text-600" to="#!">
        I can't recover my account using this page
        <span className="d-inline-block ml-1">&rarr;</span>
      </Link> */}
    </Form>
  );
};

ForgetPasswordForm.propTypes = {
  setRedirect: PropTypes.func.isRequired,
  setRedirectUrl: PropTypes.func.isRequired,
  layout: PropTypes.string
};

ForgetPasswordForm.defaultProps = { layout: 'basic' };

export default withRedirect(ForgetPasswordForm);
