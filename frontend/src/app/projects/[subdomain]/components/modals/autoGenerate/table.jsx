// React imports
import React, { useEffect } from "react";
import api from "../../../../../../api";
import { useHistory } from "react-router-dom";

// Redux
import { useDispatch, useSelector } from "react-redux";
import {
  updateAutoGenerateModalStep,
  updateAutoGenerateTable,
  closeAutoGenerateModal,
} from "../../../../../../lib/data/dataSlice";

// Library imports
import {
  faMinus,
  faPlus,
  faSave,
  // faTable,
  faTimes,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ModalBody, ModalFooter } from "reactstrap";
import { toast } from "react-toastify";

// Components
import CustomSelect from "../../../../../../components/common/CustomSelect";
let autoGenApiController;

const Table = (props) => {
  // Redux
  const state = useSelector(
    (state) => state.data[props.mode][props.subdomain]?.[props.query_id]
  );

  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    autoGenApiController = new AbortController();
    return () => {
      autoGenApiController.abort();
    };
  }, []);
  useEffect(() => {
    if (props.tableOptions?.length && !state?.autoGenerate?.tables?.length) {
      addAllTables();
    }
  }, [props.tableOptions]);

  ///// Network requests /////
  const catchError = (error) => {
    if (error.response) {
      if (error.response.data.meta.status === 403) {
        toast.warning(`Please login again`);
        dispatch({ type: 'RESET' })
        history.push(`/auth/login?redirect=/apps/${props.subdomain}/api/new`);
      } else if (error.response.data.meta.status === 400) {
        toast.error("Error 400 | Bad Request");
      } else if (error.response.data.meta.status === 404) {
        toast.error("Error 404 | Not Found");
      } else if (error.response.data.meta.status === 500) {
        toast.error("Error 500 | Internal Server Error");
      } else {
        toast.error("Something went wrong");
      }
    } else {
      console.error(error);
    }
  };
  // Adds   table  to list
  const addToList = (value) => {
    const tables = [];
    if (state?.autoGenerate?.tables?.length) {
      tables.push(...state.autoGenerate.tables);
    }

    if (tables.find((item) => item.value === value.value)) {
      toast.warn("Table already selected");
      return;
    }
    tables.push({ ...value });
    dispatch(
      updateAutoGenerateTable({
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain,
        tables,
      })
    );
  };

  // Removes table  from list
  const removeFromList = (column) => {
    const tables = [];
    if (state?.autoGenerate?.tables?.length) {
      tables.push(...state.autoGenerate.tables);
    }
    let columnIndex;
    for (let i = 0; i < tables.length; i++) {
      if (tables[i].value === column.value) {
        columnIndex = i;
        break;
      }
    }
    tables.splice(columnIndex, 1);
    dispatch(
      updateAutoGenerateTable({
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain,
        tables,
      })
    );
  };

  const addAllTables = () => {
    const allTables = [];
    props.tableOptions.forEach((schema) => {
      allTables.push(...schema.options);
    });
    dispatch(
      updateAutoGenerateTable({
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain,
        tables: allTables,
      })
    );
  };
  const removeAllMethods = () => {
    dispatch(
      updateAutoGenerateTable({
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain,
        tables: [],
      })
    );
  };

  const updateAutoGenerateStep = () => {
    dispatch(
      updateAutoGenerateModalStep({
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain,
        autoGenerateModalStep: 1,
      })
    );
  };

  // Renders column selector
  const renderToolbar = () => {
    return (
      <div className="query-modal-columns-vanilla-content mt-3">
        <div className="query-modal-columns-vanilla-columns">
          <CustomSelect
            // defaultMenuIsOpen={true}
            noOptionsMessage={() => "No columns match the search term"}
            // onChange={value => setColumn(value)}
            onChange={(value) => addToList(value)}
            options={props.tableOptions}
            placeholder="Select Tables"
            // value={column}
          />
        </div>

        {props.mode === "api" ? (
          <>
            <div className="ml-3">
              <Button color="falcon-primary" onClick={addAllTables} size="">
                Select All <FontAwesomeIcon icon={faPlus} />
              </Button>
            </div>
            <div className="ml-3">
              <Button color="falcon-danger" onClick={removeAllMethods} size="">
                Unselect All <FontAwesomeIcon icon={faMinus} />
              </Button>
            </div>
          </>
        ) : (
          ""
        )}
      </div>
    );
  };

  // Renders table list
  const renderList = () => {
    const list = [];
    if (state?.autoGenerate?.tables?.length) {
      state.autoGenerate.tables.forEach((element) => {
        list.push(
          <div
            className="query-modal-columns-vanilla-list-container-item"
            key={`${element.label}-${element.value}`}
          >
            <div className="query-modal-columns-vanilla-list-container-item-content">
              <div className="query-modal-columns-vanilla-columns">
                <div className="fake-input">
                  {element.tableFullName || element.label}
                </div>
              </div>
            </div>

            <Button
              className="ml-3"
              color={"falcon-default"}
              // disabled={state?.method?.value === 'insert' && element.forceRequired}
              onClick={() => removeFromList(element)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          </div>
        );
      });
    }
    return (
      <div className="query-modal-columns-vanilla-list mt-3">
        <div className="query-modal-columns-vanilla-list-container">{list}</div>
      </div>
    );
  };

  const handleGenerate = async () => {
    try {
      const requestBody = {
        allowed_tables: state.autoGenerate.tables.map((item) =>
          parseInt(item.value)
        ),
        allowed_methods: state.autoGenerate.methods.map((item) => item.value),
        subdomain: props.subdomain,
      };
      await api.post("/apps/auto-gen-api", requestBody, {
        signal: autoGenApiController.signal,
      });
      toast.success(`Api Generated Successfully`);
      history.push(`/apps/${props.subdomain}/api`);

      dispatch(
        closeAutoGenerateModal({
          mode: props.mode,
          query_id: props.query_id,
          subdomain: props.subdomain,
        })
      );
    } catch (error) {
      catchError(error);
    }
  };

  return (
    <>
      <ModalBody className="query-modal-columns-body">
        {/* {renderTabs()} */}
        {renderToolbar()}
        {renderList()}
      </ModalBody>
      <ModalFooter>
        <div className="query-modal-columns-vanilla-footer">
          <Button block color="falcon-danger" onClick={updateAutoGenerateStep}>
            <FontAwesomeIcon icon={faArrowLeft} />
            &nbsp;Back
          </Button>
          &nbsp;&nbsp;&nbsp;
          <Button
            block
            color="falcon-success"
            onClick={handleGenerate}
            disabled={!Boolean(state?.autoGenerate?.tables?.length)}
          >
            Generate &nbsp;
            <FontAwesomeIcon icon={faSave} />
          </Button>
        </div>
      </ModalFooter>
    </>
  );
};

export default Table;
