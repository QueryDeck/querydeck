// React imports
import React, {
} from 'react'

import utils from '../../utils';
import global_constants from '../../global_constants';

import exportFromJSON from 'export-from-json'
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import {
  useGridApiContext,

} from '@mui/x-data-grid-pro'


/**
 *  
 */
const ExportButton = ({ exportData, fileName, ...rest }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const apiRef = useGridApiContext();

  const handleCsvBtnClick = () => {
    if (exportData.length) {
      let updatedData = utils.removeFieldsFromArrayOfObject(exportData, [global_constants.MUI_UNIQUE_COLUMN]);
      updatedData = utils.removeSchemaAndTableNameFromArrayOfObject(updatedData);
      exportFromJSON({
        data: updatedData,
        fileName: fileName,
        exportType: exportFromJSON.types.csv
      })
    }
    handleClose();
  }
  const handleExcelBtnClick = () => {

    if (exportData.length) {
      let updatedData = utils.removeFieldsFromArrayOfObject(exportData, [global_constants.MUI_UNIQUE_COLUMN]);
      updatedData = utils.removeSchemaAndTableNameFromArrayOfObject(updatedData);
      exportFromJSON({
        data: updatedData,
        fileName: fileName,
        exportType: exportFromJSON.types.xls
      })
    }

    handleClose();
  }

  const handlePrintBtnClick = () => {
    apiRef.current.exportDataAsPrint();
    handleClose();
  }




  return (
    <div {...rest}>
      <Button
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        startIcon={<FileDownloadOutlinedIcon />}
        size="small"
      >
        Export
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={handleCsvBtnClick}>Download as Csv</MenuItem>
        <MenuItem onClick={handleExcelBtnClick}>Download as Xls</MenuItem>
        <MenuItem onClick={handlePrintBtnClick}>Print </MenuItem>

      </Menu>
    </div>
  );
}

export default ExportButton;
