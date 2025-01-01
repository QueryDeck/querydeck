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



const AutoGenerateButton = (props) => {
  const dispatch = useDispatch();

  const handleAutoGenrateClick = () => {
    dispatch(
      openAutoGenerateModal({
        mode: props.mode,
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
      color='falcon-primary'
    >
      <FontAwesomeIcon icon={faCartPlus} /> Bulk Create
    </Button>
  );
};

export default AutoGenerateButton; 