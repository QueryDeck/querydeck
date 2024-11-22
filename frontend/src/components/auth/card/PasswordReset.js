import React from 'react';
import PasswordResetForm from '../PasswordResetForm';
import AuthCardLayout from '../../../layouts/AuthCardLayout';

const PasswordReset = () => {
  return (
    <AuthCardLayout>
      <h3>Reset password</h3>
      <PasswordResetForm layout="card" hasLabel />
    </AuthCardLayout>
  );
};

export default PasswordReset;