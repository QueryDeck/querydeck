// React imports
import React, { useEffect } from "react";

// Redux
import { useDispatch, useSelector } from "react-redux";
import {
  updateAutoGenerateMethod,
  updateAutoGenerateModalStep,
} from "../../../../../../lib/data/dataSlice";

// Library imports
import {
  faMinus,
  faPlus,
  // faTable,
  faTimes,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ModalBody, ModalFooter, Badge } from "reactstrap";
import { toast } from "react-toastify";
import styles from './autoGenerate.module.scss'
// Components
import CustomSelect from "../../../../../../components/common/CustomSelect";
const METHOD_OPTIONS = [
  {
    label: "Select",
    value: "GET",
    method: "GET"
  },
  {
    label: "Select by ID",
    value: "GET_BY_ID",
    method: "GET"
  },
  {
    label: "Insert/Upsert",
    value: "POST",
    method: "POST"
  },
  {
    label: "Update",
    value: "PUT",
    method: "PUT"
  },
  {
    label: "Delete",
    value: "DELETE",
    method: "DELETE"
  }
];


const getBadgeData = (method) => {
  if (method.toLowerCase() === 'post') {
    return ({
      badge: styles.badge_success,
    })
  } else if (method.toLowerCase() === 'put') {
    return ({
      badge: styles.badge_warning,
    })
  } else if (method.toLowerCase() === 'delete') {
    return ({
      badge: styles.badge_danger,
    })
  } else {
    return ({
      badge: styles.badge_primary,
    })
  }
}


const Method = (props) => {
  // Redux
  const state = useSelector(
    (state) => state.data[props.mode][props.subdomain].autoGen || {}
  );
  const dispatch = useDispatch();

  useEffect(() => {
    if (!state?.autoGenerate?.methods?.length) {
      addAllMethods();
    }
  }, []);

  // Adds   methods  to list
  const addMethodToList = (value) => {
    const methods = [];
    if (state?.autoGenerate?.methods?.length) {
      methods.push(...state.autoGenerate.methods);
    }

    if (methods.find((item) => item.value === value.value)) {
      toast.warn("Method already selected");
      return;
    }
    methods.push({ ...value });

    dispatch(
      updateAutoGenerateMethod({
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain,
        methods,
      })
    );
  };

  // Removes method  from list
  const removeMethodFromList = (column) => {
    const methods = [];
    if (state?.autoGenerate?.methods?.length) {
      methods.push(...state.autoGenerate.methods);
    }
    let columnIndex;
    for (let i = 0; i < methods.length; i++) {
      if (methods[i].value === column.value) {
        columnIndex = i;
        break;
      }
    }
    methods.splice(columnIndex, 1);
    dispatch(
      updateAutoGenerateMethod({
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain,
        methods,
      })
    );
  };

  const addAllMethods = () => {
    dispatch(
      updateAutoGenerateMethod({
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain,
        methods: METHOD_OPTIONS,
      })
    );
  };
  const removeAllMethods = () => {
    dispatch(
      updateAutoGenerateMethod({
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain,
        methods: [],
      })
    );
  };

  const updateAutoGenerateStep = () => {
    dispatch(
      updateAutoGenerateModalStep({
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain,
        autoGenerateModalStep: 2,
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
            onChange={(value) => addMethodToList(value)}
            options={METHOD_OPTIONS}
            placeholder="Select Method"
          // value={column}
          />
        </div>

        {props.mode === "api" ? (
          <>
            <div className="ml-3">
              <Button color="falcon-primary" onClick={addAllMethods} size="">
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

  // Renders method list
  const renderMethodList = () => {
    const list = [];

    if (state?.autoGenerate?.methods?.length) {
      state.autoGenerate.methods.forEach((element) => {
        const badgeData = getBadgeData(element.method)
        list.push(
          <div
            className="query-modal-columns-vanilla-list-container-item"
            key={`${element.label}-${element.value}`}
          >
            <div className="query-modal-columns-vanilla-list-container-item-content">
              <div className="query-modal-columns-vanilla-columns">
                <div className="fake-input">
                  <span> {element.label}</span>

                  <span className={styles.badge_container}>
                    <Badge className={badgeData?.badge}>
                      {element.method}
                    </Badge>
                  </span>
                </div>
              </div>
 
            </div>

            <Button
              className="ml-3"
              color={"falcon-default"}
              // disabled={state?.method?.value === 'insert' && element.forceRequired}
              onClick={() => removeMethodFromList(element)}
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

  return (
    <>
      <ModalBody className="query-modal-columns-body">
        {/* {renderTabs()} */}
        {renderToolbar()}
        {renderMethodList()}
      </ModalBody>
      <ModalFooter>
        <div className="query-modal-columns-vanilla-footer">
          <Button block color="falcon-danger" onClick={props.closeModal}>
            Close &nbsp;
            <FontAwesomeIcon icon={faTimes} />
          </Button>
          &nbsp;&nbsp;&nbsp;
          <Button
            block
            color="falcon-success"
            onClick={updateAutoGenerateStep}
            disabled={!Boolean(state?.autoGenerate?.methods?.length)}
          >
            Next &nbsp;
            <FontAwesomeIcon icon={faArrowRight} />
          </Button>
        </div>
      </ModalFooter>
    </>
  );
};

export default Method;
