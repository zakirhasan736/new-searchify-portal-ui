import React from 'react'
import styles from './search.module.css';
import searchicon from '../../../assets/icon/search.svg'

const search = () => {
  return (
    <>
     <div className={styles.search_inputbox}>
        <label className={styles.search_icons}><img src={searchicon} alt={searchicon} /></label>
        <input className={styles.search_inputbar} placeholder="Search templates" />
     </div>
    </>
  )
}

export default search