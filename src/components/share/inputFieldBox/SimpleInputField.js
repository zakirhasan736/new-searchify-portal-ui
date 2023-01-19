import React, { useState, useEffect } from 'react'
import styles from './inputField.module.css'
const SimpleInputField = ({onChange, value, fieldTitle, name, clear }) => {
  const [count, setCount] = useState(0);
  const [words, setWords] = useState("");

  const handleCounter = (e) => {
    const char = e.target.value;
    const words = char.split(/[\n\r\s]+/g).filter((word) => { return word.length > 0 });
    if (words.length < 81) {
      setWords(e.target.value)
      setCount(words.length);
    }
    onChange(e)
};

useEffect(() => {
  if (clear) {
    setCount(0);
    setWords("")
  }
}, [clear])
return (
  <>
    <div className={styles.input_fild__wrapper}>

      <div className={styles.input_fild__contbox}>

        <div className={styles.input_file_titlebox}>
          <h4 className={styles.input_title}>{fieldTitle} <span className={styles.required}>*</span></h4>
          <p className={styles.pintext}>{(name === "keyword" || name === "Pname" || name === "Cname") && `(${count}/80)`}</p>
        </div>
        <div className={styles.input_fild_box}>
          <input value={value} className={styles.input_singletext_fild} placeholder='' onChange={handleCounter} />
        </div>
      </div>
    </div>
  </>
)
}

export default SimpleInputField