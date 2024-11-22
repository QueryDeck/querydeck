// import CryptoJS from 'crypto-js'
// import Cookies from 'js-cookie'
// import secret from './secret';

// let session = {}
// if(Cookies.get('session')) {
//     session = JSON.parse(CryptoJS.AES.decrypt(Cookies.get('session'), secret).toString(CryptoJS.enc.Utf8))
// }

// const darkMode = session.preferences.theme === 'dark'

export const version = '0.40.6';
export const navbarBreakPoint = 'xl'; // Vertical navbar breakpoint
export const topNavbarBreakpoint = 'lg';
export const settings = {
  alerts: {
    joins: true,
    forms: true,
    metrics: true,
    dimensions: true,
    customs: true,
    filters: true,
    sorts: true
  },
  isFluid: false,
  isRTL: false,
  // isDark: darkMode, // Color theme
  isDark: false, // Color theme
  isTopNav: false,
  isVertical: true,
  get isCombo() {
    return this.isVertical && this.isTopNav;
  },
  showBurgerMenu: false, // controls showing vertical nav on mobile
  currency: '$',
  isNavbarVerticalCollapsed: false,
  navbarStyle: 'transparent',
  navbarDisplay: false
};
export default { version, navbarBreakPoint, topNavbarBreakpoint, settings };
