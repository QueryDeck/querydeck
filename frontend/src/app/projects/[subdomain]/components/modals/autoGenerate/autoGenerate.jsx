// React imports
import React, { useMemo } from "react";

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

// Components
import MethodSection from "./method";
import TableSection from "./table";

const AutoGenerate = (props) => {
  // Redux
  const state = useSelector(
    (state) => state.data[props.mode][props.subdomain]?.[props.query_id]
  );
  const dispatch = useDispatch();

  const tableOptions = useMemo(() => {
    const localSchemaHash = {};
    // eslint-disable-next-line
    state?.tables.forEach((table) => {
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
    return Object.keys(localSchemaHash).map((table) => ({
      label: table,
      options: localSchemaHash[table],
    }));
  }, [state?.tables]);
  const closeModal = () =>
    dispatch(
      closeAutoGenerateModal({
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain,
      })
    );

  const renderBody = () => {
 
    if (state?.autoGenerateModalStep === 1) {
      return (
        <MethodSection
          closeModal={closeModal}
          mode={props.mode}
          query_id={props.query_id}
          subdomain={props.subdomain}
        />
      );
    } else if (state?.autoGenerateModalStep === 2) {
      return (
        <TableSection
          closeModal={closeModal}
          mode={props.mode}
          query_id={props.query_id}
          subdomain={props.subdomain}
          tableOptions={tableOptions}
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

 
  if (state?.database?.value) {
    return (
      <Modal
        className="query-modal-columns"
        isOpen={Boolean(state.autoGenerateModal)}
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
  }
  return null;
};

export default AutoGenerate;
