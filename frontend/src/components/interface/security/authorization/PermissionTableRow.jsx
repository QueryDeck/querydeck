// React imports
import React, { useState } from "react";


// import SetupAuthModal from "./SetupAuthModal";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
 
import { faPencilAlt  } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

 
const PermissionTableRow = ({
  tableName,
  tablePermission,
  handleTableCellClick,
}) => {
  if (!tablePermission) return null;
  const tablePermissionKeys = ["select", "insert", "update", "delete"];
  const permisssionValues = [];

  tablePermissionKeys.forEach((methodKey) => {
    permisssionValues.push(tablePermission[methodKey] || {});
  });

  const EditableCell = ({ cellDetail, method }) => {
    const [isMouseOver, setIsMouseOver] = useState(false);
    const onMouseEnter = () => {
      setIsMouseOver(true);
    };
    const onMouseLeave = () => {
      setIsMouseOver(false);
    };
    return (
      <td
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          cursor: "pointer",
          position: "relative",
          marginLeft: "10px",
          backgroundColor: isMouseOver ? "#f0f0f0" : "initial",
        }}
        onClick={() => handleTableCellClick(cellDetail, tableName, method)}
      >
        <span
          style={{
            transform: "translate(8px, 0px)",
            display: "inline-block",
          }}
        >
          {cellDetail.access_type === -1 ||
          cellDetail.access_type === undefined ? (
            <CloseIcon    sx={{color:'red'}} />
          ) : null}
          {cellDetail.access_type === 0 ? (
            <FilterAltIcon color="primary" />
          ) : null}
          {cellDetail.access_type === 1 ? <CheckIcon  sx={{color:'#0ece0e'}} /> : null}
        </span>
        <FontAwesomeIcon
          icon={faPencilAlt}
          style={{
            float: "right",
            position: "relative",
            top: "4px",

            visibility: isMouseOver ? "visible" : "hidden",
          }}
        />
      </td>
    );
  };
  return (
    <tr>
      <th scope="row" style={{ paddingLeft: 0, paddingRight: 0 }}>
        {tableName}
      </th>
      {}
      {permisssionValues.map((item, index) => {
        return (
          <EditableCell
            key={index}
            cellDetail={item}
            method={tablePermissionKeys[index]}
          />
        );
      })}
    </tr>
  );
};

export default PermissionTableRow;
