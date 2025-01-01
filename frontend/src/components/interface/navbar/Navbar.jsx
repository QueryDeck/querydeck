// handle conflicts in postgres and mysql insert/upsert
import React, {
    // useContext,
    useEffect,
    useReducer,
    useState
} from 'react';
import { useHistory } from "react-router-dom";

// Redux
import { useDispatch } from "react-redux";

// Reducers
import menuReducer from "../../reducers/menu/menuReducer";

import CryptoJS from 'crypto-js'
import Cookies from 'js-cookie'
import {
    Badge,
    Button,
    Collapse,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Input,
    Navbar,
    Nav
} from 'reactstrap';
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBars,
    faKey,
    faSignOutAlt,
    faUser
} from '@fortawesome/free-solid-svg-icons'
import AppNameLogo from './AppNameLogo' 

// Components
import ChangePasswordModal from "./ChangePasswordModal";

// Utils
// import { isSubdomainIsSandbox } from "../../../helpers/utils";

// API
import api from "../../../api";

// Secret
import secret from '../../../secret';

// Abort controllers for cancelling network requests
let changePasswordController;
let logoutController;

const NavbarTop = () => {
    // Redux
    const reduxDispatch = useDispatch();

    // For 403 errors on unauthorised users
    const history = useHistory();

    const [collapse, setCollapse] = useState(false)

    let session = {}
    if(Cookies.get('session')) {
        session = JSON.parse(CryptoJS.AES.decrypt(Cookies.get('session'), secret).toString(CryptoJS.enc.Utf8))
    }

    // Initial state
    const initialState = {
        dropdownOpen: false,
        changePasswordModalState: false,
        tooltip: false,
    };

    const [state, dispatch] = useReducer(menuReducer, initialState);

    useEffect(() => {
        changePasswordController = new AbortController();
        logoutController = new AbortController();
    
        return () => {
            changePasswordController.abort();
            logoutController.abort();
        };
    }, []);

    // const toggleTheme = () => {
    //     setIsDark(!isDark)
    //     Cookies.set('session', CryptoJS.AES.encrypt(JSON.stringify({
    //         ...session,
    //         preferences: {
    //             ...session.preferences,
    //             theme: isDark ? 'light' : 'dark'
    //         }
    //     }), secret), { expires: 7 }, { sameSite: 'strict' })
    // }

    const toggleCollapse = () => {
        setCollapse(!collapse)
    }

    // Toggles settings dropdown
    const toggleDropdown = () => {
        dispatch({
        type: "TOGGLE_DROPDOWN",
        });
    };

    const openModal = () => {
        dispatch({
            type: "OPEN_MODAL",
        });
    };

    const closeModal = () => {
        dispatch({
            type: "CLOSE_MODAL",
        });
    };

    const logout = () => {
        api
        .post("/logout", {
            signal: logoutController.signal,
        })
        .then((res) => {
            Cookies.remove("session");
            reduxDispatch({ type: "RESET" });
            history.replace("/auth/login");
        })
        .catch((err) => {
            console.error(err);
        });
    };

    const renderNavbar = () => {
        return(
            <>
             <AppNameLogo/>
                <Navbar
                    className='navbar-main'
                    color="light"
                    expand="md"
                >
                    <div className='navbar-heading'>
                        <Link className='navbar-heading-link' to='/apps'>
                            <img
                                alt='Logo'
                                src='https://res.cloudinary.com/marquee/image/upload/v1712577580/querycharts/email/querydeck_logo_full_ehyxdu.png'
                            />
                        </Link>
                        <Badge
                            className='badge-nav'
                            // style={{ visibility: 'hidden' }}
                        >
                            Beta
                        </Badge>
                
                    </div>
                    <Button
                        className='navbar-toggler'
                        color='light'
                        onClick={toggleCollapse}
                    >
                        <FontAwesomeIcon icon={faBars} />
                    </Button>
                    <Collapse
                        isOpen={collapse}
                        navbar
                    >
                        
                        <div
                            className='navbar-search'
                            style={{ visibility: 'hidden' }}
                        >
                            {Cookies.get('session') ?
                                <Input
                                    className='navbar-search-input'
                                    placeholder='Search'
                                    bsSize='lg'
                                />
                                : ''
                            }
                        </div>
                        <Nav navbar>
                            <Dropdown
                                direction="up"
                                id="tour_settings"
                                isOpen={state.dropdownOpen}
                                toggle={toggleDropdown}
                            >
                                <DropdownToggle
                                    className='navbar-user-button'
                                    color="falcon-primary"
                                >
                                    <FontAwesomeIcon icon={faUser} />
                                </DropdownToggle>
                                <DropdownMenu
                                    className='navbar-user-menu'
                                    right
                                >
                                    <DropdownItem
                                        color="falcon-primary"
                                        disabled
                                    >
                                        Hi <span>{session?.user?.email}</span>
                                    </DropdownItem>
                                    <DropdownItem divider/>
                                    <DropdownItem
                                        color="falcon-primary"
                                        onClick={openModal}
                                    >
                                        <FontAwesomeIcon icon={faKey} /> <span>Change Password</span>
                                    </DropdownItem>
                                    <DropdownItem
                                        color="falcon-primary"
                                        onClick={logout}
                                    >
                                        <FontAwesomeIcon icon={faSignOutAlt} /> <span>Logout</span>
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </Nav>
                    </Collapse>
                </Navbar>
            </>
        )
    }
    return(
        <>
            {renderNavbar()}
            <ChangePasswordModal
                modalState={state.changePasswordModalState}
                modalHandler={closeModal}
            />
        </>
    )
}

export default NavbarTop;