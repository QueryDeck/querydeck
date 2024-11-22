import React from 'react';
import { Helmet } from 'react-helmet'
import { Card, CardBody } from 'reactstrap';

const Error500 = () => (
    <div>
        <Helmet>
			<title>
				Error 500 | Internal Server Error
			</title>
		</Helmet>
        <Card className="text-center h-100">
            <CardBody className="p-5">
                <div className="display-1 text-200 fs-error">500</div>
                <p className="lead mt-4 text-800 text-sans-serif font-weight-semi-bold">Whoops, something went wrong!</p>
                <hr />
                <p>
                    Try refreshing the page, or going back and attempting the action again. If this problem persists,
                    <a href="mailto:info@exmaple.com" className="ml-1">
                    contact us
                    </a>
                    .
                </p>
            </CardBody>
        </Card>
    </div>
);

export default Error500;
