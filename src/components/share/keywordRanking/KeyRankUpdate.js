import React from 'react'
import styles from './KeyRankUpdate.module.css'

const KeyRankUpdate = ({subtitle,title,graphImg,RankSubtitle,RankTitle }) => {
    
  return (
    <>
    <div className={styles.keyword__rank__wrap}>
          <div className={styles.keyword_left_cont}>
            <h6 className={styles.subtitle}>{subtitle}</h6>
            <h2 className={styles.title}>{title}</h2>
          </div>
          <div className={styles.keyword_mid_cont}>
            <img className={styles.graph_modal} src={graphImg} alt={graphImg} />
          </div>
          <div className={styles.keyword_right_cont}>
          <h6 className={styles.subtitle}>{RankSubtitle}</h6>
            <h2 className={styles.title}>{RankTitle}</h2>
          </div>
    </div>
    </>
  )
}

export default KeyRankUpdate