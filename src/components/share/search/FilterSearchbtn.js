import React from 'react'
import styles from './search.module.css';
import searchicon from '../../../assets/icon/search.svg'

const FilterSearchBtn = ({placeholdertext}) => {
  return (
    <>
    <div className={styles.filter__search_withbtn}>
    <div className={styles.filter_search_inputbox}>
        <label className={styles.search_icons}><img src={searchicon} alt={searchicon} /></label>
        <input className={styles.search_inputbar} placeholder={placeholdertext} />
     </div>
     <button  className={styles.input_testUrl_button}>
          Generate
       </button>
    </div>
    </>
  )
}

export default FilterSearchBtn