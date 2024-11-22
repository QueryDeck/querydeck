import React, { Fragment } from 'react';
import { Helmet } from 'react-helmet'
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import envelope from '../../assets/img/illustrations/envelope.png';


const ConfirmMailContent = ({ email, layout, titleTag: TitleTag }) => (
  <Fragment>
    <Helmet>
      <title>
        Confirm Mail | QueryDeck
      </title>
    </Helmet>
    <img className="d-block mx-auto mb-4" src={envelope} alt="sent" width={70} />
    <TitleTag>Please check your email!</TitleTag>
    <p>
      An email has been sent to your mail address. Please click on the included link to reset your password.
    </p>
    <Button tag={Link} color="primary" size="sm" className="mt-3" to={`/auth/login`}>
      <FontAwesomeIcon icon="chevron-left" transform="shrink-4 down-1" className="mr-1" />
      Return to login
    </Button>
  </Fragment>
);

ConfirmMailContent.propTypes = {
  email: PropTypes.string.isRequired,
  layout: PropTypes.string,
  titleTag: PropTypes.string
};

ConfirmMailContent.defaultProps = { layout: 'basic', titleTag: 'h4' };

export default ConfirmMailContent;
