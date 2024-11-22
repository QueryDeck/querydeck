import React, { useState, useRef } from "react";

// Library imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";

import { Button, Input, } from "reactstrap";

// API

const EditableTextArea = (props) => {
    const { onChange, placeholder, value, readOnly} = props;
    const [isMouseInside, setIsMouseInside] = useState(false)
    const [editMode, setEditMode] = useState(false)

    const inputRef = useRef(null);

    const handleEditOpen = () => {
        setEditMode(true);
        setTimeout(() => {
            inputRef?.current?.focus && inputRef.current.focus();
        }, 1)
    };



    const handleMouseLeave = () => {
        setIsMouseInside(false);
    };

    const handleFocusOut = () => {

        if (!isMouseInside) {

            setEditMode(false);
        }
    };

    const handleMouseEnter = () => {

        setIsMouseInside(true);

    };

    return <>

        <span style={{ position: "relative", display: "block" }} onMouseLeave={handleMouseLeave} onMouseEnter={handleMouseEnter} onBlur={handleFocusOut}>

            <Input
                className="list-card-textarea"
                onChange={onChange}
                placeholder={placeholder}
                type="textarea"
                disabled={!editMode}
                value={editMode ? value : value?.replace(/./gi, '*')}
                readOnly={readOnly}
                innerRef={inputRef}
            />
            <span style={{ position: "absolute", right: "7px", top: "7px", display: isMouseInside && !editMode ? 'inline-block' : 'none' }}>
                <Button
                    color='falcon-danger'
                    onClick={handleEditOpen}
                >
                    <FontAwesomeIcon icon={faEye} />

                </Button>
            </span>

        </span>

    </>
}

export default EditableTextArea;
