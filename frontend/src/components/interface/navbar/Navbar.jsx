// handle conflicts in postgres and mysql insert/upsert
import React, {
    // useContext,
    useState
} from 'react';
// import CryptoJS from 'crypto-js'
import Cookies from 'js-cookie'
import {
    Badge,
    Button,
    Collapse,
    Input,
    Navbar,
    // Nav
} from 'reactstrap';
import { Link } from 'react-router-dom'
// import Switch from "react-switch"
// import AppContext from '../../../context/Context'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBars,
    // faMoon,
    // faSun
} from '@fortawesome/free-solid-svg-icons'
import AppNameLogo from './AppNameLogo' 

// import secret from '../../../secret';

const NavbarTop = () => {
    // const {
    //     isDark,
    //     setIsDark
    // } = useContext(AppContext)

    const [collapse, setCollapse] = useState(false)

    // let session = {}
    // if(Cookies.get('session')) {
    //     session = JSON.parse(CryptoJS.AES.decrypt(Cookies.get('session'), secret).toString(CryptoJS.enc.Utf8))
    //     // console.log( "actual cookie session",session)
    // }

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

    const renderNavbar = () => {
        return(
            <>
             <AppNameLogo/>
                <Navbar
                    className='navbar-main'
                    color="light"
                    // dark={isDark}
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
                        {/* <Nav
                            navbar
                        >
                            <label className='navbar-switcher cursor-pointer'>
                                <h5 className='navbar-switcher-heading'>Toggle theme:</h5>
                                <Switch
                                    checked={isDark}
                                    checkedIcon={<FontAwesomeIcon
                                        className='navbar-switcher-checked'
                                        icon={faMoon}
                                        size='lg'
                                    />}
                                    uncheckedIcon={<FontAwesomeIcon
                                        className='navbar-switcher-unchecked'
                                        icon={faSun}
                                        size='lg'
                                    />}
                                    offColor='#000'
                                    onColor='#000'
                                    onChange={toggleTheme}
                                />
                            </label>
                        </Nav> */}
                    </Collapse>
                </Navbar>
            </>
        )
    }
    return(
        <>
            {renderNavbar()}
        </>
    )
}

export default NavbarTop;