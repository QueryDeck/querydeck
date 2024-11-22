// React imports
import React, { useMemo } from 'react';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { setMethod } from '../../../../../lib/data/dataSlice';

// Library imports
import { Button } from 'reactstrap';
import Select from 'react-select';

const Method = (props) => {
  // Redux
  const state = useSelector(
    (state) => state.data[props.mode][props.subdomain]?.[props.query_id]
  );
  const dispatch = useDispatch();
  const methodOptions = useMemo(() => {
    const options = [
      {
        label: 'Select',
        method: 'GET',
        value: 'select',
      },
      {
        label: 'Insert/Upsert',
        method: 'POST',
        value: 'insert',
      },
    ];
    if (state?.base?.primaryKeyCols?.length && state?.base?.hasSingleId ) {
      options.push({
        label: 'Select by ID',
        method: 'GET',
        value: 'select_id',
      })
      options.push({
        label: 'Update',
        method: 'PUT',
        value: 'update',
      });
      options.push({
        label: 'Delete',
        method: 'DELETE',
        value: 'delete',
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
            autoFocus
            classNamePrefix='react-select'
            defaultMenuIsOpen={
              props.query_id === 'new' &&
              !(state?.method && Object.keys(state?.method).length)
            }
            hideSelectedOptions
            isDisabled={props.query_id !== 'new'}
            noOptionsMessage={() => 'No methods match the search term'}
            onChange={(value) =>
              dispatch(
                setMethod({
                  method: value,
                  mode: props.mode,
                  query_id: props.query_id,
                  subdomain: props.subdomain,
                })
              )
            }
            options={methodOptions}
            placeholder='Select method'
            value={
              state?.method && Object.keys(state?.method).length
                ? state.method
                : null
            }
          />
        </div>
      </div>
    );
  }
  return null;
};

export default Method;
