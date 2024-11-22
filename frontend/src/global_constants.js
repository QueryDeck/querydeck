import { v4 as uuidv4 } from 'uuid'

const global_constants = {

    MUI_UNIQUE_COLUMN: `unique_column_${uuidv4().split("-")[0]}`,   // unique columnName for mui table     
}
export default global_constants;