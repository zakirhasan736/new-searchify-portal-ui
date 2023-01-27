import React from 'react'
import { useState } from 'react'
import styles from './dropdown.module.css'
const DropDown = ({ handleFilterType }) => {

    const [checked, setChecked] = useState("Organic and paid");
    const [open, setOpen] = useState(false);
    const [remove, setRemove] = useState(true)
    const handleRemoveChecked = () => {
        setChecked("Organic and paid")
        setRemove(true)
    }
    const handleAddChecked = (arg) => {
        setChecked(arg)
        handleFilterType(arg)
        setRemove(false)
        setOpen(false)
    }
    return (
        <li className={styles.dropdown__items}>
            <span onClick={() => checked === "Organic and paid" && setOpen(!open)}>{checked}</span>
            {remove === false && <span style={{ "marginLeft": "20px" }} onClick={() => handleRemoveChecked()}>x</span>}
            {open && <ul className={styles.dropdown__content}>
                <li onClick={() => handleAddChecked("organic")}>organic</li>
                <li onClick={() => handleAddChecked("paid")}>paid</li>
            </ul>}
        </li>

    )
}

export default DropDown