import React, { useEffect, useState } from 'react'
import styles from '../analytics.module.css';
const Dropdown = ({ onChange, name, values, clear }) => {
  const [open, setOpend] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (value !== "") {
      setOpend(false);
    }
  }, [value]);

  return (
    <div className={styles.keyword__input_item_mainbox}>
      <div className={styles.keyword_inputfild__contbox}>
        <div onClick={() => setOpend(!open)} className={styles.keyword__input_fildbox}>
          <label
            htmlFor="text"
            className={styles.seal__text_color}
          >
            <span></span>
          </label>
          <input
            type="text"
            className={styles.add__domain_fild}
            name={name}
            placeholder="add domain"
            value={clear ? "" : values !== undefined ? values : value}
          />
        </div>
        {open && <ul className={styles.competitor_dropdown}>
          {
            ["ebuy.com", "amazon.com", "walmart.com", "pinterest.com", "youtube.com"].map((item, index) => (
              <li onClick={() => { setValue(item); onChange(name, item) }}>{item}</li>
            ))
          }
        </ul>}
      </div>
    </div>
  )
}

export default Dropdown