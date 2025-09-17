// React imports
import React, { useMemo } from 'react';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { setOldMethod } from '../../../../../lib/data/dataSlice';

// Library imports
import { Button } from 'reactstrap';
import Select from 'react-select';

const OldMethod = (props) => {
  // Redux
  const state = useSelector(
    (state) => state.data[props.mode][props.subdomain]?.[props.query_id]
  );
  const dispatch = useDispatch();
  const oldMethodOptions = useMemo(() => {
    const options = [
      {
        label: 'GET',
        value: 'GET',
      },
      {
        label: 'POST',
        value: 'POST',
      },
    
    ];
    if (state?.method?.value === 'update') {
      options.push({
        label: 'PUT',
        value: 'PUT',
      });
    }
    if (state?.method?.value === 'delete') {
      options.push({
        label: 'DELETE',
        value: 'DELETE',
      });
    }
    return options;
  }, [state?.base?.value]);

  if (state?.base?.value) {
    return (
      <div className='query-method' id='tour_api-left-method'>
        <Button className='mr-1' color='falcon-primary' size=''>
          Method
        </Button>
        <div className='query-method-select'>
          <Select
            classNamePrefix='react-select'
            hideSelectedOptions
            isDisabled={props.query_id !== 'new' || state?.method?.value === 'select_id' || state?.method?.value === 'insert' || state?.method?.value === 'update' || state?.method?.value === 'delete' }
            noOptionsMessage={() => 'No methods match the search term'}
            onChange={(value) =>
              dispatch(
                setOldMethod({
                  oldMethod: value,
                  mode: props.mode,
                  query_id: props.query_id,
                  subdomain: props.subdomain,
                })
              )
            }
            options={oldMethodOptions}
            placeholder='Select method'
            value={
              state?.oldMethod && Object.keys(state?.oldMethod).length
                ? state.oldMethod
                : null
            }
          />
        </div>
      </div>
    );
  }
  return null;
};

export default OldMethod;
