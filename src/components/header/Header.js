"use client";
import React from "react";
import Searchbar from "../share/search/search";
import User from "../share/user/user";
import styles from "./header.module.css";

const Header = ({ onMenu, menuOpen }) => {
  return (
    <header className={styles.app_header}>
      <div className={styles.app_header_wrapper}>
        <button
          type="button"
          className={styles.menu_button}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={onMenu}
        >
          <span />
          <span />
          <span />
        </button>
        <div className={styles.app_header_searchbar}>
          <Searchbar placeholdertext="Search templates" />
        </div>
        <div className={styles.app_header_Usersbox}>
          <User />
        </div>
      </div>
    </header>
  );
};

export default Header;
