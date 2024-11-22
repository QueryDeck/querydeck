// React imports
import React, {
    useEffect,
    useReducer
} from 'react'
import { Helmet } from 'react-helmet'
import { useHistory } from 'react-router-dom'

// Redux
import { useDispatch } from 'react-redux'

// Reducers
import createDatabaseReducer from '../../reducers/databases/createDatabaseReducer'

// Library imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBan,
    faPlus
} from '@fortawesome/free-solid-svg-icons'
import Cookies from 'js-cookie'
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Form,
    FormGroup,
    FormFeedback,
    Input,
    Label
} from 'reactstrap'
import { toast } from 'react-toastify'

// Components
import Menu from '../menu/Menu'

// API
import api from '../../../api'

// Abort controller for cancelling network requests
let createDatabaseController

// Create database at '/apps/app-id/databases/new'
const CreateDatabase = props => {
    // Redux
    const reduxDispatch = useDispatch()

    // Props
    const { appid } = props

    // For 403 errors on unauthorised users
    const history = useHistory()

    // Initial state
    const initialState = {
        connectionString: '',
        db_engine: 'PostgreSQL',
        dbHost: {
            label: 'Database Host'
        },
        dbUsername: {
            label: 'Database Username'
        },
        dbPassword: {
            label: 'Database Password'
        },
        dbPort: {
            label: 'Database Port'
        },
        dbName: {
            label: 'Database Name'
        },
        dbalias: {
            label: 'Database Alias'
        },
        buttonLoading: false
    }

    const fields = Object.keys(initialState).slice(2, Object.keys(initialState).length - 1)

    // Adding checks and values to initial state
    fields.forEach(field => {
        initialState[field].value = field === 'dbPort' ? '80' : ''
        initialState[field].check = false
    })

    const [state, dispatch] = useReducer(createDatabaseReducer, initialState)

    useEffect(() => {
        createDatabaseController = new AbortController()

        return () => {
            createDatabaseController.abort()
        }
    }, [])

    // Updates field value
    const updateField = (field, event) => {
        dispatch({
            type: 'VALUE',
            field: field,
            value: event.target.value,
        })
    }

    // Updates connection string
    const updateConnectionString = event => {
        dispatch({
            type: 'UPDATE_CONNECTION_STRING',
            connectionString: event.target.value.replace(/^\s+|\s+$/g, '')
        })
    }

    // Checks empty field and alerts user
    const checkField = field => {
        dispatch({
            type: 'CHECK',
            field,
            check: true
        })
    }

    // Resets db state to default
    const resetData = () => {
        fields.forEach(field => {
            dispatch({
                type: 'RESET',
                field
            })
        })
    }

    // Checks empty fields and returns boolean
    const checkValues = () => {
        let flag = true
        fields.slice(0, fields.length - 1).forEach(field => {
            if(!(state[field].value && state.db_engine)) {
                flag = false
            }
        })
        return flag
    }

    // Renders input fields as a form for db details
    const renderFields = () => {
        // DB Type Selector
        const formFields = []
        for (let index = 0; index < fields.length; index++) {
            let inputType
            const field = fields[index]
            const label = state[fields[index]].label
            // Sets field type depending on the field
            switch (field) {
                case 'dbPassword':
                    inputType = 'password'
                    break;
                case 'dbPort':
                    inputType = 'number'
                    break;
                default:
                    inputType = 'text'
                    break;
            }
            formFields.push(
                <FormGroup
                    data-testid={field}
                    key={field}
                >
                    <Label style={{ width: '100%'}}>
                        {label}:
                        <Input
                            invalid={!state[field].value && state[field].check && field !== 'dbalias'}
                            onBlur={() => checkField(field)}
                            onChange={event => updateField(field, event)}
                            placeholder={`Enter ${label}`}
                            required='required'
                            type={inputType}
                            value={state[field].value}
                        />
                        <FormFeedback>
                            {label} is required
                        </FormFeedback>
                    </Label>
                </FormGroup>
            )
        }
        return(
            <Form>
                {formFields}
            </Form>
        )
    }

    // Renders a list of db engines
    const renderEngines = () => {
        return(
            <>
                <Label className='list-card-label'>
                    Connection String:
                    <Input
                        onChange={updateConnectionString}
                        placeholder='Database connection string (optional)'
                        value={state.connectionString}
                    />
                </Label>
                <div className='create-separator-container'>
                    <div className='create-separator-item' />
                    <h4 className='create-or'>OR</h4>
                    <div className='create-separator-item' />
                </div>
            </>
        )
    }

    // Renders combined data
    const renderForm = () => {
        return(
            <div className='create-form'>
                {renderEngines()}
                {renderFields()}
                <div className='create-actions'>
                    <div>
                        <Button
                            block
                            color='falcon-danger'
                            onClick={resetData}
                            size='lg'
                        >
                            Reset
                            <FontAwesomeIcon
                                className='btn-falcon inline-delete'
                                icon={faBan}
                            />
                        </Button>
                    </div>
                    <div>
                        <Button
                            block
                            color='falcon-success'
                            disabled={!checkValues() || state.buttonLoading}
                            onClick={createDatabase}
                            size='lg'
                        >
                            Add Data Source
                            <FontAwesomeIcon icon={faPlus} className='btn-falcon inline-delete' />
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // Adds db to the app's db list
    const createDatabase = () => {
        dispatch({
            type: 'BUTTON_LOADING_START'
        })
        // Checks empty fields
        let flag = true
        let newDB = {
            subdomain: appid
        }
        fields.forEach(field => {
            if(state[field].value.length || field === 'dbalias') {
                newDB[field.toLowerCase()] = state[field].value
            } else {
                flag = false
            }
        })
        if(state.db_engine) {
            newDB['db_type'] = state.db_engine
        } else {
            flag = false
        }
        console.log('Database Details')
        console.table(newDB)

        if(flag) {
            api.post('/databases', newDB, {
                signal: createDatabaseController.signal
            }).then(res => {
                dispatch({
                    type: 'BUTTON_LOADING_STOP'
                })
                console.log('Database Details')
                console.table(res.data.data)
                toast.success(`Data Source Added Successfully!`)
                history.replace(`/apps/${appid}/data-sources`)
            }).catch(err => {
                console.error('Unable to create a new db', err)
                dispatch({
                    type: 'BUTTON_LOADING_STOP'
                })
                toast.warning(`Error! Please check the fields and try again.`)
                if(err.response) {
                    if(err.response.status === 403) {
                        Cookies.remove('session')
                        toast.warning(`Please login again`)
                        reduxDispatch({ type: 'RESET' })
                        history.push(`/auth/login?redirect=/apps/${appid}/data-sources/new`)
                    } else if(err.response.status === 400) {
                        toast.error('Error 400 | Bad Request')
                    } else if(err.response.status === 404) {
                        toast.error('Error 404 | Not Found')
                    } else if(err.response.status === 500) {
                        toast.error('Error 500 | Internal Server Error')
                    }
                }
            })
        } else {
            toast.warn('Please fill up the empty fields and try again!')
            console.warn('Form fields empty')
        }
    }

    const renderData = () => {
        return(
            <div className='list-deck'>
                <Menu appid={appid} />
                <Card className='list-card-main'>
                    <div className='databases-list'>
                        <CardHeader>
                            <h2 className='apps-heading'>
                                New Data Source
                            </h2>
                        </CardHeader>
                        <CardBody>
                            {renderForm()}
                        </CardBody>
                    </div>
                </Card>
            </div>
        )
    }

    return(
        <div>
            <Helmet>
                <title>
                    New | Data Sources | Query Charts
                </title>
            </Helmet>
            {console.log('State', state)}
            {renderData()}
        </div>
    )
}

export default CreateDatabase