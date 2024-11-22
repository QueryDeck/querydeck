import React, { useState, useMemo, memo } from 'react';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import SortMap from '../../../../helpers/SortMap';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import {  Button, } from 'reactstrap'

const Accordion = styled(props => <MuiAccordion disableGutters elevation={0} square {...props} />)(({ theme }) => ({
  marginLeft: theme.spacing(-1),
  '&:not(:last-child)': {
    borderBottom: 0
  },
  '&:before': {
    display: 'none'
  }
}));

const AccordionSummary = styled(props => (
  <MuiAccordionSummary expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />} {...props} />
))(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : 'rgba(0, 0, 0, 0.01)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)'
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1)
  }
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(0),
  paddingLeft: theme.spacing(1),
  borderTop: '1px solid rgba(0, 0, 0, .125)'
}));

const SchemaSideBar = props => {
  const { mapData, graphData, tableMapStore, setNodes ,saveTableMapData , style , loadAllTable ,clearAllTable} = props;
  /* eslint-disable-next-line */
  const finalSchemaList = useMemo(() => seperateDatabase(mapData), []);

  const TableRow = ({ rowData }) => {
    const [visible, setVisible] = useState(tableMapStore.selectedTableId[rowData.id]? false : true);

    function addTable(tableId) {
      if (tableMapStore.selectedTableId[tableId]) return;
      tableMapStore.selectedTableId[tableId] = true;

      let newNode = tableMapStore.nodes[tableMapStore.tableIdToIdx[tableId]];
      sortTableColumns( newNode )
      let resultGraphData = SortMap.addNode(graphData, newNode);

      setNodes([...resultGraphData.nodes]);
      setVisible(false);
      saveTableMapData();
    }

    function removeTable(tableId) {
      if (!tableMapStore.selectedTableId[tableId]) return;
      tableMapStore.selectedTableId[tableId] = false;

      let resultGraphData = SortMap.removeNode(graphData, tableMapStore.nodes[tableMapStore.tableIdToIdx[tableId]]);

      setNodes([...resultGraphData.nodes]);
      setVisible(true);
      saveTableMapData();
    }
    return (
      <>
        <div className="schema-sdbr-tab-row">
          <span className="sdbr-tab-row-tl">{rowData.tableName}</span>
          
          {visible ? (
            <IconButton
              sx={{ paddingTop: '1', paddingBottom: '1' ,marginRight: '5px',}}
              size="small"
              aria-label="add"
              onClick={e => addTable(rowData.id)}
            >
              <AddCircleOutlineIcon fontSize="10" />
            </IconButton>
          ) : (
            <IconButton
              sx={{ paddingTop: '1', paddingBottom: '1' ,marginRight: '5px', }}
              size="small"
              aria-label="add"
              onClick={e => removeTable(rowData.id)}
            >
              <RemoveCircleOutlineIcon fontSize="10" />
            </IconButton>
          )}
        </div>
      </>
    );
  };

  const SideBarDatabase = ({ database, schemaLength }) => {
    const [expanded, setExpanded] = React.useState(schemaLength === 1 ? true : false);

    const handleChange = e => {
      setExpanded(!expanded);
    };

    return (
      <Accordion expanded={expanded} onChange={handleChange}>
        <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
          {database.schemaName}
        </AccordionSummary>
        <AccordionDetails>
          {useMemo(
            () =>
              database.tables.map((item, index) => {
                return <TableRow rowData={item} key={item.id} />;
                /* eslint-disable-next-line */
              }),  []
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  function seperateDatabase(mapData) {
    // console.log('seperateDatabase');
    let schemaObj = {};
    let finalSchemaList = [];
    let pathSplit;
    for (let i = 0; i < mapData.tables.length; i++) {
      pathSplit = mapData.tables[i].text.split('.');
      if (!schemaObj[pathSplit[0]]) schemaObj[pathSplit[0]] = [];

      mapData.tables[i].tableName = pathSplit[1];
      schemaObj[pathSplit[0]].push(mapData.tables[i]);
    }
    let schemaObjKeys = Object.keys(schemaObj);
    schemaObjKeys.sort();

    for (let i = 0; i < schemaObjKeys.length; i++) {
      schemaObj[schemaObjKeys[i]].sort((a, b) => {
        return a.tableName < b.tableName ? -1 : +(a.tableName > b.tableName);
      });
      finalSchemaList.push({
        schemaName: schemaObjKeys[i],
        tables: schemaObj[schemaObjKeys[i]]
      });
    }

    return finalSchemaList;
  }

  return (
    <div className="schema-sdbr-main" style={style}>
        <div>

      {useMemo(() => {
        return finalSchemaList.map((database, index) => (
          <SideBarDatabase database={database} schemaLength={finalSchemaList.length} key={index} />
        ));
        /* eslint-disable-next-line */
      }, [])}
        </div>

      <div className="query-left-raw-query-buttons schema-sidebar-but-bx">
        <div className="schema-sidebar-but-block">
          <Button
            className="query-left-raw-query-button"
            color="falcon-primary"
            onClick={loadAllTable}
            // disabled={!(tabsList[selected Tab].db && localQuery[selectedTab]) || queryLoading}
          >
            Load All <AutoModeIcon fontSize="20" style={{ transform: 'translate(1px, -1px)' }} />
          </Button>
        </div>

        <div className="schema-sidebar-but-block">
          <Button className="query-left-raw-query-button" color="falcon-success" onClick={clearAllTable}>
            Clear All
            <CleaningServicesIcon fontSize="14" style={{ transform: 'translate(3px, -1px)' }} />
          </Button>
        </div>
      </div>
    </div>
  );
};


function sortTableColumns (node) {
  if (!node.data.isAlreadySorted) {
    node.data.isAlreadySorted = true;
    node.data.tableData.columns.sort((a, b) => {
      let _a = a.label.toLowerCase();
      let _b = b.label.toLowerCase();
      return _a < _b ? -1 : +(_a > _b);
    });
  }
}
export default memo(SchemaSideBar);
export { sortTableColumns }