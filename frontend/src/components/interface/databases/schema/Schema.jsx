import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { useHistory } from 'react-router-dom';
import api from '../../../../api';
import SchemaSideBar , { sortTableColumns } from './SchemaSideBar';
import { Spinner } from 'reactstrap';
import TableNode, { ColumnNode } from './SchemaNode';
import SortMap from '../../../../helpers/SortMap';
import { useResizable } from '@ag_meq/rrl'

// Redux
import { useDispatch } from 'react-redux'

import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  // ControlButton,
  MarkerType
  // isNode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { toast } from 'react-toastify';

let tableMapStore = {
  // mapData : null , // store response data
  schemaSideBarKey : 0,  // key for schemaSideBar component to render it when necessary
  selectedTableId: {}, // store  all table Id's which are selected
  prevSelectedEdgeIdx: null,
  tableIdToIdx: {}, // table id to table array index
  columnIdToIdx: {}, // table column id to table column array index
  // edgeIdToIdx : {}    ,       // edges id to edge array index
  edges: [], // formatted eges
  nodes: [] // formatted nodes
};

const LOADING_ELEMENT = (
  <div className="loading-div">
    <Spinner className="loading-spinner" color="primary" type="grow" />
  </div>
);
const nodeTypes = { TableNode, ColumnNode };
// ReactFlow Map at 'apps/app-id/dashboards/dashboard-id/map/flow'
const Schema = props => {
  // Redux
  const reduxDispatch = useDispatch()

  // return null
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstanceRef = useRef();

  // Props
  const { appid, db_id, data, tabId } = props;
  const [loading, setLoading] = useState(false);
  const [mapData, setMapData] = useState(null);
  const history = useHistory();
  // const location = useLocation();

  useEffect(() => {
    if (data) {
      getTableMapData() ; //get saved session data
      setMapData(data);
      renderData(data);
    } else {
      getData(); // get data and then render
    }

    return clearPageData; // remove all stored data  ;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // call fitview() on tab first click
    window.requestAnimationFrame(() => {
      // fitViewTable();
    });
  }, [nodes, edges]);

      // Handles positioning the separator between LHS/RHS
      const {   position, separatorProps } = useResizable({
        axis: 'x',
        initial: Math.max(280, (window.innerWidth - 4 - 4)/5.5),
        max: Math.min((window.innerWidth - 4 - 4) - 400, 3*(window.innerWidth - 4 - 4)/5),
        min: 180,
    })

  function clearPageData() {
    //  set all variable to  initial  values   ;
    tableMapStore = {
      schemaSideBarKey: 0 ,
      selectedTableId: {},
      prevSelectedEdgeIdx: null,
      tableIdToIdx: {}, // table id to table array index
      columnIdToIdx: {}, // table column id to table column array index
      // edgeIdToIdx : {}    ,       // edges id to edge array index
      edges: [],
      nodes: []
    };
  }

  function fitViewTable() {
    if (tabId === 2 && reactFlowInstanceRef?.current?.reactFlowInstance?.fitView) {
      if (reactFlowInstanceRef.current.fitVeiwCount === 0 || true) {
        setTimeout(reactFlowInstanceRef.current.reactFlowInstance.fitView);
        reactFlowInstanceRef.current.fitVeiwCount = 1;
      }
    }
  }

  function getMinWidth(tableLength, columns) {
    for (let i = 0; i < columns.length; i++) {
      if (tableLength < columns[i].label.length) tableLength = columns[i].label.length;
    }
    return tableLength;
  }

  function addSouceAndTargetEdge(data) {
    /*  add  fields 'isSource' and 'isTarget' to every columns  */

    let tableIdToIdx = {};

    for (let i = 0; i < data.tables.length; i++) {
      tableIdToIdx[data.tables[i].id] = i;
    }

    for (let i = 0; i < data.rels.length; i++) {
      let sourceColumns = data.tables[tableIdToIdx[data.rels[i].from]].columns || [];
      let targetColumns = data.tables[tableIdToIdx[data.rels[i].to]].columns || [];

      for (let j = 0; j < sourceColumns.length; j++) {
        if (sourceColumns[j].id === data.rels[i].fromPort) {
          sourceColumns[j].isSource = true;
          sourceColumns[j].foreign = true;
          break;
        }
      }

      for (let j = 0; j < targetColumns.length; j++) {
        if (targetColumns[j].id === data.rels[i].toPort) {
          targetColumns[j].isTarget = true;
          break;
        }
      }
    }
  }

  function formatData(data) {
    // console.log(data)
    let resultData = { nodes: [], edges: [] };

    addSouceAndTargetEdge(data);
    // let prevMinWidthOfTableBox =0;
    // let iconStyle = {position:'absolute',left: "5px",
    // top: "6px",fontSize: "10px"}
    const isTableIdToIdxAlreadySet = Object.keys(tableMapStore.tableIdToIdx).length ? true : false;
    data.tables.map((table, index) => {
      // if( table.ref_in_count< 1 ){
      //     return ;
      // } ;
      const minWidthOfTableBox = getMinWidth(table.text.length, table.columns) * 10 + 50;
      const minHeightOfTableBox = 35 * 1 * (table.columns.length + 1);
      const isHidden = table.ref_out_count < 0 ? true : false;
      // const isExpanded  =     !isHidden;
      // prevMinWidthOfTableBox =
      // console.log( 'minWidthOfTableBox ===' + minWidthOfTableBox)

      // ################# TABLES NODES #########################

      resultData.nodes.push({
        id: table.id.toString(), // accept only string
        position: { x: (index * 210 + 10) % 1000, y: index * 120 },
        hidden: isHidden,
        // isExpanded:isExpanded ,
        data: {
          label: table.text,
          tableData: table
        },
        type: 'TableNode',
        // zIndex: 10000,
        elkjsData: {
          // height  and width of table
          width: minWidthOfTableBox * 2 + index * 3,
          height: minHeightOfTableBox * 1
        },

        style: {
          display: 'block',
          // minHeight: 45 * table.col_count + 20 + "px ",
          //    border:'2px solid black',
          border: '1px solid #392b2b57',
          boxShadow: 'rgb(0 0 0 / 11%) 5px 5px 6px 2px',
          //    borderRadius: '10px',
          position: 'absolute',
          minWidth: minWidthOfTableBox + 'px',

          // zIndex: 100000,
          backgroundColor: 'white'
        }
        // type: 'ColumnNode'
      });
      if (!isTableIdToIdxAlreadySet) {
        tableMapStore.tableIdToIdx[table.id] = resultData.nodes.length - 1; // store table element postion
      }

      // return ;
      // ############# Table Columns nodes #######################
      table.columns.map((column, child_index) => {
        // console.log(column)
        column.columnId = table.id + '.' + column.id;

        column.position = { top: index * 42 + 33 };
        column.index = child_index;
        column.foreign = column.foreign || false;
        // return
        return null;
        // function getMinWidt
        /* columnId : "1233.1" default : null id : 1 label : "sector_name" not_null : "false" primary : false type : "varcha */
        /*       resultData.nodes.push({
                    id: column.columnId ,
                    position: { x: 0, y: child_index * 42 + 33   },
                    data: {
                        // label:  column.label , 
                        label: <span> {(column.primary || true ? <span style={{
                            position: 'absolute', left: "10px",
                            top: "6px", fontSize: "10px",
                            // zIndex: 1000000,
                        }}>  {getColumnIcon(column)}    </span> : <span  >  </span>)}   {column.label}</span>,

                        columnData: column
                    },
                    hidden :isHidden,
                    parentNode: table.id.toString(), // accept only string
                    extent: "parent",
                    draggable: false,
                    // type: 'TableNode',
                    type: 'ColumnNode',
                    // className: 'custom-table-column-node'
                    // zIndex: 333200010,
                    // zIndex: 1000,
               
                    style: {
                        // minWidth :  Math.max( column.label.length , table.text.length )*12 +  'px' ,
                        minWidth: minWidthOfTableBox - 5 + 'px',
                        // height:42,
                        cursor: 'default',
                        paddingLeft: '10px',
                        borderBottom: child_index < table.columns.length - 1 ? '1px solid rgb(205 214 221)' : 'none',
                        // border: child_index < table.columns.length - 1 ? '1px solid blue' : 'none',
                        left: '3px',
                        // zIndex: 333200010,
                        // backgroundColor: nodes[resultData.nodes.length]? nodes[resultData.nodes.length].style.backgroundColor:  'white',

                        // display:'none',
                        //  marginTop:39,
                        //  paddingLeft:10,
                        // border:'22px solid blue !importa' , BackgroundColor:'transparent'
                    }
                    // type: "input",

                }
                tableMapStore.columnIdToIdx[column.columnId] = resultData.nodes.length - 1  // store table  column element postion  
                ) */
      });

      return null;
    });

    // ############# Table Columns Edges #######################
    data.rels.map((item, index) => {
      // console.log(item);
      resultData.edges.push({
        id: item.id + '_' + index,
        // source: item.sourcePort,
        // target: item.targetPort,
        source: item.from.toString(),
        target: item.to.toString(),
        sourceTable: item.from,
        targetTable: item.to,
        // source: item.from.toString(),
        // target: item.to.toString(),
        type: 'smoothstep', // step, smoothstep, default, straight simplebezier
        // animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 10,
          height: 10,
          color: '#FF0072'
        },
        sourceHandle: item.sourcePort + '',
        targetHandle: item.targetPort + '',
        //   interactionWidth :25,
        edgeIndex: index
        //   label:  item.source.col_name +"-"+item.target.col_name  ,
        //   style: {
        //     strokeWidth: 1,
        //     stroke: '#FF0072',
        //   },
        //  style : {}
      });
      //    tableMapStore.edgeIdToIdx[item.id] = resultData.edges.length -1 // store edges element postion
      return null;
    });

    //    tableMapStore.edgeIdToIdx[item.id] = resultData.edges.length -1 // store edges element postion

    // resultData.nodes = [...resultData.nodes, ...resultData.nodes, ...resultData.nodes, ...resultData.nodes]
    // console.log("resultData")
    // console.log(resultData)

    return resultData;
    // return { nodes, edges };
  }

  async function renderData(resData, renderNode = true) {
    let resultData = formatData(resData);
    if (renderNode) {
      // setNodes([]);
      setEdges(resultData.edges);
    }

    tableMapStore.edges = resultData.edges;
    tableMapStore.nodes = resultData.nodes;
    loadAllTable() 
    // setTimeout( fitViewTable, 500)
  }
  const getData = () => {
    api
      .get('/apps/editor/models/table-map-old', {
        params: {
          subdomain: appid,
          db_id: db_id
        }
      })
      .then(res => {
        getTableMapData() ; //get saved session data
        setMapData(res.data.data);
        renderData(res.data.data);
      })
      .catch(err => {
        console.error(err);
        if (err.response) {
          if (err.response.status === 403) {
            Cookies.remove('session');
            toast.warning(`Please login again`);
            reduxDispatch({ type: 'RESET' })
            history.push(`/auth/login?redirect=/apps/${appid}/data-sources/${db_id}/map/new`);
          } else if (err.response.status === 400) {
            toast.error('Error 400 | Bad Request');
          } else if (err.response.status === 404) {
            toast.error('Error 404 | Not Found');
          } else if (err.response.status === 500) {
            toast.error('Error 500 | Internal Server Error');
          }
        }
      });
  };

  function getTableMapData() {


    return  ; 
/*     api
      .get('/apps/editor/models/table-map-session', {
        params: {
          subdomain: appid,
          db_id: db_id
        }
      })
      .then(res => {
       loadTablesFromTableArray( res.data.data?.tables || [] ) ; 
      })
      .catch(err => {
        console.error('Unable to create a new db', err);

        if (err.response) {
          if (err.response.status === 403) {
            Cookies.remove('session');
            toast.warning(`Please login again`);
            reduxDispatch({ type: 'RESET' })
            history.push(`/auth/login?redirect=/apps/${appid}/data-sources/${db_id}/map/new`);
          } else if (err.response.status === 400) {
            toast.error('Error 400 | Bad Request');
          } else if (err.response.status === 404) {
            toast.error('Error 404 | Not Found');
          } else if (err.response.status === 500) {
            toast.error('Error 500 | Internal Server Error');
          }
        } else {
          toast.warning(err?.message || `Error! Please check the fields and try again.`);
        }
      }); */
  }
  function saveTableMapData() {
    return ;
    /* let tables = [];
    for (let i = 0; i < nodes.length; i++) {
      tables.push({
        id: nodes[i].id,
        position: nodes[i].position
      });
    }
    let body = {
      subdomain: appid,
      db_id: db_id,
      tableMapData: {
        tables: tables
      }
    };
    api
      .post('/apps/editor/models/table-map-session', body, {
        // signal: createDatabaseController.signal
      })
      // .then(res => {
      //   console.table(res.data.data);

      // })
      .catch(err => {
        console.error('Unable to create a new db', err);

        if (err.response) {
          if (err.response.status === 403) {
            Cookies.remove('session');
            toast.warning(`Please login again`);
            reduxDispatch({ type: 'RESET' })
            history.push(`/auth/login?redirect=/apps/${appid}/data-sources/${db_id}/map/new`);
          } else if (err.response.status === 400) {
            toast.error('Error 400 | Bad Request');
          } else if (err.response.status === 404) {
            toast.error('Error 404 | Not Found');
          } else if (err.response.status === 500) {
            toast.error('Error 500 | Internal Server Error');
          }
        } else {
          toast.warning(err?.message || `Error! Please check the fields and try again.`);
        }
      }); */
  }

  
  const onLoad = reactFlowInstance => {
    // store reactflowinstance for later use
    reactFlowInstanceRef.current = {
      reactFlowInstance: reactFlowInstance,
      fitVeiwCount: 0
    };
  };
  const handleEdgeClick = (event, edge) => {
    // if (tableMapStore['prevSelectedEdgeIdx'] == edge.edgeIndex) return;
    let currEdge = edges[edge.edgeIndex];

    if (currEdge.animated) {
      //    currEdge.animated = false;
      //    currEdge.style = {
      //             strokeWidth: 1,
      //             // stroke: '#89ff68',
      //           };
    } else {
      currEdge.animated = true;
      currEdge.style = {
        strokeWidth: 3
        // stroke: '#929299',
      };
    }
    // reset previous selected edge
    if (tableMapStore['prevSelectedEdgeIdx'] !== null && tableMapStore['prevSelectedEdgeIdx'] !== edge.edgeIndex) {
      if (edges[tableMapStore['prevSelectedEdgeIdx']]) {
        let prevEdge = edges[tableMapStore['prevSelectedEdgeIdx']];
        prevEdge.animated = false;
        prevEdge.style = {
          strokeWidth: 1
          // stroke: '#89ff68',
        };

        updateColumnBackgound(prevEdge, false);
      }
    }

    updateColumnBackgound(edge, true);
    tableMapStore['prevSelectedEdgeIdx'] = edge.edgeIndex; // save current selected edge index
    setNodes([...nodes]);
    setEdges([...edges]);
  };

  function updateColumnBackgound(edge, isSelected) {
    let backgroundColor = isSelected ? 'rgb(134 255 100 / 55%)' : 'white';

    let sourceColumnElem = document.getElementById('colnodeid_' + edge.sourceHandle);
    let targetColumnElem = document.getElementById('colnodeid_' + edge.targetHandle);
    if (sourceColumnElem) sourceColumnElem.style.backgroundColor = backgroundColor;
    if (targetColumnElem) targetColumnElem.style.backgroundColor = backgroundColor;

    //TODO: fix background color of selected columns
    let sourceColumns = tableMapStore.nodes[tableMapStore.tableIdToIdx[edge.source]]?.data.tableData.columns || [];
    let targetColumns = tableMapStore.nodes[tableMapStore.tableIdToIdx[edge.target]]?.data.tableData.columns || [];

    for (let i = 0; i < sourceColumns.length; i++) {
      if (sourceColumns[i].columnId === edge.sourceHandle) {
        sourceColumns[i].style = { ...sourceColumns[i].style, backgroundColor: backgroundColor };
        break;
      }
    }

    for (let i = 0; i < targetColumns.length; i++) {
      if (targetColumns[i].columnId === edge.targetHandle) {
        targetColumns[i].style = { ...targetColumns[i].style, backgroundColor: backgroundColor };
        break;
      }
    }
  }
  function loadTablesFromTableArray(tables) {

    let resultGraphData = { nodes: [] };
    delete tableMapStore.selectedTableId;
    tableMapStore.selectedTableId = {};
    for (let i = 0; i < tables.length; i++) {
      let currNode = tableMapStore.nodes[tableMapStore.tableIdToIdx[tables[i].id]];
      if (currNode) {
        currNode.position = tables[i].position; // update saved postion of table
        sortTableColumns(currNode);
        tableMapStore.selectedTableId[currNode.id] = true;
        resultGraphData = SortMap.addNode({ nodes, edges }, currNode, { sort: false });
      }
    }
    setNodes([...resultGraphData.nodes]);
    setLoading(true);
  }


  function loadAllTable() {
    SortMap.removeAllNode({ nodes, edges });
    loadTablesFromTableArray(tableMapStore.nodes);
    SortMap.sortNode({ nodes, edges });
    tableMapStore.schemaSideBarKey++; // change key to different value to re-render SchemaSideBar
  }

  function clearAllTable() {
    tableMapStore.selectedTableId = {};
    let resultGraphData = SortMap.removeAllNode({ nodes, edges });
    setNodes([...resultGraphData.nodes]);
    tableMapStore.schemaSideBarKey++; // change key to different value to re-render SchemaSideBar
  }
  
  const onNodeDragStop = (event, node) =>{ 
   /*  update node position  */
    let currNode = tableMapStore.nodes[tableMapStore.tableIdToIdx[node.id]]   ;
    if( currNode )  currNode.position = node.position ; 
    saveTableMapData();
  }
  return (
    <div>
      {!loading ? LOADING_ELEMENT : null}

      <div className="list-deck  db-schema-par-bx" style={{ height: 'calc(100vh - 48px - 4px - 33px - 4px - 8px - 8px)', position: 'relative' }}>
        {loading ? (
          <>
            <SchemaSideBar
              mapData={mapData}
              renderData={renderData}
              fitViewTable={fitViewTable}
              graphData={{ nodes , edges }}
              setNodes={setNodes}
              tableMapStore={tableMapStore}
              saveTableMapData={saveTableMapData}
              style={{ width: position}}
              loadAllTable={loadAllTable}
              clearAllTable={clearAllTable}
              
              key={tableMapStore.schemaSideBarKey}
            />
             <div
                    className='separator separator-horizontal'
                    {...separatorProps}
                />
            <div
            className='db-schema-right-pr-bx'
            style={{     width: window.innerWidth - 4 - 4 - 8 - position - 48 - 8  ,
           }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodesConnectable={false}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onInit={onLoad}
                nodeTypes={nodeTypes}
                fitView={true}
                minZoom={0.2}
                maxZoom={1.2}
                onlyRenderVisibleElements={true}
                onEdgeClick={handleEdgeClick}
                onNodeDragStop={onNodeDragStop}
                // onNodeClick={handleNodeClick}
                // onInit={onInit}
                // showInteractive={true}
                // onConnect={onConnect}
                // snapToGrid={true}
                // snapToGrid={true}
                // snapToGrid={true}
                // snapGrid={[1115,1115]}
                // elementsSelectable={false}
              >
                {data.tables.length > 50 || true ? <MiniMap /> : ''}
                <Controls showInteractive={true} />

                <Background />
              </ReactFlow>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Schema;
