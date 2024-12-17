// React imports
import React   from "react";
// Redux
import { useDispatch  } from "react-redux";
import {
  openAutoGenerateModal,
} from "../../../../../../lib/data/dataSlice";
import {
  faCartPlus,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// Library imports
import {
  Button
} from "reactstrap";



const AutoGenrateButton = (props) => {
  const dispatch = useDispatch();

  const handleAutoGenrateClick = () => {
    dispatch(
      openAutoGenerateModal({
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain,
        autoGenerateModal: true ,

      })
    );
  };
  return (
 
      <Button
        title="Click to Auto Generate Endpoints"
        onClick={handleAutoGenrateClick}
        size="sm"
          color='falcon-danger'
      >
          <FontAwesomeIcon icon={faCartPlus} /> Bulk Create
      </Button>
 
  );
};

export default AutoGenrateButton; 