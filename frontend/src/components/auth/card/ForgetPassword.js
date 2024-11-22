import React from 'react';
import ForgetPasswordForm from '../ForgetPasswordForm';
import AuthCardLayout from '../../../layouts/AuthCardLayout';

const ForgetPassword = () => {
  return (
    <AuthCardLayout>
      <h4 className="mb-0"> Forgot your password?</h4>
      <p className="mb-0">Enter your email and we'll send you a reset link.</p>
      <ForgetPasswordForm layout="card" />
    </AuthCardLayout>
  );
};

export default ForgetPassword;