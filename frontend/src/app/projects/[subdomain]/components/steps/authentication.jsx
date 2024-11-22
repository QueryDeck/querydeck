// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { setAuthentication } from '../../../../../lib/data/dataSlice'

// Library imports
import { Button } from 'reactstrap'
import Select from 'react-select'

const Authentication = (props) => {
  // Redux
  const state = useSelector(
    (state) => state.data.api[props.subdomain]?.[props.query_id]
  );
  const dispatch = useDispatch();

  const authenticationOptions = [
    {
      label: "Enabled",
      value: true,
    },
    {
      label: "Disabled",
      value: false,
    },
  ]

  if (state?.method?.value) {
    return (
      <div className="query-pagination">
        <Button className="mr-1" color="falcon-primary" size="">
        Authentication
        </Button>
        <div className="query-pagination-select">
          <Select
            autoFocus
            classNamePrefix="react-select"
            hideSelectedOptions
            isDisabled={!state?.authenticationEnabled || !Object.keys(state?.appAuth).length}
            noOptionsMessage={() => "No options match the search term"}
            onChange={(value) =>
              dispatch(
                setAuthentication({
                  authentication: value,
                  query_id: props.query_id,
                  subdomain: props.subdomain,
                })
              )
            }
            options={authenticationOptions}
            placeholder="Select an option"
            value={ state?.authentication || authenticationOptions[1]}
          />
        </div>
      </div>
    );
  }
  return null;
};

export default Authentication;
