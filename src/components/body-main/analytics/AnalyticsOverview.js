import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from "react-router-dom";
import styles from './analytics.module.css';
import shapeImg6 from '../../../assets/img/gradient-shape6.png';
import shapeImg7 from '../../../assets/img/gradient-shape-7.png';
import repeatIcon from '../../../assets/icon/repeat.png';
import country1 from '../../../assets/img/country1.png'
import country2 from '../../../assets/img/country2.png'
import country3 from '../../../assets/img/country3.png'
import country4 from '../../../assets/img/country4.png'
import country5 from '../../../assets/img/country5.png'
import germanFlag from '../../../assets/img/germany.png'
import wordFlag from '../../../assets/img/globe.png'
import chartImg from '../../../assets/img/Chart.png'
import arrowUp from '../../../assets/icon/arrow-up.png'
import countrymap from '../../../assets/img/high-resolution-grey-map-of-the-world-split-into-individual-countries-free-vector-removebg-preview 2.png'
import RankCard from '../../core/rankcard/RankCard';
import { AarrowIcon, CalendarIcon } from './icons';

const AnalyticsOverview = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState(null);

  const location = useLocation();

  const rankCarddata = [
    {
      id: 1,
      rankTitle: 'Global rank',
      typeTitle: 'Worldwide',
      rankNumber: '#11,456',
      iconsRankType: wordFlag,
    },
    {
      id: 2,
      rankTitle: 'Country rank',
      typeTitle: 'Germany',
      rankNumber: '#11,456',
      iconsRankType: germanFlag,
    },
    {
      id: 3,
      rankTitle: 'Industry rank',
      typeTitle: 'industry name',
      rankNumber: '#11,456',
      iconsRankType: '',
    }
  ]

  useEffect(() => {
    if(location.state && websiteUrl == null) {
      setWebsiteUrl(location.state.websiteUrl)
    }
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
        <div className={styles.analytics_overview_titlebox}>
          <h2 className={styles.analytics_title}>Website Overview</h2>
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
        <div className={styles.compare__site_box}>
          <input className={styles.terget_website} placeholder='website.com' value={websiteUrl} />
          <img src={repeatIcon} alt={repeatIcon} />
          <input className={styles.terget_website} placeholder='Compare to' />

        </div>
        <div className={styles.traffic_engagement__overview}>
          <div className={styles.traffic_engagement_contbox}>
            <h2 className={styles.analytics__overview__title}>Traffic and Engagement</h2>

            {/* total visite updates card */}
            <div className={styles.analytics__total_visite_card}>

              <div className={styles.visited_card__titlebox}>
                <h3 className={styles.title}>Total Visits</h3>
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
              </div>

              <div className={styles.visitors__updates_cards}>
                <h2 className={styles.total_number_visitor}>32,898</h2>
                <div className={styles.percentage_totalvisite}>
                  <span className={styles.percentage_month}><a href="/" ><img height='23px' src={arrowUp} alt={arrowUp} /> 9,8%</a> from last month</span>
                </div>
              </div>

            </div>

            <div className={styles.analytics__rank_card_wrapper}>
              {/* analytics rank card box */}
              {rankCarddata.map(({ rankTitle, typeTitle, rankNumber, iconsRankType, id }) => (
                <RankCard
                  key={id}
                  rankTitle={rankTitle}
                  typeTitle={typeTitle}
                  rankNumber={rankNumber}
                  iconsRankType={iconsRankType}
                />
              ))}
            </div>

            {/* engagement overtime box */}
            <div className={styles.engagement_overview__wrapbox}>

              <div className={styles.engagement_overview__titlebox}>
                <h2 className={styles.overview__title}>Engagement overview</h2>
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
              </div>

              <div className={styles.overview__details_contbox}>

                <div className={styles.overview__details_cont_leftbox}>
                  <ul className={styles.engagement_overview_list}>
                    <li className={styles.overview_list_item}>
                      <h3 className={styles.overview_list_title}>Monthly Visits</h3>
                      <span className={styles.overview__number}>7,941</span>
                    </li>
                    <li className={styles.overview_list_item}>
                      <h3 className={styles.overview_list_title}>Monthly unique visitors</h3>
                      <span className={styles.overview__number}>{'<5000'}</span>
                    </li>
                    <li className={styles.overview_list_item}>
                      <h3 className={styles.overview_list_title}>Visits per unique visitor</h3>
                      <span className={styles.overview__number}>3</span>
                    </li>
                  </ul>
                </div>

                <div className={styles.overview__details_cont_rightbox}>
                  <div className={styles.overview__duration_box}>
                    <h3 className={styles.overview_duration_title}>Visit duration</h3>
                    <span className={styles.overview__number}>00:05:16</span>
                  </div>
                </div>

              </div>
            </div>

            {/* visits overtime */}
            <div className={styles.visits_overtime__wrapper}>
              <div className={styles.visits_overtime__cont}>
                <div className={styles.visites__overtime_titlecont}>

                  <div className={styles.visites__overtime_titlebox}>
                    <h3 className={styles.visites__overtime_title}>Visits Over Time</h3>
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
                  </div>

                  <div className={styles.visites__overview_info}>
                    <h2 className={styles.visites__overview_number}>32,898</h2>
                    <a href="#!" className={styles.overview__site_link} >website.com</a>
                  </div>

                </div>

                <div className={styles.overview__chart_box}>
                  <img src={chartImg} alt={chartImg} />
                </div>
              </div>
            </div>

            {/* top country visits  */}
            <div className={styles.top_country_visits_wrapper}>

              <div className={styles.top_country_titlebox}>
                <h3 className={styles.top_country_title}>Top countries</h3>
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
              </div>

              <div className={styles.top_country__details_box}>

                <div className={styles.top_country__details_leftbox}>
                  <img src={countrymap} alt={countrymap} />
                </div>

                <div className={styles.top_country__details_rightbox}>
                  <div className={styles.top_country__details_info}>

                    <div className={styles.top_country_maps}>
                      <h6 className={styles.top_country_title}>Country</h6>
                      <ul className={styles.top__country_listmap}>
                        <li className={styles.top__country_mapitem}>
                          <img src={country1} alt={country1} />
                          <span className={styles.top__country_name}>Germany</span>
                        </li>
                        <li className={styles.top__country_mapitem}>
                          <img src={country2} alt={country2} />
                          <span className={styles.top__country_name}>Canada</span>
                        </li>
                        <li className={styles.top__country_mapitem}>
                          <img src={country3} alt={country3} />
                          <span className={styles.top__country_name}>France</span>
                        </li>
                        <li className={styles.top__country_mapitem}>
                          <img src={country4} alt={country4} />
                          <span className={styles.top__country_name}>Switzerland</span>
                        </li>
                        <li className={styles.top__country_mapitem}>
                          <img src={country5} alt={country5} />
                          <span className={styles.top__country_name}>Brazil</span>
                        </li>
                      </ul>
                    </div>

                    <div className={styles.top_country__progress}>
                      <h6 className={styles.top_progress_title}>Users</h6>
                      <ul className={styles.top_country_progress_baritem}>
                        <li className={styles.top__ctry_progress_bar}></li>
                        <li className={styles.top__ctry_progress_bar}></li>
                        <li className={styles.top__ctry_progress_bar}></li>
                        <li className={styles.top__ctry_progress_bar}></li>
                        <li className={styles.top__ctry_progress_bar}></li>
                      </ul>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default AnalyticsOverview