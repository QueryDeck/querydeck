import React from 'react';
import ConfirmMailContent from '../ConfirmMailContent';
import AuthCardLayout from '../../../layouts/AuthCardLayout';

const ConfirmMail = () => (
  <AuthCardLayout>
    <div className="text-center">
      <ConfirmMailContent layout="card" email="xyz@abc.com" titleTag="h3" />
    </div>
  </AuthCardLayout>
);

export default ConfirmMail;