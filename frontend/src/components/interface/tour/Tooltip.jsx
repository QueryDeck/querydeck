import React from 'react';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLongArrowAltLeft,
  faLongArrowAltRight,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

export default function Tooltip ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
}) {
  return (
    <div {...tooltipProps}>
      <Card className='tour-tooltip'>
        <CardHeader className='tour-tooltip-header'>
          {step.title && <h5>{step.title}</h5>}
        </CardHeader>
        <CardBody className='tour-tooltip-body'>
          {step.content}
        </CardBody>
        <CardFooter className='tour-tooltip-footer'>
          {continuous && index > 0 && index < 17 && (
            <Button
              {...backProps}
              color='falcon-secondary'
              size='sm'
            >
              <FontAwesomeIcon icon={faLongArrowAltLeft} />
              &nbsp;
              Back
            </Button>
          )}
          {continuous && index < 17 && (
            <Button
              {...primaryProps}
              color='falcon-primary'
              size='sm'
            >
              Next
              &nbsp;
              <FontAwesomeIcon icon={faLongArrowAltRight} />
            </Button>
          )}
          {(!continuous || index >= 17) && (
            <Button
              {...closeProps}
              color='falcon-danger'
              size='sm'
            >
              Close
              &nbsp;
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
)}

export const apiBuilderSteps = [
  {
    content: 'Create APIs that suit your business needs and start using them within seconds!',
    placement: 'right-start',
    target: '#tour_api-builder',
    title: 'API Builder'
  },
  {
    content: 'View and modify your APIs seamlessly.',
    placement: 'right',
    target: '#tour_api-saved',
    title: 'Saved APIs'
  },
  {
    content: `Analyse the performance of your APIs.`,
    placement: 'right',
    target: '#tour_api-logs',
    title: 'API Logs'
  },
  {
    content: 'Explore and visualise your database.',
    placement: 'right',
    target: '#tour_databases',
    title: 'Databases'
  },
  {
    content: 'Whitelist domains, add authentication and secure your APIs.',
    placement: 'right',
    target: '#tour_security',
    title: 'Security'
  },
  {
    content: 'Visit the apps section.',
    placement: 'right',
    target: '#tour_back',
    title: 'Back'
  },
  {
    content: 'Access user settings from here',
    placement: 'top-end',
    target: '#tour_settings',
    title: 'User'
  },
  {
    content: 'This is where the magic happens!',
    placement: 'right',
    target: '#tour_api-left',
    title: 'Builder'
  },
  {
    content: `An overview of the query that's executed on triggering the API.`,
    placement: 'right',
    target: '#tour_api-middle',
    title: 'Query'
  },
  {
    content: 'Brief documentation about the API',
    placement: 'left',
    target: '#tour_api-right',
    title: 'Documentation'
  },
  {
    content: 'Indicates method and route at which API would be mounted. Click to copy.',
    placement: 'left',
    spotlightClicks: true,
    target: '#tour_api-right-route',
    title: 'Route'
  },
  {
    content: 'Indicates request structure passed to API.',
    placement: 'left',
    target: '#tour_api-right-request',
    title: 'Request'
  },
  {
    content: 'Indicates response structure returned from API.',
    placement: 'left',
    target: '#tour_api-right-response',
    title: 'Response',
  },
  {
    content: `Let's select a table from the dropdown. Start typing something and press enter to select.`,
    placement: 'right',
    spotlightClicks: true,
    target: '#tour_api-left-base',
    title: 'Base Table'
  },
  {
    content: `This is where we set a method for the API. Let's go with 'Select' method.`,
    placement: 'right',
    spotlightClicks: true,
    target: '#tour_api-left-method',
    title: 'Method'
  },
  {
    content: `Let's set a route where you want to mount your API.`,
    placement: 'right',
    spotlightClicks: true,
    target: '#tour_api-left-route',
    title: 'Route'
  },
  {
    content: `You can select the columns that you want to be included in the API.`,
    placement: 'right',
    spotlightClicks: true,
    target: '#tour_api-left-columns',
    title: 'Columns'
  },
  {
    content: `Click on save and you're done! Once saved, you'd be redirected to 'Saved APIs' section and the route would be copied to your clipboard. Open a new tab and paste the route to check out your API!`,
    placement: 'top-end',
    spotlightClicks: true,
    target: '#tour_api-left-save',
    title: 'Save API'
  },
]