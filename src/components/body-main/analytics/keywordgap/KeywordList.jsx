import React, { useState } from 'react'
import styles from '../analytics.module.css';

import {
    TfiAngleDown,
  
  } from 'react-icons/tfi';
const KeywordList = () => {
    const [open, setOpen] = useState(false);
    const [selected__keyword, setSelectedKeyword] = useState("");
    const [select__keyword] = useState([
        {
            id: 1,
            name: "organic keywords"
        },
        {
            id: 2,
            name: "paid keywords"
        },
        {
            id: 3,
            name: "free keywords"
        }
    ]);
    return (
        <div onClick={() => setOpen(!open)} className={styles.select__keyword_type}>
            <span className={styles.selected__item_text}>
                {selected__keyword !== "" ? selected__keyword : "organic keywords"}
                 <span className={styles.arrow_down}>< TfiAngleDown /></span>
            </span>
            {open && <ul className={styles.keyword__select_widget_box}>
                {select__keyword.map((item, index) => (
                    <li onClick={() => setSelectedKeyword(item.name)} key={index} className={styles.select__widget__items}>{item.name}</li>
                ))}
            </ul>}
        </div>
    )
}

export default KeywordList