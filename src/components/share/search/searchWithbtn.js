import React, {  useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './search.module.css';
import {getProject, isWebsiteExist, updateProject, getCrawlingData, getWebsite} from "../../../utils/users/ProjectUtil";

const SearchWithbtn = ({onChange, onClick, readOnly, buttonLabel, buttonDisabled}) => {
  const navigate = useNavigate();

  const [siteUrl, setSiteUrl] = useState(null);
  const [website, setWebsite] = useState(null);
  const [websites, setWebsites] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);


  const onEditSiteUrlChanged = (event) => {
    setSiteUrl(event.target.value);
    onChange(event.target.value);
  };

  const onCheckingClick = (event) => {
    onClick(event);
  }

  useEffect(() => {
    if(getWebsite() != null && siteUrl == null) {
        setSiteUrl(getWebsite().url);
    }
    if(getProject()?.websites != null && websites == null) {
      setWebsites(getProject()?.websites);
    }
    // else{
    //     setWebsites([]);
    // }

    if(buttonDisabled !== isButtonDisabled) {
      setIsButtonDisabled(buttonDisabled)
    }
    
  });

  return (
    <>
      <div className={styles.input_file_titlebox}>
        <h4 className={styles.input_title}>
          {!siteUrl && <span style={{"color": "red"}}className={styles.required}> * (Please enter the valid url)</span>}
          {isWebsiteExist(websites, siteUrl) && !readOnly && <span style={{"color": "red"}}className={styles.required}> * (This site url already existed!)</span>}

        </h4>
      </div>
      <div className={styles.inputWith__btn}>
        
        <div className={styles.search__inputbar_box}>
          <input className={styles.search_inputbar} value={siteUrl}
                  onChange={onEditSiteUrlChanged} readOnly={readOnly}
          placeholder='Enter URL' />
        </div>   
          <button onClick={onCheckingClick} className={styles.input_testUrl_button}>
            {buttonLabel}
          </button>
      </div>
    </>
  )
}

export default SearchWithbtn