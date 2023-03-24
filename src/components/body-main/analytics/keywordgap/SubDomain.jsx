import React, { useState } from 'react'
import styles from '../analytics.module.css';
import {
    TfiAngleDown,
  
  } from 'react-icons/tfi';
const SubDomain = () => {
    const [openDomainList, setdomainList] = useState(false);
    const [selected__domain, setSelectedDomain] = useState("");
    const [select__domain] = useState([
        {
            id: 1,
            name: "root domain"
        },
        {
            id: 2,
            name: "Exact URl"
        },
        {
            id: 3,
            name: "Subdomain"
        },
        {
            id: 4,
            name: "Subfolder"
        }
    ]);
    return (
        <div onClick={() => setdomainList(!openDomainList)} className={styles.select_domain_type}>
            <span className={styles.selected__item_text}>
                {selected__domain !== "" ? selected__domain : "root domain"} <span className={styles.arrow_down}>< TfiAngleDown /></span>
            </span>
            {openDomainList && <ul className={styles.keyword__select_widget_box}>
                {select__domain.map((item, index) => (
                    <li onClick={() => setSelectedDomain(item.name)} key={index} className={styles.select__widget__items}>{item.name}  </li>
                ))}
            </ul>}
        </div>
    )
}

export default SubDomain