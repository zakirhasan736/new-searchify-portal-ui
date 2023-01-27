import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './search.module.css';
import {getProject, isWebsiteExist, updateProject, getCrawlingData, getWebsite} from "../../../utils/users/ProjectUtil";

const SearchWithbtn = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className={styles.inputWith__btn}>
        <div className={styles.search__inputbar_box}>
          <input className={styles.search_inputbar} value={getWebsite().url} placeholder='Enter URL' />
        </div>
        <button onClick={()=>navigate('/SeoOptimization/details')} className={styles.input_testUrl_button}>
          Check
        </button>
      </div>
    </>
  )
}

export default SearchWithbtn