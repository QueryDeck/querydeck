export const authenticationRoutes = {
  name: 'Authentication',
  to: '/authentication',
  icon: 'lock',
  children: [
    {
      to: '/authentication/basic',
      name: 'Basic',
      children: [
        { to: '/authentication/basic/login', name: 'Login' },
        { to: '/authentication/basic/logout', name: 'Logout' },
        { to: '/authentication/basic/register', name: 'Register' },
        { to: '/authentication/basic/forgot-password', name: 'Forgot password' },
        { to: '/authentication/basic/password-reset', name: 'Reset password' },
        { to: '/authentication/basic/confirm-mail', name: 'Confirm mail' },
        { to: '/authentication/basic/lock-screen', name: 'Lock screen' }
      ]
    },
    {
      to: '/authentication/card',
      name: 'Card',
      // children: [
      //   { to: '/authentication/card/login', name: 'Login' },
      //   { to: '/authentication/card/logout', name: 'Logout' },
      //   { to: '/authentication/card/register', name: 'Register' },
      //   { to: '/authentication/card/forgot-password', name: 'Forgot password' },
      //   { to: '/authentication/card/password-reset', name: 'Reset password' },
      //   { to: '/authentication/card/confirm-mail', name: 'Confirm mail' },
      //   { to: '/authentication/card/lock-screen', name: 'Lock screen' }
      // ]
      children: [
        { to: '/auth/login', name: 'Login' },
        { to: '/auth/logout', name: 'Logout' },
        { to: '/auth/register', name: 'Register' },
        { to: '/auth/forgot-password', name: 'Forgot password' },
        { to: '/auth/password-reset', name: 'Reset password' },
        { to: '/auth/confirm-mail', name: 'Confirm mail' },
        { to: '/auth/lock-screen', name: 'Lock screen' }
      ]
    },
    {
      to: '/authentication/split',
      name: 'Split',
      children: [
        { to: '/authentication/split/login', name: 'Login' },
        { to: '/authentication/split/logout', name: 'Logout' },
        { to: '/authentication/split/register', name: 'Register' },
        { to: '/authentication/split/forgot-password', name: 'Forgot password' },
        { to: '/authentication/split/password-reset', name: 'Reset password' },
        { to: '/authentication/split/confirm-mail', name: 'Confirm mail' },
        { to: '/authentication/split/lock-screen', name: 'Lock screen' }
      ]
    },
    {
      to: '/authentication/wizard',
      name: 'Wizard'
    }
  ]
}