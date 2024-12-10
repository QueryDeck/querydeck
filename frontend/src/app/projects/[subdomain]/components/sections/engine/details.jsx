// React imports
import React, {
  useEffect,
  useState
} from 'react'

// Redux
import { useSelector } from 'react-redux'

// Library imports
import {
  faCopy,
  faMinus,
  faPlus
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Alert,
  Badge,
  Button,
  Card
} from 'reactstrap'
import ReactJson from 'react-json-view'
import { toast } from 'react-toastify'

// API
import { apiBase } from '../../../../../../api';

// SCSS module
import styles from './details.module.scss'

const Documentation = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])

  const [docState, setDocState] = useState({
    request: {},
    response: {}
  })
  const [command, setCommand] = useState(' ')

  // Tab Label
  const copyAPI = () => {
    navigator.clipboard.writeText(`https://${props.subdomain}.${apiBase}${state.route}`).then(() => {
      toast.success('API copied!')
    }).catch(err => {
      console.error(err)
    })
  }

  const copyCommand = () => {
    navigator.clipboard.writeText(command).then(() => {
      toast.success('API copied!')
    }).catch(err => {
      console.error(err)
    })
  }


  const copyRequest = () => {
    navigator.clipboard.writeText(state?.base?.value ? JSON.stringify(state.request) : '{}').then(() => {
      toast.success('Sample request copied!')
    }).catch(err => {
      console.error(err)
    })
  }

  const copyResponse = () => {
    navigator.clipboard.writeText(state?.base?.value ? JSON.stringify(state.response) : '{}').then(() => {
      toast.success('Sample response copied!')
    }).catch(err => {
      console.error(err)
    })
  }

  const copyQuery = () => {
    navigator.clipboard.writeText(state.text).then(() => {
      toast.success('Query copied!')
    }).catch(err => {
      console.error(err)
    })
  }

  const getBadgeData = (status = null) => {
    if (state?.method?.method?.toLowerCase() === 'post' || status === 200) {
      return ({
        badge: styles.badge_success,
        heading: styles.script_heading_success
      })
    } else if (state?.method?.method?.toLowerCase() === 'put' || status === 300) {
      return ({
        badge: styles.badge_warning,
        heading: styles.script_heading_warning
      })
    } else if (state?.method?.method?.toLowerCase() === 'delete' || status === 400) {
      return ({
        badge: styles.badge_danger,
        heading: styles.script_heading_danger
      })
    } else {
      return ({
        badge: styles.badge_primary,
        heading: styles.script_heading_primary
      })
    }
  }

  useEffect(() => {
    updateCommand()
  }, [state?.text, state?.authentication])

  const updateCommand = () => {
    let updatedCommand = `${command}`
    updatedCommand = `curl 'https://${props.subdomain}.${apiBase}${state?.route}' \\ \n  -X ${state?.method?.method} \\ \n  -H 'Accept: application/json' `
    if (state?.authentication?.value) {
      updatedCommand = updatedCommand.split(`\\ \n --H 'authorization:`)[0].concat(`\\ \n  -H 'authorization: your JWT goes here' `)
    }
    if (state?.request && JSON.stringify(state?.request).length > 2) {
      updatedCommand = updatedCommand.split(`\\ \n --data-raw:`)[0].concat(`\\ \n  --data-raw: '${JSON.stringify(state?.request)}'`)
    }
    setCommand(updatedCommand)
  }

  const renderParameter = (parameter, datatype, required = false, info = null) => {
    return (
      <>
        <div
          className={styles.parameter}
          key={parameter}
        >
          <div className={styles.parameter_title}>
            {parameter}
          </div>
          <div className={styles.parameter_type}>
            {datatype}
          </div>
          {required && <div className={styles.parameter_required}>
            Required
          </div>}
        </div>
        {info?.length && <div className={styles.parameter_info}>
          {info}
        </div>}
      </>
    )
  }

  const renderPathParameters = () => {
    const parameters = state?.route?.split(':')
    const pathParameters = parameters
      .filter(element => element[0] !== '/')
      .map(element => element.split('/')[0])
    const data = {}
    pathParameters.forEach(element => {
      data[element] = {
        $qd_column: true,
        type: 'text',
        required: true,
        dataType: 'text'
      }
    })
    if (Object.keys(data).length) {
      return (
        <>
          <div className={styles.parameters_title}>
            Path Parameters
          </div>
          <div className={styles.parameters_content}>
            {parseData(data, null, 'request')}
          </div>
        </>
      )
    }
  }

  const renderQueryParameters = () => {
    const queryParams = state?.queryParams
    const data = {}
    if (state?.queryParams) {
      Object.keys(queryParams).forEach(param => {
        // if (['_limit', '_offset', '_order'].includes(param)) {
          // if (param === '_order') {
            // let details = ''
            // state.sorts.forEach(element => {
              //   details = details.concat(`${element.column.label}:${element.order},`)
              // })
        if (['_limit', '_offset'].includes(param)) {
          data[param] = {
            $qd_column: true,
            type: queryParams[param].type,
            details: queryParams[param].description,
            required: false
          }
        } else {
          data[param] = {
            $qd_column: true,
            type: queryParams[param].type,
            details: queryParams[param].description,
            required: true
          }
        }
      })
    }
    if (state?.sorts_dynamic?.length) {
      let details = ''
      state.sorts_dynamic.forEach((element, index) => {
        details = details.concat(`${element.label}:${index % 2 === 0 ? 'asc' : 'desc'}`)
        if (index < state.sorts_dynamic.length - 1) {
          details = details.concat(',')
        }
      })
      data['_order'] = {
        $qd_column: true,
        type: 'text',
        details,
        required: false
      }
    }
    if (Object.keys(data).length) {
      return (
        <>
          <div className={styles.parameters_title}>
            Query Parameters
          </div>
          <div className={styles.parameters_content}>
            {parseData(data, null, 'request')}
          </div>
        </>
      )
    }
  }

  const parseData = (data, key = null, dataType) => {
    if (data.$qd_column) {
      return renderParameter(key, data.type, data.required, data.details)
    } else {
      const renderAction = element => {
        if (
          (dataType === 'request' && docState.request[element]) ||
          (dataType === 'response' && docState.response[element])
        ) {
          return (
            <div
              className={styles.parameter_container_heading_action}
              onClick={() => toggleAction(element)}
            >
              <FontAwesomeIcon icon={faPlus} />
            </div>
          )
        } else {
          return (
            <div
              className={styles.parameter_container_heading_action}
              onClick={() => toggleAction(element)}
            >
              <FontAwesomeIcon icon={faMinus} />
            </div>
          )
        }
      }

      const toggleAction = element => {
        switch (dataType) {
          case 'request':
            if (docState.request[element]) {
              // expand
              setDocState({
                ...docState,
                request: {
                  ...docState.request,
                  [element]: false
                }
              })
            } else {
              // collapse
              setDocState({
                ...docState,
                request: {
                  ...docState.request,
                  [element]: true
                }
              })
            }
            break;
          case 'response':
            if (docState.response[element]) {
              // expand
              setDocState({
                ...docState,
                response: {
                  ...docState.response,
                  [element]: false
                }
              })
            } else {
              // collapse
              setDocState({
                ...docState,
                response: {
                  ...docState.response,
                  [element]: true
                }
              })
            }
            break;
          default:
            console.error(`Unknown datatype: ${dataType}`)
            break;
        }
      }

      const result = []
      Object.keys(data).forEach(element => {
        const children = parseData(data[element], element, dataType)
        if (!data[element].$qd_column) {
          result.push(
            <div className={(dataType === 'request' && docState.request[element]) ||
              (dataType === 'response' && docState.response[element]) ? styles.parameter_container_collapsed : styles.parameter_container_heading}>
              <div className={styles.parameter_container_heading_content}>
                {renderParameter(element, data[element].constructor === Array ? 'array' : 'object', data[element].required, data[element].details)}
              </div>
              {isNaN(element) && renderAction(element)}
            </div>
          )
        }
        if (!(
          (dataType === 'request' && docState.request[element]) ||
          (dataType === 'response' && docState.response[element])
        )) {
          result.push(children)
        }
      })
      return (
        <div className={styles.parameter_container_body}>
          {result}
        </div>
      )
    }
  }

  const renderBodyParameters = () => {
    if (JSON.stringify(state?.request_detailed).length > 2) {
      return (
        <>
          <div className={styles.parameters_title}>
            Body Parameters
          </div>
          <div className={styles.parameters_content}>
            {parseData(state.request_detailed, null, 'request')}
          </div>
        </>
      )
    }
  }

  const renderResponse = () => {
    if (JSON.stringify(state?.response_detailed).length > 2) {
      return (
        <>
          <div className={styles.parameters_title}>
            Response
          </div>
          <div className={styles.parameters_content}>
            {parseData(state.response_detailed, null, 'response')}
          </div>
        </>
      )
    }
  }

  const renderParameters = () => {
    return (
      <div className={styles.parameters}>
        {renderQueryParameters()}
        {renderPathParameters()}
        {renderBodyParameters()}
        {renderResponse()}
      </div>
    )
  }

  const renderData = () => {
    const badgeData = getBadgeData()
    return (
      <div className={styles.data}>
        {state?.method?.method && <div className={styles.script} >
          <div
            className={badgeData?.heading}
            onClick={copyAPI}
          >
            <Badge className={badgeData?.badge}>
              {state.method.method ? state.method.method : 'GET'}
            </Badge>
            <span>
              https://{props.subdomain}.{apiBase}{state.route}
            </span>
          </div>
          <div
            className={styles.script_body}
            onClick={copyCommand}
          >
            {command}
          </div>
        </div>}
        {JSON.stringify(state?.request).length > 2 && <div className={styles.request}>
          <div className={styles.request_heading}>
            <span>
              Request
            </span>
            <Button
              color='falcon-primary'
              onClick={copyRequest}
              size='sm'
            >
              <FontAwesomeIcon icon={faCopy} />
            </Button>
          </div>
          <div className={styles.request_body}>
            <ReactJson
              // collapsed={state.request.length <= 25 ? 3 : 2}
              // collapseStringsAfterLength={50}
              displayDataTypes={false}
              name={null}
              src={state?.base?.value ? state.request : {}}
            />
          </div>
        </div>}
        {JSON.stringify(state?.response).length > 2 && <div className={styles.response}>
          <div className={styles.response_heading}>
            <span>
              Response
            </span>
            <Button
              color='falcon-primary'
              onClick={copyResponse}
              size='sm'
            >
              <FontAwesomeIcon icon={faCopy} />
            </Button>
          </div>
          <div className={styles.response_body}>
            <Alert
              className={styles.alert}
              color='warning'
            >
              This is a sample response. The actual response will differ depending on the parameters selected.
            </Alert>
            <ReactJson
              // collapsed={state.response.length <= 25 ? 4 : 3}
              // collapseStringsAfterLength={50}
              displayDataTypes={false}
              name={null}
              src={state?.base?.value ? state.response : {}}
            />
          </div>
        </div>}
        {state?.text.length ? <div className={styles.query}>
          <div className={styles.query_heading}>
            <span>
              Query
            </span>
            <Button
              color='falcon-primary'
              onClick={copyQuery}
              size='sm'
            >
              <FontAwesomeIcon icon={faCopy} />
            </Button>
          </div>
          <div className={styles.query_body}>
            {state.text}
          </div>
        </div> : null}
      </div>
    )
  }

  if(props.dragging || !state) {
		return (
			<Card
        style={{
          opacity: 0.5,
          width: props.width
        }}
      />
		)
  } else {
    return(
      <Card style={{
        marginTop: '4px',
        width: props.width
      }}>
        <div className={styles.details}>
          {renderParameters()}
          {renderData()}
        </div>
      </Card>
    )
  }

}

export default Documentation