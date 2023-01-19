import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'
import styles from './style.module.css';

const RankingTable = () => {
    const [tdata, setData] = useState([]);

    useEffect(() => {
        let db = [
            { id: 1, domain: "website.com", c_keywords: "26", keywords_gap: "233", estimated_traffic: "3326", back_link: "23221" },
            { id: 2, domain: "website.com", c_keywords: "26", keywords_gap: "233", estimated_traffic: "3326", back_link: "23221" },
            { id: 3, domain: "website.com", c_keywords: "26", keywords_gap: "233", estimated_traffic: "3326", back_link: "23221" },
            { id: 4, domain: "website.com", c_keywords: "26", keywords_gap: "233", estimated_traffic: "3326", back_link: "23221" },
            { id: 5, domain: "website.com", c_keywords: "26", keywords_gap: "233", estimated_traffic: "3326", back_link: "23221" },
            { id: 6, domain: "website.com", c_keywords: "26", keywords_gap: "233", estimated_traffic: "3326", back_link: "23221" },
            { id: 7, domain: "website.com", c_keywords: "26", keywords_gap: "233", estimated_traffic: "3326", back_link: "23221" },
            { id: 8, domain: "website.com", c_keywords: "26", keywords_gap: "233", estimated_traffic: "3326", back_link: "23221" },
            { id: 9, domain: "website.com", c_keywords: "26", keywords_gap: "233", estimated_traffic: "3326", back_link: "23221" },
            { id: 10, domain: "website.com", c_keywords: "26", keywords_gap: "233", estimated_traffic: "3326", back_link: "23221" },
        ];
        setData(db)
        return () => {
            setData([])
        }
    }, [])
    return (
        <div className={styles.ranking_table__box}>
        <table className={styles.ranking_table}>
            <tr className={styles.table_header}>
                <th> <h2>Domain</h2> </th>
                <th> <h2>Common keywords</h2> </th>
                <th> <h2>Keyword gap</h2> </th>
                <th> <h2>Estimated traffic</h2> </th>
                <th> <h2>Backlinks</h2> </th>
            </tr>
            {tdata.map((item) => (
                <tr className={styles.table_body}>
                    <td> <Link to="/AnalyticsOverview">{item.domain}</Link> </td>
                    <td>
                        <h2>{item.c_keywords}</h2>
                        <select>
                            <option value="">view all</option>
                        </select>
                    </td>
                    <td>
                        <h2>{item.keywords_gap}</h2>
                        <select>
                            <option value="">view all</option>
                        </select>
                    </td>
                    <td>
                        <h2>{item.estimated_traffic}</h2>
                    </td>
                    <td>
                        <h2>{item.back_link}</h2>
                    </td>
                </tr>
            ))}
        </table>
        </div>
    )
}

export default RankingTable