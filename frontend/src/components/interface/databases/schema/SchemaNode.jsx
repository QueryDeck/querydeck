import React, { memo } from 'react';
import KeyIcon from '@mui/icons-material/Key';
import ViewWeekOutlinedIcon from '@mui/icons-material/ViewWeekOutlined';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import { Handle, Position } from 'reactflow';
import BackupTableIcon from '@mui/icons-material/BackupTable';

const ColumnNode = memo(function(props) {
  let data = props.data || {};
  let isConnectable = false;

  let columnBlockStyle = {
    paddingLeft: '30px',
    borderBottom: true ? '1px solid rgb(205 214 221)' : 'none',
    ...data.style
  };
  return (
    <div className="cus-col-tab-col-bx" id={'colnodeid_' + data.columnId} style={columnBlockStyle}>
      {data.isTarget || false ? (
        <Handle type="target" position={Position.Left} id={data.columnId + ''} isConnectable={isConnectable} />
      ) : null}
      <span>
        {' '}
        <span
          style={{
            position: 'absolute',
            left: '6px',
            top: '4px',
            fontSize: '12px',
            width: '30px',
            display: 'inline-block',
            color: 'blue'
          }}
          role="img"
          aria-label="key-icon"
        >
          {' '}
          {getColumnIcon(data)}
        </span>
        {data.label}
      </span>

      {data.isSource || false ? (
        <Handle type="source" position={Position.Right} id={data.columnId + ''} isConnectable={isConnectable} />
      ) : null}
    </div>
  );
});

// eslint-disable-next-line
const TableNode = memo(function({ data, isConnectable }) {
  isConnectable = true;
  if (!data) {
    console.error('Data is not defined ', data);
    return <>h1 </>;
  }

  return (
    <div className="custom-tab-node">
      <div className="cus-col-table-bx">
        <div>
          <div className="cus-col-tab-label">
            <span style={{ paddingLeft: '10px' }}>
              {/* <div style={{minHeight:'100px'}} className='table-pr-bx'></div> */}
              <span
                style={{ position: 'absolute', left: '8px', top: '5px', fontSize: '15px' }}
                role="img"
                aria-label="talbe-icon"
              >
                <BackupTableIcon fontSize="small" style={{ color: '#cb85ae', fontSize: 17 }} />
              </span>
              {data.label}
            </span>
          </div>
        </div>
        {data?.tableData?.columns.map((item, index) => {
          return <ColumnNode data={item} key={item.columnId} />;
        })}
      </div>
    </div>
  );
});

export default TableNode;
export { ColumnNode };

function getColumnIcon(columnData) {
  // return '' <KeyIcon fontSize='small'  style={{color: '#c2b82b'}} />
  if (columnData.primary) return <KeyIcon fontSize="small" style={{ color: '#c2b82b' }} />;
  if (columnData.foreign) return <VpnKeyRoundedIcon fontSize="small" style={{ color: '#f380c3', fontSize: 18 }} />;
  return <ViewWeekOutlinedIcon fontSize="small" style={{ color: '#ebc9dd', fontSize: 17 }} />;
}
