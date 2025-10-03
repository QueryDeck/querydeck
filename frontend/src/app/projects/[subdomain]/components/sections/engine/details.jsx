// React imports
import React, {
  useEffect,
  useState
} from 'react'

// Library imports
import {
  faCopy,
  faEdit,
  faMinus,
  faPlus
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Alert,
  Badge,
  Button,
  Card,
} from 'reactstrap'
import ReactJson from 'react-json-view'
import { toast } from 'react-toastify'

// API
import { apiBase } from '../../../../../../api';

// SCSS module
import styles from './details.module.scss'

const Details = props => {
  const { customDocs, docs, oldMethod, setCustomDocs } = props

  const [docState, setDocState] = useState({
    request: {},
    response: {}
  })
  const [command, setCommand] = useState(' ')
  const [apiDescription, setApiDescription] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [fieldDescriptions, setFieldDescriptions] = useState({})
  const [collapsedSections, setCollapsedSections] = useState({
    tooling: false,
    request: true,
    response: true,
    query: false
  })

  useEffect(() => {
    setApiDescription(docs?.llm_agent_tooling?.description || '')
  }, [docs])

  const toggleSection = (section) => {
    setCollapsedSections({
      ...collapsedSections,
      [section]: !collapsedSections[section]
    })
  }

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

  const copyTooling = () => {
    navigator.clipboard.writeText(docs?.llm_agent_tooling ? JSON.stringify(docs?.llm_agent_tooling) : '{}').then(() => {
      toast.success('LLM Agent Tooling copied!')
    }).catch(err => {
      console.error(err)
    })
  }

  const getBadgeData = (status = null) => {
    if (docs?.method === 'insert' || oldMethod === 'POST' || status === 200) {
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

  const renderDescription = (showDescription, fieldKey, fieldType, parameter, currentDescription, customDocs, isEditing, handleFieldClick, handleFieldBlur, handleFieldChange, handleFieldKeyDown) => {
    if (showDescription && fieldKey?.split('.')?.length <= 3) {
      if (setCustomDocs) {
        return (
          <div className={styles.parameter_description_wrapper} onClick={!isEditing ? handleFieldClick : undefined}>
            {isEditing ? (
              <textarea
                autoFocus
                className={styles.parameter_description_input}
                onBlur={handleFieldBlur}
                onChange={handleFieldChange}
                onKeyDown={handleFieldKeyDown}
                placeholder="Add field description..."
                rows={2}
                value={currentDescription}
              />
            ) : (
              <div className={currentDescription ? styles.parameter_description_text : styles.parameter_description_placeholder}>
                {currentDescription || 'Add description...'}
                <FontAwesomeIcon 
                  icon={faEdit} 
                  className={styles.parameter_description_edit_icon}
                />
              </div>
            )}
          </div>
        )
      } else {
        if (currentDescription) {
          return (
            <div className={styles.parameter_description_readonly}>
              {currentDescription}
            </div>
          )
        }
      }
    }
  }

  const renderParameter = (parameter, fieldType, datatype, required = false, info = null, fieldKey = null, showDescription = true) => {
    const uniqueKey = fieldKey || parameter
    const currentDescription = fieldDescriptions[uniqueKey] !== undefined 
      ? fieldDescriptions[uniqueKey] 
      : (customDocs?.[fieldType]?.[parameter]?.description || info || '')
    const isEditing = editingField === uniqueKey

    const handleFieldClick = () => {
      setEditingField(uniqueKey)
      setFieldDescriptions({
        ...fieldDescriptions,
        [uniqueKey]: currentDescription
      })
    }

    const handleFieldBlur = () => {
      setEditingField(null)
      setCustomDocs({
        [fieldType]: {
          ...customDocs?.[fieldType],
          [parameter]: {
            description: currentDescription
          }
        }
      })
    }

    const handleFieldChange = (e) => {
      setFieldDescriptions({
        ...fieldDescriptions,
        [uniqueKey]: e.target.value
      })
    }

    const handleFieldKeyDown = (e) => {
      if (e.key === 'Escape') {
        setEditingField(null)
        // Revert unsaved changes
        const originalDescription = customDocs?.[fieldType]?.[parameter]?.description || info || ''
        setFieldDescriptions({
          ...fieldDescriptions,
          [uniqueKey]: originalDescription
        })
      }
    }

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
        {renderDescription(
          showDescription,
          fieldKey,
          fieldType,
          parameter,
          currentDescription,
          customDocs,
          isEditing,
          handleFieldClick,
          handleFieldBlur,
          handleFieldChange,
          handleFieldKeyDown
        )}
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
              {parseData(data, null, 'request', 'request_url')}
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
            required: Boolean(queryParams[param].required)
          }
        } else {
          data[param] = {
            $qd_column: true,
            type: queryParams[param].type,
            details: queryParams[param].description,
            required: Boolean(queryParams[param].required)
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
            {parseData(data, null, 'request', 'request_query')}
          </div>
        </>
      )
    }
  }

  const parseData = (data, key = null, dataType, fieldType, parentPath = '') => {
    if (data.$qd_column) {
      return renderParameter(key, fieldType, data.type, data.required, data.details, parentPath)
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
        const currentPath = parentPath ? `${parentPath}.${element}` : element
        const children = parseData(data[element], element, dataType, fieldType, currentPath)
        if (!data[element].$qd_column) {
          result.push(
            <div className={(dataType === 'request' && docState.request[element]) ||
              (dataType === 'response' && docState.response[element]) ? styles.parameter_container_collapsed : styles.parameter_container_heading}>
              <div className={styles.parameter_container_heading_content}>
                {renderParameter(element, fieldType, data[element].constructor === Array ? 'array' : 'object', data[element].required, data[element].details, null, false)} 
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
            {parseData(docs?.request_body_detailed, null, 'request', 'request_body')}
          </div>
        </>
      )
    }
  }


  const renderTooling = () => (
    JSON.stringify(docs?.llm_agent_tooling)?.length > 2 && <div className={styles.request} style={{ paddingTop: 8 }}>
      <div className={styles.request_heading} style={{ borderRadius: collapsedSections.tooling ? '5px' : '5px 5px 0 0', marginBottom: collapsedSections.tooling ? '4px' : '0' }}>
        <span>
          LLM Agent Tooling
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            color='falcon-primary'
            onClick={() => toggleSection('tooling')}
            size='sm'
          >
            <FontAwesomeIcon icon={collapsedSections.tooling ? faPlus : faMinus} />
          </Button>
          <Button
            color='falcon-primary'
            onClick={copyTooling}
            size='sm'
          >
            <FontAwesomeIcon icon={faCopy} />
          </Button>
        </div>
      </div>
      {!collapsedSections.tooling && (
        <div className={styles.request_body} style={{ paddingTop:  3}}>
          <ReactJson
            // collapsed={docs?.request.length <= 25 ? 3 : 2}
            // collapseStringsAfterLength={50}
            displayDataTypes={false}
            name={null}
            src={docs?.llm_agent_tooling}
          />
        </div>
      )}
    </div>
  )

  const renderAPIDescription = () => {
    const handleDescriptionClick = () => {
      if (!isEditingDescription) {
        setIsEditingDescription(true)
      }
    }

    const handleDescriptionBlur = () => {
      setIsEditingDescription(false)
      setCustomDocs({
        description: apiDescription
      })
    }

    const handleDescriptionChange = (e) => {
      setApiDescription(e.target.value)
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsEditingDescription(false)
      }
    }

    return (
      <div className={styles.description}>
        <div className={styles.description_heading}>
          <span>{docs?.title || 'API Description'}</span>
        </div>
        {
          setCustomDocs ? (
            <div className={styles.description_body} onClick={handleDescriptionClick}>
              {isEditingDescription ? (
                <textarea
                  autoFocus
                  className={styles.description_input}
                  onBlur={handleDescriptionBlur}
                  onChange={handleDescriptionChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what this API does..."
                  rows={3}
                  value={apiDescription}
                />
              ) : (
                <div className={styles.description_text}>
                  {apiDescription || 'Click to add a description...'}
                  <FontAwesomeIcon 
                    icon={faEdit} 
                    className={styles.parameter_description_edit_icon}
                  />
                </div>
              )}
            </div>
          )
          :
          <div className={styles.description_readonly}>
            {apiDescription || 'No description available'}
          </div>
        }
      </div>
    )
  }

  const renderParameters = () => {
    return (
      <div className={styles.parameters}>
        {renderAPIDescription()}
        {renderQueryParameters()}
        {renderPathParameters()}
        {renderBodyParameters()}
        {/* {renderResponseDetailed()} */}
      </div>
    )
  }

  const renderScript = () => {
    const badgeData = getBadgeData()
    return (
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
    )
  }

  const renderRequest = () => (
    JSON.stringify(docs?.request_body).length > 2 && <div className={styles.request}>
      <div className={styles.request_heading} style={{ borderRadius: collapsedSections.request ? '5px' : '5px 5px 0 0', marginBottom: collapsedSections.request ? '4px' : '0' }}>
        <span>
          Sample Request
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            color='falcon-primary'
            onClick={() => toggleSection('request')}
            size='sm'
          >
            <FontAwesomeIcon icon={collapsedSections.request ? faPlus : faMinus} />
          </Button>
          <Button
            color='falcon-primary'
            onClick={copyRequest}
            size='sm'
          >
            <FontAwesomeIcon icon={faCopy} />
          </Button>
        </div>
      </div>
      {!collapsedSections.request && (
        <div className={styles.request_body}>
          <ReactJson
            // collapsed={docs?.request.length <= 25 ? 3 : 2}
            // collapseStringsAfterLength={50}
            displayDataTypes={false}
            name={null}
            src={docs?.request_body}
          />
        </div>
      )}
    </div>
  )

  const renderQuery = () => (
    docs?.sql_query.text.length ? <div className={styles.query}>
      <div className={styles.query_heading} style={{ borderRadius: collapsedSections.query ? '5px' : '5px 5px 0 0', marginBottom: collapsedSections.query ? '4px' : '0' }}>
        <span>
          Sample Query
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            color='falcon-primary'
            onClick={() => toggleSection('query')}
            size='sm'
          >
            <FontAwesomeIcon icon={collapsedSections.query ? faPlus : faMinus} />
          </Button>
          <Button
            color='falcon-primary'
            onClick={copyQuery}
            size='sm'
          >
            <FontAwesomeIcon icon={faCopy} />
          </Button>
        </div>
      </div>
      {!collapsedSections.query && (
        <div className={styles.query_body}>
          <Alert
            className={styles.alert}
            color='warning'
          >
            This is a sample query. The actual query will differ depending on the parameters selected.
          </Alert>
          {docs?.sql_query.text}
        </div>
      )}
    </div> : null
  )

  const renderResponse = () => (
    JSON.stringify(docs?.response).length > 2 && <div className={styles.response}>
      <div className={styles.response_heading} style={{ borderRadius: collapsedSections.response ? '5px' : '5px 5px 0 0', marginBottom: collapsedSections.response ? '4px' : '0' }}>
        <span>
          Sample Response
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            color='falcon-primary'
            onClick={() => toggleSection('response')}
            size='sm'
          >
            <FontAwesomeIcon icon={collapsedSections.response ? faPlus : faMinus} />
          </Button>
          <Button
            color='falcon-primary'
            onClick={copyResponse}
            size='sm'
          >
            <FontAwesomeIcon icon={faCopy} />
          </Button>
        </div>
      </div>
      {!collapsedSections.response && (
        <div className={styles.response_body}>
          <ReactJson
            // collapsed={docs?.response.length <= 25 ? 4 : 3}
            // collapseStringsAfterLength={50}
            displayDataTypes={false}
            name={null}
            src={docs?.response}
          />
        </div>
      )}
    </div>
  )

  const renderData = () => {
    return (
      <div className={styles.data}>
        {renderScript()}
        {renderTooling()}
        {renderRequest()}
        {renderResponse()}
        {renderQuery()}
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