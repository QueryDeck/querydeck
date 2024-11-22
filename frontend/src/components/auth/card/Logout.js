import React from 'react';
import LogoutContent from '../LogoutContent';

import AuthCardLayout from '../../../layouts/AuthCardLayout';

const Logout = () => {
  return (
    <AuthCardLayout>
      <div className="text-center">
        <LogoutContent layout="card" titleTag="h3" />
      </div>
    </AuthCardLayout>
  );
};

export default Logout;