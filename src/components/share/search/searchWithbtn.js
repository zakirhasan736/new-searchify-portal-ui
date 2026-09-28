"use client";
import React from 'react';
import styles from './search.module.css';
import {getProject, isWebsiteExist, updateProject, getCrawlingData, getWebsite} from "../../../utils/users/ProjectUtil";

const SearchWithbtn = ({
  buttonLabel = "Check",
  onChange,
  onClick,
  readOnly = false,
  buttonDisabled = false,
}) => {
  const savedUrl = getWebsite()?.url || "";
  const [value, setValue] = React.useState(savedUrl);
  return (
    <>
      <div className={styles.inputWith__btn}>
        <div className={styles.search__inputbar_box}>
          <input
            className={styles.search_inputbar}
            value={readOnly ? savedUrl : value}
            readOnly={readOnly}
            placeholder="Enter URL"
            onChange={(event) => {
              setValue(event.target.value);
              if (onChange) onChange(event.target.value);
            }}
          />
        </div>
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={onClick}
          className={styles.input_testUrl_button}
        >
          {buttonLabel}
        </button>
      </div>
    </>
  )
}

export default SearchWithbtn