import React, { useState } from 'react';
import styles from '../analytics.module.css';
import chartLine from '../../../../assets/icon/cartLine.png'
const TableRow = ({ data, index, checked }) => {
    const [singlecheck, setSingleChecked] = useState(false);
    return (
        <tr>
            <td>
                <input type="checkbox" checked={checked ? checked : singlecheck} onChange={() => setSingleChecked(!singlecheck)} />
            </td>
            <td>{index + 1}</td>
            <td>{data.keyword}</td>
            <td>
                <div className={styles.cont__box}>
                    {data.vol}
                    <img src={chartLine} alt={chartLine} />
                </div>
                {data.yearlyTrend}
            </td>
            <td>
                <div className={styles.cont__box}>
                    {data.xerocqueries}%
                    <div className={styles.progress_bar}>
                        <span className={styles.progress_percent_bar}></span>
                        <span className={styles.progress_bg_bar}></span>
                    </div>
                </div>
            </td>
            <td>
                <span className={styles.kd___number}>{data.kd}</span>
            </td>
            <td>
                <span>{data.intent}</span>
            </td>
            <td>${data.cpc}</td>
            <td>
                <div className={styles.progress_bar}>
                    <span className={styles.progress_percent_bar}></span>
                    <span className={styles.progress_bg_bar}></span>
                </div>
            </td>
            <td>{data.leader}</td>
        </tr>
    )
}

export default TableRow