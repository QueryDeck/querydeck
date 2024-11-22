import React, {useContext,  useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {  useHistory } from 'react-router-dom'
import { toast } from 'react-toastify';
import { Button, Form, FormGroup, Input, Label } from 'reactstrap';
import withRedirect from '../../hoc/withRedirect';
import AppContext from '../../context/Context'

import CryptoJS from 'crypto-js'
import Cookies from 'js-cookie'
import posthog from 'posthog-js'

import api from '../../api';
import secret from '../../secret';

import tracker from '../../tracker'

// System color theme
// const systemDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
const systemDarkTheme = false

let handleSubmitController

const RegistrationForm = ({ setRedirect, setRedirectUrl, layout, hasLabel }) => {
  // State
  // const [name, setName] = useState('');
  let history = useHistory()

  const { setIsDark } = useContext(AppContext)

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDisabled, setIsDisabled] = useState(true);

  // Handler
  const handleSubmit = e => {
    e.preventDefault()

    api.post('/register', {
        email: email,
        password: password
      }, {
        signal: handleSubmitController.signal
      }
    ).then(res => {
      let session = {}
      if(Cookies.get('session')) {
        session = JSON.parse(CryptoJS.AES.decrypt(Cookies.get('session'), secret).toString(CryptoJS.enc.Utf8))
      }
      setIsDark(session.theme || systemDarkTheme)
      Cookies.set('session', CryptoJS.AES.encrypt(JSON.stringify({
        ...session,
        user: {
          email,
          user: res.data.data.details.user_id
        },
        preferences: {
          ...res.data.data.preferences,
          theme: systemDarkTheme ? 'dark' : 'light',
          tour: res.data.data.tour,
        }
      }), secret), { expires: 7 }, { sameSite: 'strict' })
      toast.success(`Please verify your email by clicking on the link in the email we just sent you`);

      // setIsDark( theme)
      tracker.setUserID(res.data.data.user_id)
      tracker.setMetadata('Email', email)

      posthog.identify(
        res.data.data.details.user_id,
        {
          email,
          preferences: res.data.data.preferences
        }
      )

      // setRedirect(true);
      history.replace('/apps')
    }).catch(err => {
      console.log(err)
      toast.error(err.response.data.meta.message)
    })
  };

  useEffect(() => {
    setRedirectUrl(`/apps`);
  }, [setRedirectUrl, layout]);

  useEffect(() => {
    setIsDisabled(!email || !password || !confirmPassword || password !== confirmPassword || password.length <8 || confirmPassword.length <8);
  }, [email, password, confirmPassword]);

  useEffect(() => {
    handleSubmitController = new AbortController()
    return(() => {
      handleSubmitController.abort()
    })
    // eslint-disable-next-line
  }, [])

  return (
    <Form onSubmit={handleSubmit}>
      {/* <FormGroup>
        {hasLabel && <Label>Name</Label>}
        <Input placeholder={!hasLabel ? 'Name' : ''} value={name} onChange={({ target }) => setName(target.value)} />
      </FormGroup> */}
      <FormGroup>
        {hasLabel && <Label>Email address</Label>}
        <Input
          placeholder={!hasLabel ? 'Email address' : ''}
          value={email}
          onChange={({ target }) => setEmail(target.value)}
          type="email"
        />
      </FormGroup>
      {/* <div className="form-row"> */}
        <FormGroup
          // className="col-6"
        >
          {hasLabel && <Label>Password (minimum 8 characters)</Label>}
          <Input
            placeholder={!hasLabel ? 'Password' : ''}
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            type="password"
          />
        </FormGroup>
        <FormGroup
          // className="col-6"
        >
          {hasLabel && <Label>Confirm Password</Label>}
          <Input
            placeholder={!hasLabel ? 'Confirm Password' : ''}
            value={confirmPassword}
            onChange={({ target }) => setConfirmPassword(target.value)}
            type="password"
          />
        </FormGroup>
      {/* </div> */}

      <FormGroup>
        <Button color="primary" block className="mt-3" disabled={isDisabled}>
          Register
        </Button>
      </FormGroup>
    </Form>
  );
};

RegistrationForm.propTypes = {
  setRedirect: PropTypes.func.isRequired,
  setRedirectUrl: PropTypes.func.isRequired,
  layout: PropTypes.string,
  hasLabel: PropTypes.bool
};

RegistrationForm.defaultProps = {
  layout: 'basic',
  hasLabel: false
};

export default withRedirect(RegistrationForm);