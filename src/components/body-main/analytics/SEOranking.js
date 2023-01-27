import React, { useEffect, useState } from 'react'
import styles from './analytics.module.css'
import { TfiAngleRight } from "react-icons/tfi";
import shapeImg6 from '../../../assets/img/gradient-shape6.png'
import shapeImg7 from '../../../assets/img/gradient-shape-7.png'
import KeyRankUpdate from '../../share/keywordRanking/KeyRankUpdate'
import GraphModal from '../../../assets/img/graph.png'
import globaRankGraph from '../../../assets/img/Monthly traffic.png'
import RankingTable from '../../core/ranking-table';
import { AarrowIcon, CalendarIcon } from './icons';
const SEOranking = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const keywordRankData = [
    {
      id: 1,
      title: 'Keyword',
      subtitle: 'Keyword',
      RankSubtitle: 'Rank',
      RankTitle: '#37',
      graphImg: GraphModal,
    },
    {
      id: 2,
      title: 'Keyword',
      subtitle: 'Keyword',
      RankSubtitle: 'Rank',
      RankTitle: '#37',
      graphImg: GraphModal,
    },
    {
      id: 3,
      title: 'Keyword',
      subtitle: 'Keyword',
      RankSubtitle: 'Rank',
      RankTitle: '#37',
      graphImg: GraphModal,
    },
    {
      id: 4,
      title: 'Keyword',
      subtitle: 'Keyword',
      RankSubtitle: 'Rank',
      RankTitle: '#37',
      graphImg: GraphModal,
    },
    {
      id: 5,
      title: 'Keyword',
      subtitle: 'Keyword',
      RankSubtitle: 'Rank',
      RankTitle: '#37',
      graphImg: GraphModal,
    },
    {
      id: 6,
      title: 'Keyword',
      subtitle: 'Keyword',
      RankSubtitle: 'Rank',
      RankTitle: '#37',
      graphImg: GraphModal,
    },
    {
      id: 7,
      title: 'Keyword',
      subtitle: 'Keyword',
      RankSubtitle: 'Rank',
      RankTitle: '#37',
      graphImg: GraphModal,
    },
    {
      id: 8,
      title: 'Keyword',
      subtitle: 'Keyword',
      RankSubtitle: 'Rank',
      RankTitle: '#37',
      graphImg: GraphModal,
    },
    {
      id: 9,
      title: 'Keyword',
      subtitle: 'Keyword',
      RankSubtitle: 'Rank',
      RankTitle: '#37',
      graphImg: GraphModal,
    },
    {
      id: 10,
      title: 'Keyword',
      subtitle: 'Keyword',
      RankSubtitle: 'Rank',
      RankTitle: '#37',
      graphImg: GraphModal,
    },
  ]

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
      <section className={styles.SEORanking__wrap_section}>
        <img className={styles.app_shape_img6} src={shapeImg6} alt={shapeImg6} />
        <img className={styles.app_shape_img7} src={shapeImg7} alt={shapeImg7} />
        <div className={styles.SEORanking__cont_box}>
          <div className={styles.SEORanking__left_wrap}>
            <h3 className={styles.keyword_title}>Keyword rank</h3>
            <ul className={styles.keyword_ranking__Updates_list}>
              {keywordRankData.map(({ id, subtitle, title, graphImg, RankSubtitle, RankTitle }) => (
                <li className={styles.keyword_ranking__items}>
                  <KeyRankUpdate
                    key={id}
                    title={title}
                    subtitle={subtitle}
                    RankSubtitle={RankSubtitle}
                    RankTitle={RankTitle}
                    graphImg={graphImg}
                  />
                </li>
              ))}

            </ul>
          </div>
          <div className={styles.SEORanking__right_wrap}>

            <div className={styles.global__rank__titlebox}>
              <h3 className={styles.global_ranking__title}>Global ranking <span className={styles.arrowRight_icon}><TfiAngleRight /></span></h3>
              <div className={styles.dateTimeBox}>
                <CalendarIcon />
                <span>
                  {startDate}
                </span>
                <span>{"-"}</span>
                <span>
                  {endDate}
                </span>
                <AarrowIcon />
              </div>
            </div>
            <div className={styles.global__rank__updatesGraph}>
              <img className={styles.gobalRankGraph} src={globaRankGraph} alt={globaRankGraph} />
            </div>
            <RankingTable />
          </div>
        </div>
      </section>
    </>
  )
}

export default SEOranking