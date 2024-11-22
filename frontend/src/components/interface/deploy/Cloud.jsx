import * as React from "react";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import CustomDomains from "./customDomains/CustomDomains";
import Logs from "./logs/Logs";
import {
    CardBody,
    CardHeader,
  } from "reactstrap";
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

 
const AntTabs = styled(Tabs)({
  borderBottom: "1px solid #e8e8e8",
  "& .MuiTabs-indicator": {
    backgroundColor: "#1890ff",
  },
});

const AntTab = styled((props) => <Tab disableRipple {...props} />)(
  ({ theme }) => ({
    textTransform: "none",
    minWidth: 0,
    [theme.breakpoints.up("sm")]: {
      minWidth: 0,
    },
    width:'13%',
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(1),
    color: "#5e6e82",
    // fontFamily: [
    //   '-apple-system',
    //   'BlinkMacSystemFont',
    //   '"Segoe UI"',
    //   'Roboto',
    //   '"Helvetica Neue"',
    //   'Arial',
    //   'sans-serif',
    //   '"Apple Color Emoji"',
    //   '"Segoe UI Emoji"',
    //   '"Segoe UI Symbol"',
    // ].join(','),
    "&:hover": {
      color: "#40a9ff",
      opacity: 1,
    },
    "&.Mui-selected": {
      color: "#1890ff",
      fontWeight: theme.typography.fontWeightMedium,
    },
    "&.Mui-focusVisible": {
      backgroundColor: "#d1eaff",
    },
  })
);

export default function Cloud(props) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* <Box sx={{ bgcolor: "#fff" }}> */}
        <AntTabs value={value} onChange={handleChange} aria-label="ant example">
          <AntTab label="Custom Domains" />
          <AntTab label="Logs" />
        </AntTabs>
      {/* </Box> */}

      <CustomTabPanel value={value} index={0}>
        <div className="databases-list" style={{ margin: "0 auto" , }}>
          <CardHeader>
            <h2 className="apps-heading">Custom Domains</h2>
          </CardHeader>
          <CardBody>
            <CustomDomains subdomain={props.subdomain} />
          </CardBody>
        </div>
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        
        <Logs appid={props.subdomain} />
      </CustomTabPanel>
    </Box>
  );
}
