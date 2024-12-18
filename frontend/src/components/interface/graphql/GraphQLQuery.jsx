// React imports
import React, { useState } from "react";
// SCSS module
import { toast } from "react-toastify";

// Library imports
import { 
  faBolt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Input, Label, Spinner } from "reactstrap";
import { useQuery, gql } from "@apollo/client";

/*  query = `
query GetTrack($trackId: ID!) {
    track(id: $trackId) {
      id
      title
      author {
        id
        name
        photo
      }
      thumbnail
      length
      modulesCount
      numberOfViews
      modules {
        id
        title
        length
      }
      description
    }
  }
    `

  queryValue =  { trackId : 12 }
  */

const ResponseBox = ({ query, queryValue }) => {
  const { loading, error, data } = useQuery(query, {
    variables: queryValue || {},
  });

  const formatResponse = (data) => {
    try {
      if (typeof data === "object") return JSON.stringify(data, null, 2);
    } catch {
      return data;
    }
    return data;
  };

  return (
    <Label className="list-card-label">
      Response
      {loading ? (
        <div className="loading-div">
          <Spinner className="loading-spinner" color="primary" type="grow" />
        </div>
      ) : (
        <Input
          placeholder={`  `}
          type="textarea"
          rows="17"
          style={{ width: "100%" }}
          readOnly
          value={error?.message || error || formatResponse(data)}

          // disabled
        />
      )}
    </Label>
  );
};

const GraphQLQuery = () => {
  const [query, setQuery] = useState("");
  const [queryValue, setQueryValue] = useState("");
  const [responseElement, setResponseElement] = useState(
    <Label className="list-card-label">
      Response  
      <Input
        placeholder={`  `}
        type="textarea"
        rows="17"
        style={{ width: "100%" }}
        readOnly
        value={""}
      /> 
    </Label>
  );

  //  exuecute graphql query
  const executeQuery = async () => {
    let resultQuery;
    let parsedQueryValues;
    if (!query) return toast.error("Please Enter valid  values for Query");

    try {
      resultQuery = gql`
        ${query}
      `;
    } catch (error) {
      return toast.error("Please Enter valid   format for Query. ");
    }

    try {
      if (queryValue) {
        parsedQueryValues = JSON.parse(queryValue);
      }
    } catch (error) {
      return toast.error("Please Enter valid Json format for Values. ");
    }
    setResponseElement(
      <ResponseBox
        queryValue={parsedQueryValues}
        query={resultQuery}
        key={Math.random()}
      />
    );
  };

  const renderData = () => {
    return (
      <div
        style={{
          maxWidth: "750px",
          margin: "auto",
        }}
      >
        <div
          style={{
            // border: "1px solid black",
            display: "flex",
            columnGap: "12px",
            margin: "10px  auto",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "100%" }}>
            <Label className="list-card-label">
              Query
              <Input
                placeholder={` query film {
    film {
      id
      name
    }
} `}
                type="textarea"
                rows="10"
                onChange={(e) => setQuery(e.target.value)}
                value={query}

                // disabled
              />
            </Label>

            <Label className="list-card-label">
              Values
              <Input
                placeholder={`{
  "key1" : "value1",
  "key2" : "value2"
}`}
                type="textarea"
                rows="5"
                value={queryValue}
                onChange={(e) => setQueryValue(e.target.value)}
                // value={selectedColumn?.label}

                // disabled
              />
            </Label>
          </div>

          <div style={{ width: "100%" }}>{responseElement}</div>
        </div>
        <Button block color="primary" onClick={executeQuery}>
          Execute &nbsp; <FontAwesomeIcon icon={faBolt} />
        </Button>
      </div>
    );
  };

  return <div>{renderData()}</div>;
};

export default GraphQLQuery;
