import React, { useEffect, useState } from 'react'
import styles from './rankCard.module.css';
import {  CalendarIcon } from '../../body-main/analytics/icons';


const RankCard = ({rankTitle,typeTitle,rankNumber, iconsRankType}) => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    useEffect(() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth();
        setStartDate(`${months[month]} ${year}`);
        if (month === 11) {
          setEndDate(`${months[0]} ${year + 1}`);
        }
        else {
          setEndDate(`${months[month + 1]} ${year}`);
        }
        return () => {
          setStartDate(null);
          setEndDate(null);
        }
      }, [])
    return (
        <>
            <div className={styles.analytics__Rank_card}>

                <div className={styles.analytics__rank_head}>
                    <h3 className={styles.rank__head_title}>{rankTitle}</h3>
                    <p className={styles.rank__type}><span className={styles.rank__icons}><img src={iconsRankType} alt={iconsRankType} /></span> {typeTitle}</p>
                </div>

                <div className={styles.analytics__rank_body}>
                <div className={styles.dateTimeBox}>
                <CalendarIcon />
                <span>
                  {startDate}
                </span>
                <span>{"-"}</span>
                <span>
                  {endDate}
                </span>
                {/* <AarrowIcon /> */}
              </div>
                    <h2 className={styles.rank__number}>{rankNumber}</h2>
                </div>

            </div>
        </>
    )
}

export default RankCard