// React imports
import React, { useState } from 'react'
import Select from 'react-select'




function CustomSelect(props) {

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
        <Select
            {...props}
            classNamePrefix='react-select'
            hideSelectedOptions
            onChange={handleOnChange}
            inputValue={input}
            onInputChange={handleOnInputChange}

        />
    );
}

export default CustomSelect

