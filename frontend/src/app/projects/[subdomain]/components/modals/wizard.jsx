// React imports
import React, { useMemo } from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  setBase,
  setMethod,
  setAuthorization,
  closeWizardModal,
} from '../../../../../lib/data/dataSlice'

// Library imports
import Select from 'react-select'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Button
} from 'reactstrap'

const WizardModal = props => {
  // Redux
	const state = useSelector(state => state.data.api[props.subdomain]?.new)
	const dispatch = useDispatch()

  const closeModal = () => {
    dispatch(closeWizardModal({
      mode: 'api',
      subdomain: props.subdomain
    }))
  }

  const schemaHash = {}
  // eslint-disable-next-line
  state?.tables.forEach(table => {
    if (schemaHash[table.text.split('.')[0]]) {
      schemaHash[table.text.split('.')[0]].push({
        label: table.text.split('.').slice(1, table.text.split('.').length).join('.'),
        value: table.id
      })
    } else {
      schemaHash[table.text.split('.')[0]] = [{
        label: table.text.split('.').slice(1, table.text.split('.').length).join('.'),
        value: table.id
      }]
    }
  })

  const methodOptions = useMemo(() => {
    const options = [
      {
        label: "Select",
        method: "GET",
        value: "select",
      },
      {
        label: "Insert/Upsert",
        method: "POST",
        value: "insert",
      },
    ];
    if (state?.base?.primaryKeyCols?.length && state?.base?.hasSingleId ) {
      options.push({
        label: "Update",
        method: "PUT",
        value: "update",
      });
      options.push({
        label: "Delete",
        method: "DELETE",
        value: "delete",
      });
    }
    return options;
  }, [state?.base?.value]);

  const authorizationOptions = [
    {
      label: "True",
      value: true,
    },
    {
      label: "False",
      value: false,
    },
  ]

  const renderBase = () => {
    if (state?.database?.value) {
      return (
        <div
          className='query-base'
          id='tour_api-left-base'
        >
          <Button
            className='mr-1'
            color='falcon-primary'
            size=''
          >
            Base Table
          </Button>
          <div className='query-base-select'>
            <Select
              autoFocus
              classNamePrefix='react-select'
              defaultMenuIsOpen={!(state?.base && Object.keys(state?.base).length)}
              hideSelectedOptions
              noOptionsMessage={() => 'No tables match the search term'}
              onChange={value => dispatch(setBase({
                base: value,
                mode: 'api',
                query_id: 'new',
                subdomain: props.subdomain
              }))}
              options={Object.keys(schemaHash).map(table => ({
                label: table,
                options: schemaHash[table]
              }))}
              placeholder='Select Table'
              value={state?.base && Object.keys(state?.base).length ? state.base : null}
            />
          </div>
        </div>
      )
    }
    return null
  }

  const renderMethod = () => {
    if (state?.base?.value) {
      return (
        <div className="query-method" id="tour_api-left-method">
          <Button className="mr-1" color="falcon-primary" size="">
            Method
          </Button>
          <div className="query-method-select">
            <Select
              autoFocus
              classNamePrefix="react-select"
              defaultMenuIsOpen={!(state?.method && Object.keys(state?.method).length)}
              hideSelectedOptions
              noOptionsMessage={() => "No methods match the search term"}
              onChange={(value) =>
                dispatch(
                  setMethod({
                    method: value,
                    mode: 'api',
                    query_id: 'new',
                    subdomain: props.subdomain,
                  })
                )
              }
              options={methodOptions}
              placeholder="Select method"
              value={
                state?.method && Object.keys(state?.method).length
                  ? state.method
                  : null
              }
            />
          </div>
        </div>
      );
    }
    return null;
  }

  const renderAuthorization = () => {
    if (state?.method?.value) {
      return (
        <div className="query-pagination">
          <Button className="mr-1" color="falcon-primary" size="">
          Authorization
          </Button>
          <div className="query-pagination-select">
            <Select
              autoFocus
              classNamePrefix="react-select"
              hideSelectedOptions
              noOptionsMessage={() => "No options match the search term"}
              onChange={(value) =>
                dispatch(
                  setAuthorization({
                    authorization: value,
                    query_id: 'new',
                    subdomain: props.subdomain,
                  })
                )
              }
              options={authorizationOptions}
              placeholder="Select an option"
              value={state?.authorization || authorizationOptions[1]}
            />
          </div>
        </div>
      );
    }
    return null;
  }

  return(
    <Modal
      isOpen={state?.wizardModal}
      // backdrop='static' // prevents modal closing
      toggle={closeModal}
      size='md'
    >
      <ModalHeader className='modal-header clearfix'>
        API Wizard
      </ModalHeader>
      <ModalBody className='query-modal-sort-body'>
        {renderBase()}
        {renderMethod()}
        {renderAuthorization()}
      </ModalBody>
      <ModalFooter>
        <Button
          block
          color='falcon-success'
          disabled={!state?.method?.method}
          onClick={closeModal}
        >
          Start
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default WizardModal