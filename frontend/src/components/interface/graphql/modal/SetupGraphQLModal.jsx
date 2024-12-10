// React imports
import React, { useState } from "react";
import { toast } from "react-toastify";


// Library imports
import { faTimes, faArrowRight, faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  Spinner,
  ModalFooter
} from "reactstrap";
import CustomSelect from '../../../../components/common/CustomSelect'


const SetupRepo = ({ tableOptions, closeModal, modalState, handleSetupGraphQLModalClick }) => {

  const [selectedTableList, setSelectedTableList] = useState([])


  const addTable = tableObj => {

    let flag = true
    let err

    selectedTableList.forEach(table => {
      if (table.id === tableObj.id) {
        flag = false
        err = 'table already exists'
      }

    })
    if (flag) {
      setSelectedTableList([...selectedTableList, tableObj])
    } else {
      toast.warning(`${err}!`)
      console.warn(`${err}. Cannot add duplicate.`)
    }
  }

  const addAllTables = () => {

    const selectedTables = []
    tableOptions.forEach((item) => {
      selectedTables.push(...item.options)

    })
    setSelectedTableList(selectedTables)
  }


  const deleteTable = (tableIndex) => {

    setSelectedTableList(selectedTableList.slice(0, tableIndex).concat(selectedTableList.slice(tableIndex + 1, selectedTableList.length)))
  }
  const deleteAllTables = () => {

    setSelectedTableList([])
  }



  // Renders table list
  const renderTablesList = () => {
    // return <div> sdf</div>
    const list = []
    selectedTableList.forEach((element, index) => {
      list.push(
        <div
          className='query-modal-columns-vanilla-list-container-item'
          key={`${element.id}-${element.option}`}
        >
          <div className='query-modal-columns-vanilla-list-container-item-content'>
            <div className='query-modal-columns-vanilla-columns'>
              <div className='fake-input'>
                {element.tableName}
              </div>
            </div>

          </div>

          <Button
            className='ml-3'
            color={'falcon-danger'}

            onClick={() => deleteTable(index)}
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </div>
      )
    })
    return (
      <div className='query-modal-columns-vanilla-list mt-3'>
        <div className='query-modal-columns-vanilla-list-container'>
          {list}
        </div>
      </div>
    )
  }

  // Renders column selector
  const renderToolbar = () => {
    return (
      <div className='query-modal-columns-vanilla-content mt-3'>
        <div className='query-modal-columns-vanilla-columns'>
          <CustomSelect
            // defaultMenuIsOpen={true}
            noOptionsMessage={() => 'No columns match the search term'}
            onChange={addTable}
            // onChange={value => addTableToList(value)}
            options={tableOptions || []}
            placeholder='Select Column'
          // value={column}
          />
        </div>


        <>
          <div className='ml-3'>
            <Button
              color='falcon-primary'
              onClick={addAllTables}
              size=''
            >
              Select All <FontAwesomeIcon icon={faPlus} />
            </Button>
          </div>
          <div className='ml-3'>
            <Button
              color='falcon-danger'
              onClick={deleteAllTables}
              size=''
            >
              Unselect All <FontAwesomeIcon icon={faMinus} />
            </Button>
          </div>
        </>

      </div>
    )
  }
  const render = () => {
    if (!tableOptions) {
      return (<div className="loading-div">
        <Spinner
          className="loading-spinner"
          color="primary"
          type="grow"
        />
      </div>)

    } else {

      return (
        <>

          {renderToolbar()}
          {renderTablesList()}
        </>

      )
    }
  };

  return (
    <Modal
      className="query-modal-columns"
      isOpen={modalState}
      toggle={closeModal}
    // style={{ top: '6%' }}
    >
      <ModalHeader className="modal-header clearfix">
        <div className="float-left">Setup QraphQL</div>
        <Button
          className="float-right"
          color="falcon-danger"
          onClick={closeModal}
          size="sm"
        >
          <FontAwesomeIcon icon={faTimes} />
        </Button>
      </ModalHeader>


      <ModalBody className="query-modal-columns-body ">
        {render()}


      </ModalBody>
      <ModalFooter>
        <div className="query-modal-columns-vanilla-footer">
          <Button block color="falcon-danger" onClick={closeModal}>
            Close &nbsp;
            <FontAwesomeIcon icon={faTimes} />
          </Button>
          &nbsp;&nbsp;&nbsp;
          <Button
            block
            color="falcon-success"
            onClick={handleSetupGraphQLModalClick}
            disabled={false}
          >
            Next &nbsp;
            <FontAwesomeIcon icon={faArrowRight} />
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );

};

export default SetupRepo;
