import React from 'react'
import styles from './search.module.css';
import searchicon from '../../../assets/icon/search.svg'

const SearchFilterSelect = ({placeholdertext}) => {
  return (
    <>
    <div className={styles.filter_key__search}>
    <div className={styles.filter_search_inputbox}>
        <label className={styles.search_icons}><img src={searchicon} alt={searchicon} /></label>
        <input className={styles.search_inputbar} placeholder={placeholdertext} />
     </div>
    </div>
    </>
  )
}

export default SearchFilterSelect