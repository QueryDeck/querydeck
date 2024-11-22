import React, {
  useContext,
  useEffect,
  useState,
} from 'react'
import { Helmet } from 'react-helmet'
import PropTypes from 'prop-types'
import { Link, useHistory } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button, Form, Row, Col, FormGroup, Input, CustomInput, Label } from 'reactstrap'
import withRedirect from '../../hoc/withRedirect'
import AppContext from '../../context/Context'

// Redux
import { useDispatch } from 'react-redux'

import CryptoJS from 'crypto-js'
import Cookies from 'js-cookie'
import posthog from 'posthog-js'

import api from '../../api'
import secret from '../../secret'

import tracker from '../../tracker'

let handleSubmitController

// System color theme
// const systemDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
const systemDarkTheme = false

const LoginForm = ({ setRedirect, hasLabel, layout }) => {
  // Redux
  const dispatch = useDispatch()

  let history = useHistory()

  const { setIsDark } = useContext(AppContext)

  // State 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [isDisabled, setIsDisabled] = useState(true)

  // Handler
  const handleSubmit = e => {
    e.preventDefault()

    api.post('/login', {
        email: email,
        password: password,
        remember
      }, {
        signal: handleSubmitController.signal
      }
    ).then(res => {
      if(window.location.search.includes('redirect')) {
        history.replace(window.location.search.split('=')[1])
      } else {
        history.replace('/apps')
      }
      toast.success(`Logged in as ${email}`)
      setIsDark(systemDarkTheme)
      Cookies.set('session', CryptoJS.AES.encrypt(JSON.stringify({
        user: {
          email,
          user_id: res.data.data.details.user_id
        },
        preferences: {
          ...res.data.data.preferences,
          theme: systemDarkTheme ? 'dark' : 'light'
        }
      }), secret), { expires: remember ? 7 : 1 }, { sameSite: 'strict' })
      dispatch({ type: 'RESET' })
      tracker.setUserID(res.data.data.details.user_id)
      tracker.setMetadata('Email', email)

      posthog.identify(
        res.data.data.details.user_id,
        {
          email,
          preferences: res.data.data.preferences
        }
      )
    }).catch(err => {
      console.error(err)
      toast.error(err.response.data.meta.message)
    })
  }

  useEffect(() => {
    setIsDisabled(!email || !password)
  }, [email, password])

  useEffect(() => {
    handleSubmitController = new AbortController()
    return(() => {
      handleSubmitController.abort()
    })
    // eslint-disable-next-line
  }, [])

  return (
    <Form onSubmit={handleSubmit}>
      <Helmet>
        <title>
          Login | QueryDeck
        </title>
      </Helmet>
      <FormGroup>
        {hasLabel && <Label>Email address</Label>}
        <Input
          placeholder={!hasLabel ? 'Email address' : ''}
          value={email}
          onChange={({ target }) => setEmail(target.value)}
          type="email"
        />
      </FormGroup>
      <FormGroup>
        {hasLabel && <Label>Password</Label>}
        <Input
          placeholder={!hasLabel ? 'Password' : ''}
          value={password}
          onChange={({ target }) => setPassword(target.value)}
          type="password"
        />
      </FormGroup>
      <Row className="justify-content-between align-items-center">
        <Col xs="auto">
          <CustomInput
            id="customCheckRemember"
            label="Remember me"
            checked={remember}
            onChange={({ target }) => setRemember(target.checked)}
            type="checkbox"
          />
        </Col>
        <Col xs="auto">
          <Link className="fs--1" to={`/auth/forgot-password`}>
            Forgot Password?
          </Link>
        </Col>
      </Row>
      <FormGroup>
        <Button color="primary" block className="mt-3" disabled={isDisabled}>
          Log in
        </Button>
      </FormGroup>
    </Form>
  )
}

LoginForm.propTypes = {
  setRedirect: PropTypes.func.isRequired,
  layout: PropTypes.string,
  hasLabel: PropTypes.bool
}

LoginForm.defaultProps = {
  layout: 'basic',
  hasLabel: false
}

export default withRedirect(LoginForm)
