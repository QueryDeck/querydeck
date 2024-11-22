# Query Charts
(insert logo)
App Summary goes here

---
## Quick Start
Install dependencies:

```console
$ npm install
```

Start the server:

```console
$ npm run dev
```

View the website at: http://localhost:5051

---
## Available Scripts
### `npm run dev`

Runs the app in the development mode.\
Compiles scss files in `src/assets/scss` folder into css.\
Open [http://localhost:5051](http://localhost:5051) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.\
SCSS syntax errors (if any) will be logged in the console.

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:5051](http://localhost:5051) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run scss`

Compiles the scss files in `src/assets/scss` folder into css.

The page will reload when you make changes.\
Syntax errors (if any) will be logged in the console.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

---
# API Methods

## 1. [Login](https://pgtavern.com/authentication/basic/login)
Logs the user into the app by setting JWT.

### Request

#### HTTP Request
```js
POST https://api.pgtavern.com/login
```

#### Authorisation
This method authorises the user.

#### Parameters
Do not provide parameters when calling this method.

#### Request Body
Properties | Type | Description
--- | --- | ---
email | `string` | User's email
password | `string` | User's password

### Response
`
{}
`

#### Properties
Properties | Type | Description
--- | --- | ---

### Errors
WIP

## 2. [Apps List](https://pgtavern.com/apps)
Fetches a list of databases added by the user.

### Request

#### HTTP Request
```js
GET https://api.pgtavern.com/apps
```

#### Authorisation
Requires user login

#### Parameters
Do not provide parameters when calling this method.

#### Request Body
Do not provide a request body when calling this method.

### Response
```
[
    {
		"app_id": "4075cbc0-ede0-4948-b572-7e55a8803905",
		"name": "pg-test",
		"subdomain": "autumn-waterfall-44"
	}
    ...
]
```

#### Properties
Type | Description
--- | ---
`array` | List of databases

### Errors
WIP

## 3. [Add App](https://pgtavern.com/apps/new)
Adds a database into the apps list.

### Request

#### HTTP Request
```js
POST https://api.pgtavern.com/apps
```

#### Authorisation
Requires user login

#### Parameters
Do not provide parameters when calling this method.

#### Request Body
Properties | Type | Description
--- | --- | ---
name | `string` | App name for the database
dbhost | `string` | Database host URL
dbusername | `string` | Database username
dbpassword | `string` | Database password
dbport | `integer` | Database port
dbname | `string` | Database name

### Response
`
{}
`

#### Properties
Properties | Type | Description
--- | --- | ---

### Errors
WIP

## 4. [Table Maps](https://pgtavern.com/apps/autumn-waterfall-44)
Fetches a list of columns in a schema.

### Request

#### HTTP Request
```js
GET https://api.pgtavern.com/apps/editor/models/table-map
```

#### Authorisation
Requires user login

#### Parameters
Properties | Type | Description
--- | --- | ---
subdomain | `string` | App subdomain

#### Request Body
Do not provide a request body when calling this method.

### Response
```
{
    "nodes": {
        "17426": {
            "id": 17426,
            "name": "public.customer",
            "ports": {
                "17426.6": {
                    "id": "17426.6",
                    "type": "output",
                    "name": "address_id"
                }
                ...
            },
            "type": "input-output",
            "col_count": 10,
            "position": {
                "x": 1300,
                "y": 900
            }
        }
        ...
    },
    "links": {
        "17426-17478": {
            "id": "17426-17478",
            "from": {
                "nodeId": 17426,
                "portId": "17426.6"
            },
            "to": {
                "nodeId": 17478,
                "portId": "17478.1"
            }
        }
        ...
    }
}
```

#### Properties
Properties | Type | Description
--- | --- | ---
nodes | `object` | Defines the nodes and their position
links | `object` | Defines the relations between nodes

### Errors
WIP

## 5. [Get Tables](https://pgtavern.com/apps/autumn-waterfall-44)
Fetches all tables from the app.

### Request

#### HTTP Request
```js
GET https://api.pgtavern.com/apps/editor/controllers/ops
```

#### Authorisation
Requires user login

#### Parameters
Properties | Type | Description
--- | --- | ---
subdomain | `string` | App subdomain

#### Request Body
Do not provide a request body when calling this method.

### Response
```
{
    "type_map": [
        {
            "name": "number",
            "types": [
                "integer"
                ...
            ],
            "comparison": [
                {
                    "symbol": "=",
                    "name": "equal to"
                }
                ...
            ],
            "functions": []
        }
        ...
    ],
    "tables_arr": [
        {
            "id": "17426",
            "text": "public.customer",
            "has_id": true
        }
        ...
    ],
    "chart_agg_fn": [
        "avg"
        ...
    ],
    "ts_granularity": [
        "second"
        ...
    ]
}
```

#### Properties
Properties | Type | Description
--- | --- | ---
type_map | `array` | Operators available for each datatype
tables_arr | `array` | App tables
chart_agg_fn | `array` | Aggregate function options
ts_granularity | `array` | Timestamp time period

### Errors
WIP

## 6. [Get Outer Nodes](https://pgtavern.com/apps/autumn-waterfall-44)
Fetches L0 and L1 nodes of the tree.

### Request

#### HTTP Request
```js
GET https://api.pgtavern.com/apps/editor/controllers/nodes
```

#### Authorisation
Requires user login

#### Parameters
Properties | Type | Description
--- | --- | ---
subdomain | `string` | App subdomain
id | `string` | Table ID of selected table
qm | `string` | Query method

#### Request Body
Do not provide a request body when calling this method.

### Response
```
{
	"nodes": [
		{
			"text": "customer_id",
			"id": "17426.1",
			"ts": false,
			"nodes": [
				{
					"text": "public.payment",
					"id": "17426.1-17528.2",
					"nodes": [],
					"selectable": false,
					"onExpand": "/apps/editor/controllers/nodes?subdomain=autumn-waterfall-44&id=17426.1-17528.2&qm=select",
					"showAgg": true
				}
                ...
			]
		}
        ...
	],
    "selectable": false,
    "text": "public.customer"
}
```

#### Properties
Properties | Type | Description
--- | --- | ---
nodes | `array` | Nodes list
selectable | `boolean` | Earlier used for aggregate functions, now deprecated
text | `string` | Table name

### Errors
WIP

## 7. [Get Inner Nodes](https://pgtavern.com/apps/autumn-waterfall-44)
Fetches inner nodes of the tree.

### Request

#### HTTP Request
```js
GET https://api.pgtavern.com/apps/editor/controllers/nodes
```

#### Authorisation
Requires user login

#### Parameters
Properties | Type | Description
--- | --- | ---
subdomain | `string` | App subdomain
id | `string` | Node ID of expanded node
qm | `string` | Query method

#### Request Body
Do not provide a request body when calling this method.

### Response
```
[
    {
        "text": "rental_id",
        "id": "17426.1-17534.4$1",
        "ts": false,
        "nodes": [
            {
                "text": "public.payment",
                "id": "17426.1-17534.4-17534.1-17528.4",
                "nodes": [],
                "selectable": false,
                "onExpand": "/apps/editor/controllers/nodes?subdomain=autumn-waterfall-44&id=17426.1-17534.4-17534.1-17528.4&qm=select",
                "showAgg": true
            }
            ...
        ]
    }
    ...
]
```

#### Properties
Type | Description
--- | ---
`array` | Nodes list

### Errors
WIP

## 8. [Generate SQL](https://pgtavern.com/apps/autumn-waterfall-44)
Generates SQL Query based on selected columns and joins.

### Request

#### HTTP Request
```js
POST https://api.pgtavern.com/apps/editor/controllers/sql-gen
```

#### Authorisation
Requires user login

#### Parameters
Do not provide paramters when calling this method.

#### Request Body
Property | Type | Description
--- | --- | ---
c | `array` | Checked columns
subdomain | `string` | App subdomain
method | `string` | Query method
agg_paths | `array` | Aggregated joined tables

Optional Properties
Property | Type | Description
--- | --- | ---
w | `object` | Filter conditions
execute | `boolean` | Executes query to generate results

### Response
```
[
    {
        "id": "req",
        "title": "Request",
        "content": {}
    },
    {
        "id": "res",
        "title": "Response",
        "content": {
            "customer": [
                {
                    "customer_id": "customer_id"
                }
            ]
        }
    },
    {
        "id": "sql",
        "title": "SQL Query",
        "content": "SELECT\n  public.customer.customer_id\nFROM\n  public.customer"
    }
]
```

#### Properties
Type | Description
--- | ---
`array` | Generated queries

### Errors
WIP

## 9. [Get Filters](https://pgtavern.com/apps/autumn-waterfall-44)
Fetches columns that can be filtered from the selected tables.

### Request

#### HTTP Request
```js
POST https://api.pgtavern.com/apps/editor/controllers/where-cols
```

#### Authorisation
Requires user login

#### Parameters
Do not provide paramters when calling this method.

#### Request Body
Properties | Type | Description
--- | --- | ---
c | `array` | Checked columns
agg_paths | `array` | Aggregated joined tables
subdomain | `string` | App subdomain

### Response
```
{
	"columns": [
		{
			"id": "public.customer.customer_id",
			"label": "customer_id",
			"displayName": "customer_id",
			"type": "number"
		}
        ...
	]
}
```

#### Properties
Properties | Type | Description
--- | --- | ---
columns | `array` | Filter options

### Errors
WIP


## 10. [Get Databases](https://pgtavern.com/apps/autumn-waterfall-44)
Fetches app databases.

### Request

#### HTTP Request
```js
GET https://api.pgtavern.com/apps/editor/controllers/db
```

#### Authorisation
Requires user login

#### Parameters
Properties | Type | Description
--- | --- | ---
subdomain | `string` | App subdomain

#### Request Body
Do not provide a request body when calling this method.

### Response
```
[
    {
        "name": "dvdrental",
        "db_id": "db6ebf9c-5be4-4a58-a7e7-deb23c1d7aad"
    }
    ...
]
```

#### Properties
Type | Description
--- | ---
`array` | Database list

### Errors
WIP

## 11. [Get Saved Queries](https://pgtavern.com/apps/autumn-waterfall-44)
Fetches saved queries in the app.

### Request

#### HTTP Request
```js
GET https://api.pgtavern.com/apps/editor/controllers/saved-query
```

#### Authorisation
Requires user login

#### Parameters
Properties | Type | Description
--- | --- | ---
subdomain | `string` | App subdomain

#### Request Body
Do not provide a request body when calling this method.

### Response
```
[
    {
        "created_at": 1656420426,
        "query_id": "aa0a1091-1a74-4a6c-a636-08d9c0c89fa7",
        "query_json": {
            "schema": "public",
            "table": "actor",
            "method": "select",
            "table_alias": "actor",
            "columns": [
                {
                    "columnName": "public.actor.actor_id"
                }
                ...
            ],
            "joins": []
        },
        "name": "Actors",
        "query_val_param_map": null,
        "query_view_data": {
            "column_ids": [
                {
                    "id": "17437.1"
                }
                ...
            ],
            "column_names": [
                "public.actor.first_name"
                ...
            ],
            "condition_count": 0
        },
        "query_text": {
            "text": "SELECT public.actor.first_name,public.actor.last_name,public.actor.actor_id FROM public.actor  ",
            "values": []
        },
        "db_id": "db6ebf9c-5be4-4a58-a7e7-deb23c1d7aad"
    }
    ...
]
```

#### Properties
Type | Description
--- | ---
`array` | Saved queries

### Errors
WIP

## 12. [Save Query](https://pgtavern.com/apps/autumn-waterfall-44)
Saves generated query along with filters.

### Request

#### HTTP Request
```js
POST https://api.pgtavern.com/apps/editor/controllers/saved-query
```

#### Authorisation
Requires user login

#### Parameters
Do not provide paramters when calling this method.

#### Request Body
Properties | Type | Description
--- | --- | ---
subdomain | `string` | App subdomain
method | `string` | Query method
agg_paths | `array` | Aggregated joined tables
execute | `boolean` | Executes query to generate results
db_id | `string` | Database ID where query is being saved
name | `string` | User defined query name
w | `object` | Filter conditions

### Response
```
WIP
```

#### Properties
Type | Description
--- | ---
`array` | Nodes list

### Errors
WIP

## 13. [Get Query Data](https://pgtavern.com/apps/autumn-waterfall-44)
Fetches query data.

### Request

#### HTTP Request
```js
POST https://api.pgtavern.com/apps/editor/controllers/query-exec
```

#### Authorisation
Requires user login

#### Parameters
Do not provide paramters when calling this method.

#### Request Body
Properties | Type | Description
--- | --- | ---
query_id | `string` | Query ID

### Response
```
[
    {
        "first_name": "Penelope",
        "last_name": "Guiness",
        "actor_id": 1
    }
    ...
]
```

#### Properties
Type | Description
--- | ---
`array` | Query generated data

### Errors
WIP