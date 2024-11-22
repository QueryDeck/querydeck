import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { toast } from 'react-toastify';
import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

import secret from '../../../secret';

import api from '../../../api';

import AuthCardLayout from '../../../layouts/AuthCardLayout';

let verifyForgotUserController
let verifyNewUserController

// Verifies registration
const Verify = () => {

    let history = useHistory()

    useEffect(() => {
        verifyForgotUserController = new AbortController()
        verifyNewUserController = new AbortController()

        getParams()

        return () => {
            verifyForgotUserController.abort()
            verifyNewUserController.abort()
        }
        // eslint-disable-next-line
    }, [])

    const getParams = () => {
        let params = {}
        window.location.search.split('&').forEach(element => {
            if(element.includes('?')) {
                const localElement = element.split('?')[1]
                params[localElement.split('=')[0]] = localElement.split('=')[1]
            } else {
                params[element.split('=')[0]] = element.split('=')[1]
            }
        })
        switch(params.type) {
            case 'account':
                verifyNewUser(params)
                break;
            case 'forgot':
                verifyForgotUser(params)
                break;
            default:
                console.error(`Invalid type: ${params.type}`)
                toast.error('Invalid Link')
        }
    }

    const verifyForgotUser = params => {
        console.log('Params', params)
        api.post('/account/forgot-pass-verify', params, {
            signal: verifyForgotUserController.signal
        }).then(res => {
            history.replace(`/auth/password-reset${window.location.search}`)
        }).catch(err => {
            toast.error(err.response.data.meta.message)
            history.replace('/auth/login')
        })
    }

    const verifyNewUser = params => {
        console.log('Params', params)
        api.post('/register/verify', params, {
            signal: verifyNewUserController.signal
        }).then(res => {
            let session = {}
            if(Cookies.get('session')) {
                session = JSON.parse(CryptoJS.AES.decrypt(Cookies.get('session'), secret).toString(CryptoJS.enc.Utf8))
            }
            Cookies.set('session', CryptoJS.AES.encrypt(JSON.stringify({
                ...session,
                user: {
                    ...session.user,
                    email: res.data.data.email
                }
            }), secret), { expires: 7 }, { sameSite: 'strict' })
            history.replace('/apps')
        }).catch(err => {
            toast.error(err.response.data.meta.message)
            history.replace('/auth/login')
        })
    }

    return (
        <AuthCardLayout>
            <div style={{ textAlign: 'center' }}>
                <Spinner />
            </div>
        </AuthCardLayout>
    );
};

export default Verify;