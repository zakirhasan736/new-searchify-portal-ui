import React, { useState } from 'react'
import styles from '../../body-main/analytics/analytics.module.css';

import {
    TfiAngleDown,
  
  } from 'react-icons/tfi';
const DropdownCustomRange = () => {
    const [open, setOpen] = useState(false);
    const [selected__customRange, setCustomRange] = useState("");
    const [select__keyword] = useState([
        {
            id: 1,
            name: "top 50"
        },
        {
            id: 2,
            name: "top 20"
        },
        {
            id: 3,
            name: "top 10"
        }
    ]);
    return (
        <div onClick={() => setOpen(!open)} className={styles.select__keyword_type}>
            <span className={styles.selected__item_text}>
                {selected__customRange !== "" ? selected__customRange : "You-domain"}
                 <span className={styles.arrow_down}>< TfiAngleDown /></span>
            </span>
            {open && <ul className={styles.keyword__select_widget_box}>
                {select__keyword.map((item, index) => (
                    <li onClick={() => setCustomRange(item.name)} key={index} className={styles.select__widget__items}>{item.name}</li>
                ))}
                 <li className={styles.custom_rangebox}>
                              <h6 className={styles.range_title}>Custom range</h6>
                              <div className={styles.range_input_box}>
                              <input type="text" className={styles.input_item_one} placeholder='from' />
                                <input type="text" className={styles.input_item_two} placeholder='to' />
                              </div>
                              <button className={styles.apply_btn}>Apply</button>
                            </li>
            </ul>}
        </div>
    )
}

export default DropdownCustomRange