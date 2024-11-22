// React imports
import React   from "react";
// Redux
import { useDispatch  } from "react-redux";
import {
  openAutoGenerateModal,
} from "../../../../../../lib/data/dataSlice";

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
    <div className="api-auto-gen-bx">
      <Button
        title="Click to Auto Generate Endpoints"
        onClick={handleAutoGenrateClick}
        size="sm"
      >
        Auto Generate API
      </Button>
    </div>
  );
};

export default AutoGenrateButton; 