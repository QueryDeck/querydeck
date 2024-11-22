import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet'
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { Button, Form, FormGroup, Input } from 'reactstrap';
import withRedirect from '../../hoc/withRedirect';
import Label from 'reactstrap/es/Label';
import classNames from 'classnames';

import api from '../../api'

let handleSubmitController

const PasswordResetForm = ({ setRedirect, setRedirectUrl, layout, hasLabel }) => {
  // State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDisabled, setIsDisabled] = useState(true);

  const params = useRef({})

  useEffect(() => {
    handleSubmitController = new AbortController()

    getParams()

    return () => {
      handleSubmitController.abort()
    }
    // eslint-disable-next-line
  }, [])

  const getParams = () => {
    let localParams = {}
    window.location.search.split('&').forEach(element => {
      if(element.includes('?')) {
        const localElement = element.split('?')[1]
        localParams[localElement.split('=')[0]] = localElement.split('=')[1]
      } else {
        localParams[element.split('=')[0]] = element.split('=')[1]
      }
    })
    params.current = localParams
    if(
      localParams.type !== 'forgot' ||
      !localParams.token ||
      !localParams.vid
    ) {
      toast.error('Invalid Link')
      setRedirect(true)
    }
  }


  // Handler
  const handleSubmit = event => {
    event.preventDefault();

    if(password === confirmPassword) {
      api.post('/account/forgot-pass-reset', {
          password: password,
          token: params.current.token,
          vid: params.current.vid
        }, {
          signal: handleSubmitController.signal
        }
      ).then(res => {
        toast.success('Login with your new password');
        setRedirect(true);
      }).catch(err => {
        console.log(err)
        toast.error(err.response.data.meta.message)
      })
    };
  }

  useEffect(() => {
    setRedirectUrl(`/auth/login`);
  }, [setRedirectUrl, layout]);

  useEffect(() => {
    if (password === '' || confirmPassword === '') return setIsDisabled(true);

    setIsDisabled(password !== confirmPassword);
  }, [password, confirmPassword]);

  return (
    <Form className={classNames('mt-3', { 'text-left': hasLabel })} onSubmit={handleSubmit}>
      <Helmet>
        <title>
          Password Reset | QueryDeck
        </title>
      </Helmet>
      <FormGroup>
        {hasLabel && <Label>New Password</Label>}
        <Input
          placeholder={!hasLabel ? 'New Password' : ''}
          value={password}
          onChange={({ target }) => setPassword(target.value)}
          type="password"
        />
      </FormGroup>
      <FormGroup>
        {hasLabel && <Label>Confirm Password</Label>}
        <Input
          placeholder={!hasLabel ? 'Confirm Password' : ''}
          value={confirmPassword}
          onChange={({ target }) => setConfirmPassword(target.value)}
          type="password"
        />
      </FormGroup>
      <Button color="primary" block className="mt-3" disabled={isDisabled}>
        Set password
      </Button>
    </Form>
  );
};

PasswordResetForm.propTypes = {
  setRedirect: PropTypes.func.isRequired,
  setRedirectUrl: PropTypes.func.isRequired,
  layout: PropTypes.string,
  hasLabel: PropTypes.bool
};

PasswordResetForm.defaultProps = { layout: 'basic', hasLabel: false };

export default withRedirect(PasswordResetForm);
