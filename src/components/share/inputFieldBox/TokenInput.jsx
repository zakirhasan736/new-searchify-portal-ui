import React, { useState, useEffect } from 'react'
import styles from './inputField.module.css';

const TokenInput = ({ onChange, value, fieldTitle, name, clear }) => {
    const [count, setCount] = useState(0);
    const [words, setWords] = useState(0);

    const handleCounter = (e) => {
        const char = e.target.value;
        if (char <= 2048) {
            setWords(e.target.value)
            setCount(e.target.value);
        }
        onChange(e)
    };

    useEffect(() => {
        setCount(0);
        setWords("");
    }, [clear]);

    return (
        <>
            <div className={styles.input_fild__wrapper}>

                <div className={styles.input_fild__contbox}>

                    <div className={styles.input_file_titlebox}>
                        <h4 className={styles.input_title}>{fieldTitle} <span className={styles.required}>*</span></h4>
                        <p className={styles.pintext}>{`(${clear ? 0 : count}/2048)`}</p>
                    </div>
                    <div className={styles.input_fild_box}>
                        <input value={value ? value : ""} type="number" min="0" max={2048} className={styles.input_singletext_fild} placeholder='' onChange={handleCounter} name={name ? name : ""} />
                    </div>
                </div>
            </div>
        </>
    )
}

export default TokenInput