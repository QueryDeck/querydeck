// React imports
import React, { useEffect ,useState } from "react";
import { useHistory } from 'react-router-dom'

// Redux
import { useDispatch, useSelector } from "react-redux";
import { closeAutoGenerateModal } from "../../../../../../lib/data/dataSlice";

// Library imports
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  Spinner,
} from "reactstrap";
// Library imports
import Cookies from 'js-cookie'
import { toast } from 'react-toastify'
import api from '../../../../../../api'

// Components
import MethodSection from "./method";
import TableSection from "./table";

let databasesController ;
let tablesController; 

const AutoGenerate = (props) => {
  // Redux
  const state = useSelector(
    (state) => state.data[props.mode][props.subdomain]
  );
  const dispatch = useDispatch();
  const [tableOptions , setTableOptions] = useState( null)
  const history = useHistory()
    useEffect(() => {

      databasesController = new AbortController()
      tablesController = new AbortController()

      return () => {
        databasesController.abort()
        tablesController.abort()
     
      }
    }, [])

    useEffect(() => {

      if(state?.autoGen?.autoGenerateModal && !tableOptions) { 
        loadTables(); 
      }
    }, [state?.autoGen?.autoGenerateModal])


  ///// Network requests /////
  const catchError = error => {
    if(error.response) {
      if(error.response.data.meta.status === 403) {
        Cookies.remove('session')
        toast.warning(`Please login again`)
        dispatch({ type: 'RESET' })
        history.push(`/auth/login?redirect=/apps/${props.subdomain}/api`)
      } else if(error.response.data.meta.status === 400) {
        toast.error('Error 400 | Bad Request')
      } else if(error.response.data.meta.status === 404) {
        toast.error('Error 404 | Not Found')
      } else if(error.response.data.meta.status === 500) {
        toast.error('Error 500 | Internal Server Error')
      } else {
        toast.error('Something went wrong')
      }
    } else {
      console.error(error)
    }
  }

    // Databases List
    const getDatabases = async () => {
      try {
        const response = await api.get('/databases', {
          params: {
            subdomain: props.subdomain
          },
          signal: databasesController.signal
        })
        const data = response.data.data
        return  data.databases[0].db_id ; 
    
        // }
      } catch (error) {
        catchError(error)
        return null ; 
      }

    }

    // Base Tables List
    const getTables = async () => {
      try {
        const dbId = await getDatabases( ); 
        if(!dbId)  { 
          console.error('no dbId ')
          return
        } ; 
        const response = await api.get('/apps/editor/controllers/ops', {
          params: {
            db_id: dbId,
            subdomain: props.subdomain
          },
          signal: tablesController.signal
        })
        const data = response.data.data
        return data.tables 
      } catch (error) {
        catchError(error)
      }
    }

  const loadTables = async ()=> { 
    
    const localSchemaHash = {};
    let  tables = await getTables() ; 
    tables.forEach((table) => {
      const schemaName = table.text.split(".")[0];
      if (localSchemaHash[schemaName]) {
        localSchemaHash[schemaName].push({
          label: table.text
            .split(".")
            .slice(1, table.text.split(".").length)
            .join("."),
          value: table.id,
          tableFullName: table.text,
        });
      } else {
        localSchemaHash[schemaName] = [
          {
            label: table.text
              .split(".")
              .slice(1, table.text.split(".").length)
              .join("."),
            value: table.id,
            tableFullName: table.text,
          },
        ];
      }
    });
    let result =  Object.keys(localSchemaHash).map((table) => ({
      label: table,
      options: localSchemaHash[table],
    }));
    // console.log( 'table options ', result)
    setTableOptions(result); 

}

  const closeModal = () =>
    dispatch(
      closeAutoGenerateModal({
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain,
      })
    );

  const renderBody = () => {
    if (state?.autoGen?.autoGenerateModalStep === 1) {
      return (
        <MethodSection
          closeModal={closeModal}
          mode={props.mode}
          query_id={props.query_id}
          subdomain={props.subdomain}
        />
      );
    } else if (state?.autoGen?.autoGenerateModalStep === 2 && tableOptions  ) {
      return (
        <TableSection
          closeModal={closeModal}
          mode={props.mode}
          query_id={props.query_id}
          subdomain={props.subdomain}
          tableOptions={tableOptions}
          onGenerateSuccess={props.onGenerateSuccess}
        />
      );
    } else {
      return (
        <>
          <ModalBody className="query-modal-columns-body">
            <div className="loading-div">
              <Spinner
                className="loading-spinner"
                color="primary"
                type="grow"
              />
            </div>
          </ModalBody>
        </>
      );
    }
  };

 
    return (
      <Modal
        className="query-modal-columns"
        isOpen={Boolean(state?.autoGen?.autoGenerateModal)}
        toggle={closeModal}
      >
        <ModalHeader className="modal-header clearfix">
          <div className="float-left">Bulk Create Endpoints</div>
          <Button
            className="float-right"
            color="falcon-danger"
            onClick={closeModal}
            size="sm"
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </ModalHeader>
        {renderBody()}
      </Modal>
    );

};

export default AutoGenerate;
