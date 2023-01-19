import React from 'react';
import Searchbar from '../share/search/search';
import User from '../share/user/user';
import styles from './header.module.css';
const Header = () => {
  return (
    <header className={styles.app_header}>
          <div className={styles.app_header_wrapper}>
            <div className={styles.app_header_searchbar}>
              < Searchbar/>
            </div>
            <div className={styles.app_header_Usersbox}>
              <User />
            </div>
          </div>
    </header>
  )
}

export default Header