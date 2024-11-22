import React, { useState } from 'react'
import AsyncSelect from 'react-select/async'



function CustomSelectAsync(props) {

    const [input, setInput] = useState("");

    const handleOnChange = (value, action,) => {
        setInput("");
        props.onChange && props.onChange(value, action)
    }

    const handleOnInputChange = (value, action) => {
        if (action.action === "input-change") {
            setInput(value)
            if (props.value) {
                props.onChange && props.onChange(null, action)
            }
        }
        props.onInputChange && props.onInputChange(value, action)
    }


    return (
        <AsyncSelect
            {...props}
            classNamePrefix='react-select'
            onChange={handleOnChange}
            inputValue={input}
            onInputChange={handleOnInputChange}

        />
    );
}

export default CustomSelectAsync

