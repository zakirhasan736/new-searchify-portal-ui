import React, { useState } from 'react';
import styles from '../analytics.module.css';
const TableRow = ({ data, index, checked }) => {
    const [singlecheck, setSingleChecked] = useState(false);
    return (
        <tr>
            <td>
                <input type="checkbox" checked={checked ? checked : singlecheck} onChange={() => setSingleChecked(!singlecheck)} />
            </td>
            <td>1</td>
            <td>powerbox 3</td>
            <td>
                1.3k
                <div className={styles.progress_box}>
                    <span className={styles.progress_number}>
                        0.45%
                    </span>
                    <div className={styles.progress_bar}>
                        <span className={styles.progress_percent_bar}></span>
                        <span className={styles.progress_bg_bar}></span>
                    </div>
                </div>
            </td>
            <td>N/A</td>
            <td>
                <span>INFO</span>
            </td>
            <td>
                <div className={styles.group__percentbox}>
                    <span className={styles.percent__icon}></span>
                    <span className={styles.percent__number}>1,118.87</span>
                </div>
            </td>
            <td>860</td>
            <td>$0.51</td>
            <td>
                <div className={styles.progress_bar}>
                    <span className={styles.progress_percent_bar}></span>
                    <span className={styles.progress_bg_bar}></span>
                </div>
            </td>
            <td>1</td>
            <td>N/A</td>
            <td>
                <code>
                    https://www.turbo.fr/actualite-automobile/larnaque-des-puces-moteur-powerbox-3-video-165706
                </code>
            </td>
        </tr>
    )
}

export default TableRow