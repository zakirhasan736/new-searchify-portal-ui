import React, { useEffect, useState } from 'react'
import styles from '../analytics.module.css';
import shapeImg6 from '../../../../assets/img/gradient-shape6.png';
import shapeImg7 from '../../../../assets/img/gradient-shape-7.png';
import repeatIcon from '../../../../assets/icon/repeat.png';
import germanFlag from '../../../../assets/img/germany.png'
import wordFlag from '../../../../assets/img/globe.png'
import arrowUp from '../../../../assets/icon/arrow-up.png'
import RankCard from '../../../core/rankcard/RankCard';
import { AarrowIcon, CalendarIcon } from '../icons';
import BreadCrumb from '../../../share/breadcrumb/BreadCrumb'


const AnalyzeOverview = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [topcatogries, setCategories] = useState([]);
  const [trendingKeyword, setTrendingWord] = useState([]);
  const [trendingFilter, setTredingFilter] = useState("game");
  const keywordCarddata = [
    {
      id: 1,
      rankTitle: 'Keyword Difficulty',
      typeTitle: 'Worldwide',
      rankNumber: '#11,456',
      iconsRankType: wordFlag,
    },
    {
      id: 2,
      rankTitle: 'CPC',
      typeTitle: 'Germany',
      rankNumber: '#11,456',
      iconsRankType: germanFlag,
    },
    {
      id: 3,
      rankTitle: 'Intent',
      typeTitle: 'industry name',
      rankNumber: '#11,456',
      iconsRankType: '',
    }
  ]
  useEffect(() => {
    let catdb = [
      {
        id: 1,
        categories: "game",
        share: "12"
      },
      {
        id: 2,
        categories: "education",
        share: "13"
      },
      {
        id: 3,
        categories: "sport",
        share: "47"
      },
      {
        id: 4,
        categories: "food",
        share: "67"
      },
      {
        id: 5,
        categories: "lifestyle",
        share: "75"
      },
      {
        id: 6,
        categories: "relious",
        share: "37"
      }
    ];
    setCategories(catdb);
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
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    let trenddb = [
      {
        id: 1,
        c_name: "game",
        trendingResult: [
          {
            id: 1,
            keyword: "eedfdf",
            vol: "13"
          },
          {
            id: 2,
            keyword: "eeeee",
            vol: "1"
          },
          {
            id: 3,
            keyword: "ssfdffdwr",
            vol: "4"
          },
          {
            id: 4,
            keyword: "edsdcsd",
            vol: "1"
          },
          {
            id: 5,
            keyword: "dzxcsfdss",
            vol: "3"
          },
          {
            id: 6,
            keyword: "sdscxsd",
            vol: "1"
          }
        ]
      },
      {
        id: 2,
        c_name: "education",
        trendingResult: [
          {
            id: 1,
            keyword: "seesswww",
            vol: "13"
          },
          {
            id: 2,
            keyword: "weddsdd",
            vol: "1"
          },
          {
            id: 3,
            keyword: "edfvr",
            vol: "4"
          },
          {
            id: 4,
            keyword: "ertfvv",
            vol: "1"
          },
          {
            id: 5,
            keyword: "ddvvv",
            vol: "3"
          },
          {
            id: 6,
            keyword: "sdsd",
            vol: "1"
          }
        ]
      },
      {
        id: 3,
        c_name: "sport",
        trendingResult: [
          {
            id: 1,
            keyword: "sdfds",
            vol: "1"
          },
          {
            id: 2,
            keyword: "sdsd",
            vol: "1"
          },
          {
            id: 3,
            keyword: "sfsde",
            vol: "3"
          },
          {
            id: 4,
            keyword: "vdfff",
            vol: "2"
          },
          {
            id: 5,
            keyword: "wewwe",
            vol: "2"
          },
          {
            id: 6,
            keyword: "qweqw",
            vol: "1"
          }
        ]
      },
      {
        id: 4,
        c_name: "food",
        trendingResult: [
          {
            id: 1,
            keyword: "qwdfdf",
            vol: "13"
          },
          {
            id: 2,
            keyword: "wewed",
            vol: "1"
          },
          {
            id: 3,
            keyword: "ssdwr",
            vol: "4"
          },
          {
            id: 4,
            keyword: "edsd",
            vol: "1"
          },
          {
            id: 5,
            keyword: "dsfdss",
            vol: "3"
          },
          {
            id: 6,
            keyword: "sdsd",
            vol: "1"
          }
        ]
      },
      {
        id: 5,
        c_name: "lifestyle",
        trendingResult: [
          {
            id: 1,
            keyword: "qwdfdf",
            vol: "13"
          },
          {
            id: 2,
            keyword: "wewed",
            vol: "1"
          },
          {
            id: 3,
            keyword: "ssdwr",
            vol: "4"
          },
          {
            id: 4,
            keyword: "edsd",
            vol: "1"
          },
          {
            id: 5,
            keyword: "dsfdss",
            vol: "3"
          },
          {
            id: 6,
            keyword: "sdsd",
            vol: "1"
          }
        ]
      },
      {
        id: 6,
        c_name: "relious",
        trendingResult: [
          {
            id: 1,
            keyword: "qwdfdf",
            vol: "13"
          },
          {
            id: 2,
            keyword: "wewed",
            vol: "1"
          },
          {
            id: 3,
            keyword: "ssdwr",
            vol: "4"
          },
          {
            id: 4,
            keyword: "edsd",
            vol: "1"
          },
          {
            id: 5,
            keyword: "dsfdss",
            vol: "3"
          },
          {
            id: 6,
            keyword: "sdsd",
            vol: "1"
          }
        ]
      }
    ];
    let filter = trenddb.filter(((item => item.c_name === trendingFilter)))
    setTrendingWord(filter);

    return () => {
      setTrendingWord([])
    }
  }, [trendingFilter]);

  return (
    <>
      <section className={styles.SEORanking__wrap_section}>
        <img className={styles.app_shape_img6} src={shapeImg6} alt={shapeImg6} />
        <img className={styles.app_shape_img7} src={shapeImg7} alt={shapeImg7} />
        <div className={styles.compare__site_box}>
          <div className={styles.breadcrumb__box}>
            <BreadCrumb />
          </div>
          <input className={styles.terget_website} placeholder='website.com' value='website.com' />
          <img src={repeatIcon} alt={repeatIcon} />
          <input className={styles.terget_website} placeholder='Compare to' />

        </div>
        <div className={styles.analytics_overview_titlebox}>
          <h2 className={styles.analytics_title}>Overview</h2>
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
        <div className={styles.traffics__overview__wrapper_new}>
          <div className={styles.traffic_engagement__overview}>
            <div className={styles.traffic_engagement_contbox}>
              {/* <h2 className={styles.analytics__overview__title}>Traffic and Engagement</h2> */}

              {/* total visite updates card */}
              <div className={styles.total__visites_wrapbox}>
                {/* cards 1 */}
                <div className={styles.analytics__total_visite_card}>

                  <div className={styles.visited_card__titlebox}>
                    <h className={styles.title}>Search volume</h>
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
                  <ul className={styles.statics__uypdates_list}>
                    <li>
                      <p>
                        <span className={styles.is__down_more}></span>
                        Zero-click searches
                      </p>
                      <span className={styles.percent_number}>16%</span>
                    </li>
                    <li>
                      <p>
                        <span className={styles.is__up_more}></span>
                        Clicked one or more times
                      </p>
                      <span className={styles.percent_number}>84%</span>
                    </li>
                  </ul>
                  <div className={styles.visitors__updates_cards}>
                    <h2 className={styles.total_number_visitor}>2.755M</h2>
                    <div className={styles.percentage_totalvisite}>
                      <span className={styles.percentage_month}><a href="/" ><img height='23px' src={arrowUp} alt={arrowUp} /> 9,8%</a> from last month</span>
                    </div>
                  </div>

                </div>
                {/* cards 2 */}
                <div className={styles.analytics__total_visite_card}>

                  <div className={styles.visited_card__titlebox}>
                    <h3 className={styles.title}>Search visits</h3>
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
                  <ul className={styles.statics__uypdates_list}>
                    <li>
                      <p>
                        <span className={styles.is__up_more}></span>
                        Organic
                      </p>
                      <span className={styles.percent_number}>100%</span>
                    </li>
                    <li>
                      <p>
                        <span className={styles.is__down_more}></span>
                        Paid
                      </p>
                      <span className={styles.percent_number}>0%</span>
                    </li>
                  </ul>
                  <div className={styles.visitors__updates_cards}>
                    <h2 className={styles.total_number_visitor}>1.312M</h2>
                    <div className={styles.percentage_totalvisite}>
                      <span className={styles.percentage_month}><a href="/" ><img height='23px' src={arrowUp} alt={arrowUp} /> 9,8%</a> from last month</span>
                    </div>
                  </div>

                </div>

              </div>

              <div className={styles.analytics__rank_card_wrapper}>
                {/* analytics rank card box */}
                {keywordCarddata.map(({ rankTitle, typeTitle, rankNumber, iconsRankType, id }) => (
                  <RankCard
                    key={id}
                    rankTitle={rankTitle}
                    typeTitle={typeTitle}
                    rankNumber={rankNumber}
                    iconsRankType={iconsRankType}
                  />
                ))}
              </div>

            </div>
            {/* =========== */}
            <div className={styles.traffic_engagement_contbox}>
              <h2 className={styles.analytics__overview__title}>Top competing websites for <span className={styles.target__sitename}>'website.com'</span></h2>
              <div className={styles.competitor__card_wrapperbox}>
                {/* total visite updates card */}
                <div className={styles.total__visites_wrapbox}>
                  {/* cards 1 */}
                  <div className={styles.analytics__total_visite_card}>

                    <div className={styles.visited_card__titlebox}>
                      <h3 className={styles.title}>230 Organic desktop competitors</h3>
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
                    <ul className={styles.statics__uypdates_list}>
                      <li>
                        <p>
                          Domain
                        </p>
                        <span>Traffic Share</span>
                      </li>
                      <li>
                        <p>
                          moviesmod.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 16%</span>
                      </li>
                      <li>
                        <p>
                          moviesmod.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 84%</span>
                      </li>
                      <li>
                        <p>
                          moviesmod.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 84%</span>
                      </li>
                      <li>
                        <p>
                          moviesmod.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 84%</span>
                      </li>
                      <li>
                        <p>
                          moviesmod.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 84%</span>
                      </li>
                    </ul>
                    {/* main card */}
                    <a href='/' className={styles.more__read}>See More</a>

                  </div>
                  {/* cards 2 */}
                  <div className={styles.analytics__total_visite_card}>

                    <div className={styles.visited_card__titlebox}>
                      <h3 className={styles.title}>0 Paid desktop competitors</h3>
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
                    <ul className={styles.statics__uypdates_list}>
                      <li>
                        <p>
                          Domain
                        </p>
                        <span>Traffic Share</span>
                      </li>
                      <li>
                        <p>
                          moviesmod.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 16%</span>
                      </li>
                      <li>
                        <p>
                          moviesmod.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 84%</span>
                      </li>
                      <li>
                        <p>
                          moviesmod.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 84%</span>
                      </li>
                      <li>
                        <p>
                          moviesmod.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 84%</span>
                      </li>
                      <li>
                        <p>
                          moviesmod.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 84%</span>
                      </li>
                    </ul>
                    <a href='/' className={styles.more__read}>See More</a>

                  </div>
                  {/* cards 3 */}
                  <div className={styles.analytics__total_visite_card}>

                    <div className={styles.visited_card__titlebox}>
                      <h3 className={styles.title}>126 Mobile competitors</h3>
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
                    <ul className={styles.statics__uypdates_list}>
                      <li>
                        <p>
                          Domain
                        </p>
                        <span>Traffic Share</span>
                      </li>
                      <li>
                        <p>
                          youtube.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 16%</span>
                      </li>
                      <li>
                        <p>
                          youtube.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 84%</span>
                      </li>
                      <li>
                        <p>
                          youtube.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 84%</span>
                      </li>
                      <li>
                        <p>
                          youtube.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 84%</span>
                      </li>
                      <li>
                        <p>
                          youtube.com
                        </p>
                        <span className={styles.percent_number}><img height='23px' src={arrowUp} alt={arrowUp} /> 84%</span>
                      </li>
                    </ul>

                    <a href='/' className={styles.more__read}>See More</a>
                  </div>
                </div>
              </div>
              {/* total visite updates card */}
              <div className={styles.total__visites_wrapbox}>
                {/* cards 1 */}
                <div className={styles.analytics__total_visite_card}>

                  <div className={styles.visited_card__titlebox}>
                    <h3 className={styles.title}>SERP Features
                    </h3>
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

                  <a href='/' className={styles.more__read}>See More</a>
                </div>

              </div>
            </div>

            {/* ========= */}
            <div className={styles.keyword__analyze_wrapper}>
              <div className={styles.traffic_engagement_contbox}>
                <h2 className={styles.analytics__overview__title}>Keyword ideas</h2>

                {/* ===========>> */}
                {/* total visite updates card */}
                <div className={styles.total__visites_wrapbox}>
                  {/* cards 1 */}
                  <div className={styles.analytics__total_visite_card}>

                    <div className={styles.visited_card__titlebox}>
                      <h3 className={styles.title}>Phrase match</h3>
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
                      <h2 className={styles.desc}>321 Keywords - 2.9M Total search visits</h2>
                    </div>
                    <ul className={styles.statics__uypdates_list}>
                      <li>
                        <p>
                          Keywords
                        </p>
                        <san>Volume</san>
                      </li>
                      <li>
                        <p>
                          moviesverse
                        </p>
                        <span className={styles.percent_number}>2,755,150</span>
                      </li>
                      <li>
                        <p>
                          moviesverse
                        </p>
                        <span className={styles.percent_number}>41,500</span>
                      </li>
                      <li>
                        <p>
                          moviesverse
                        </p>
                        <span className={styles.percent_number}>41,500</span>
                      </li>
                      <li>
                        <p>
                          moviesverse
                        </p>
                        <span className={styles.percent_number}>41,500</span>
                      </li>
                      <li>
                        <p>
                          moviesverse
                        </p>
                        <span className={styles.percent_number}>41,500</span>
                      </li>
                    </ul>
                    <a href='/' className={styles.more__read}>See More</a>
                  </div>
                  {/* cards 2 */}
                  <div className={styles.analytics__total_visite_card}>

                    <div className={styles.visited_card__titlebox}>
                      <h3 className={styles.title}>Related keywords</h3>
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
                      <h2 className={styles.desc}>1K Keywords - 1.7M Total search visits</h2>
                    </div>
                    <ul className={styles.statics__uypdates_list}>
                      <li>
                        <p>
                          Keywords
                        </p>
                        <san>Volume</san>
                      </li>
                      <li>
                        <p>
                          moviesverse
                        </p>
                        <span className={styles.percent_number}>2,755,150</span>
                      </li>
                      <li>
                        <p>
                          moviesverse
                        </p>
                        <span className={styles.percent_number}>41,500</span>
                      </li>
                      <li>
                        <p>
                          moviesverse
                        </p>
                        <span className={styles.percent_number}>41,500</span>
                      </li>
                      <li>
                        <p>
                          moviesverse
                        </p>
                        <span className={styles.percent_number}>41,500</span>
                      </li>
                      <li>
                        <p>
                          moviesverse
                        </p>
                        <span className={styles.percent_number}>41,500</span>
                      </li>
                    </ul>
                    <a href='/' className={styles.more__read}>See More</a>
                  </div>

                </div>
                <div className={styles.top__category__countrybox}>
                  {/* total visite updates card */}
                  <div className={styles.total__visites_wrapbox}>
                    {/* cards 1 */}
                    <div className={styles.analytics__total_visite_card}>

                      <div className={styles.visited_card__titlebox}>
                        <h3 className={styles.title}>Top categories</h3>
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
                        <h2 className={styles.desc}>321 Keywords - 2.9M Total search visits</h2>
                      </div>
                      <ul className={styles.statics__uypdates_list}>
                        <li>
                          <p>
                            Domain
                          </p>
                          <span>Traffic Share</span>
                          {/* ============ */}
                          <div className={styles.statics__uypdates_box}>
                            <div className={styles.visited_card__titlebox}>
                              <h3 className={styles.title}>Top categories</h3>
                            </div>
                            <ul className={styles.statics__uypdates_list}>
                              <li>
                                <p>
                                  Domain
                                </p>
                                <span>Traffic Share</span>
                              </li>

                              {
                                //trendingKeyword
                                trendingKeyword.map((items => (
                                  items.trendingResult.map((item => (
                                    <li>
                                      <p>
                                        {item.keyword}
                                      </p>
                                      <spn className={styles.percent_number}>{item.vol}%</spn>
                                    </li>
                                  )))
                                )))
                              }
                            </ul>
                          </div>
                          {/* ============== */}
                        </li>
                        {
                          topcatogries.map((item => (
                            <li onClick={() => setTredingFilter(item.categories)}>
                              <p>
                                {item.categories}
                              </p>
                              <span className={styles.percent_number}>{item.share}%</span>
                            </li>
                          )))
                        }
                      </ul>
                      {/* <a href='/' className={styles.more__read}>See More</a> */}
                    </div>
                    {/* cards 2 */}
                    <div className={styles.analytics__total_visite_card}>

                      <div className={styles.visited_card__titlebox}>
                        <h3 className={styles.title}>Top countries</h3>
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
                        <h2 className={styles.desc}>321 Keywords - 2.9M Total search visits</h2>
                      </div>
                      <ul className={styles.statics__uypdates_list}>
                        <li>
                          <p>
                            country
                          </p>
                          <span>Traffic Share</span>
                        </li>
                        <li>
                          <p>
                            India
                          </p>
                          <span className={styles.percent_number}>16%</span>
                        </li>
                        <li>
                          <p>
                            India
                          </p>
                          <span className={styles.percent_number}>84%</span>
                        </li>
                        <li>
                          <p>
                            India
                          </p>
                          <span className={styles.percent_number}>84%</span>
                        </li>
                        <li>
                          <p>
                            India
                          </p>
                          <span className={styles.percent_number}>84%</span>
                        </li>
                        <li>
                          <p>
                            India
                          </p>
                          <span className={styles.percent_number}>84%</span>
                        </li>
                      </ul>

                      <a href='/' className={styles.more__read}>See More</a>
                    </div>

                  </div>
                </div>
                {/* total visite updates card */}
                <div className={styles.total__visites_wrapbox}>
                  {/* cards 1 */}
                  <div className={styles.analytics__total_visite_card}>

                    <div className={styles.visited_card__titlebox}>
                      <h3 className={styles.title}>Top search ads</h3>
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
                    <a href='/' className={styles.more__read}>See More</a>
                  </div>

                  {/* cards 2 */}
                  <div className={styles.analytics__total_visite_card}>

                    <div className={styles.visited_card__titlebox}>
                      <h3 className={styles.title}>Top product ads</h3>
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
                    <a href='/' className={styles.more__read}>See More</a>
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

export default AnalyzeOverview