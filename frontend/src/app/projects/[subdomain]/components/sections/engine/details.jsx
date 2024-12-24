// React imports
import React, {
  useEffect,
  useState
} from 'react'

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

const Details = props => {
  const { docs } = props

  const [docState, setDocState] = useState({
    request: {},
    response: {}
  })
  const [command, setCommand] = useState(' ')

  // Tab Label
  const copyAPI = () => {
    navigator.clipboard.writeText(`https://${props.subdomain}.${apiBase}${docs?.apiRoute}`).then(() => {
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
    navigator.clipboard.writeText(docs?.request_body ? JSON.stringify(docs?.request_body) : '{}').then(() => {
      toast.success('Sample request copied!')
    }).catch(err => {
      console.error(err)
    })
  }

  const copyResponse = () => {
    navigator.clipboard.writeText(docs?.response_body ? JSON.stringify(docs?.response_body) : '{}').then(() => {
      toast.success('Sample response copied!')
    }).catch(err => {
      console.error(err)
    })
  }

  const copyQuery = () => {
    navigator.clipboard.writeText(docs?.sql_query?.text).then(() => {
      toast.success('Query copied!')
    }).catch(err => {
      console.error(err)
    })
  }

  const getBadgeData = (status = null) => {
    if (docs?.method === 'insert' || status === 200) {
      return ({
        badge: styles.badge_success,
        heading: styles.script_heading_success,
        method: 'POST'
      })
    } else if (docs?.method === 'update' || status === 300) {
      return ({
        badge: styles.badge_warning,
        heading: styles.script_heading_warning,
        method: 'PUT'
      })
    } else if (docs?.method === 'delete' || status === 400) {
      return ({
        badge: styles.badge_danger,
        heading: styles.script_heading_danger,
        method: 'DELETE'
      })
    } else {
      return ({
        badge: styles.badge_primary,
        heading: styles.script_heading_primary,
        method: 'GET'
      })
    }
  }

  useEffect(() => {
    updateCommand()
  }, [docs?.sql_query?.text, docs?.auth_required])

  const updateCommand = () => {
    const badgeData = getBadgeData()
    let updatedCommand = `${command}`
    updatedCommand = `curl 'https://${props.subdomain}.${apiBase}${docs?.apiRoute}' \\ \n  -X ${badgeData?.method} \\ \n  -H 'Accept: application/json' `
    if (docs?.auth_required) {
      updatedCommand = updatedCommand.split(`\\ \n --H 'authorization:`)[0].concat(`\\ \n  -H 'authorization: your JWT goes here' `)
    }
    if (docs?.request_body && JSON.stringify(docs?.request_body).length > 2) {
      updatedCommand = updatedCommand.split(`\\ \n --data-raw:`)[0].concat(`\\ \n  --data-raw: '${JSON.stringify(docs?.request_body)}'`)
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
    const parameters = docs?.apiRoute?.split(':')
    if (parameters) {
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
  }

  const renderQueryParameters = () => {
    const queryParams = docs?.request_query
    const data = {}
    if (queryParams) {
      Object.keys(queryParams).forEach(param => {
        if (['_limit', '_offset', '_order'].includes(param)) {
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
    if (JSON.stringify(docs?.request_body_detailed).length > 2) {
      return (
        <>
          <div className={styles.parameters_title}>
            Body Parameters
          </div>
          <div className={styles.parameters_content}>
            {parseData(docs?.request_body_detailed, null, 'request')}
          </div>
        </>
      )
    }
  }

  const renderResponse = () => {
    if (JSON.stringify(docs?.response_detailed).length > 2) {
      return (
        <>
          <div className={styles.parameters_title}>
            Response
          </div>
          <div className={styles.parameters_content}>
            {parseData(docs?.response_detailed, null, 'response')}
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
        <div className={styles.script} >
          <div
            className={badgeData?.heading}
            onClick={copyAPI}
          >
            <Badge className={badgeData?.badge}>
              {badgeData?.method}
            </Badge>
            <span>
              https://{props.subdomain}.{apiBase}{docs?.apiRoute}
            </span>
          </div>
          <div
            className={styles.script_body}
            onClick={copyCommand}
          >
            {command}
          </div>
        </div>
        {JSON.stringify(docs?.request_body).length > 2 && <div className={styles.request}>
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
              // collapsed={docs?.request.length <= 25 ? 3 : 2}
              // collapseStringsAfterLength={50}
              displayDataTypes={false}
              name={null}
              src={docs?.request_body}
            />
          </div>
        </div>}
        {JSON.stringify(docs?.response).length > 2 && <div className={styles.response}>
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
            <ReactJson
              // collapsed={docs?.response.length <= 25 ? 4 : 3}
              // collapseStringsAfterLength={50}
              displayDataTypes={false}
              name={null}
              src={docs?.response}
            />
          </div>
        </div>}
        {docs?.sql_query.text.length ? <div className={styles.query}>
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
            <Alert
              className={styles.alert}
              color='warning'
            >
              This is a sample query. The actual query will differ depending on the parameters selected.
            </Alert>
            {docs?.sql_query.text}
          </div>
        </div> : null}
      </div>
    )
  }

  if(props.dragging || !docs) {
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

export default Details