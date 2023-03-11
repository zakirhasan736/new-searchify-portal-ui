import React, {useState} from 'react';
import styles from '../analytics.module.css';
import shapeImg6 from '../../../../assets/img/gradient-shape6.png';
import shapeImg3 from '../../../../assets/img/gradient-shape3.png';
import shapeImg4 from '../../../../assets/img/gradient-shape4.png';
import infoCompanybrand from '../../../../assets/img/amazon-logo.png';
import trafficGraph from '../../../../assets/img/traffic-source.png'
import trafficSourceImg1 from '../../../../assets/img/traffic_sourceimg1.png' 
import audiencedImg1 from '../../../../assets/img/audience_graph1.png'
import audiencedImg2 from '../../../../assets/img/audience_graph2.png'
import graphMapModal from '../../../../assets/img/graphmap-modal.svg'
import {
  TfiArrowLeft,
  TfiExport,
  TfiAngleDown,
  TfiFacebook,
  TfiTwitterAlt,  
  TfiLinkedin,
  TfiLocationPin,
} from 'react-icons/tfi';
import {BsCurrencyExchange}  from 'react-icons/bs';
import { FiExternalLink,FiUsers } from 'react-icons/fi';
import {HiPlus} from 'react-icons/hi';
const TrafficOverview = () => {

    const [openListModal, setListModal] = useState(false);
  
    return (
      <>
        <section className={styles.keyword__wrap_section}>
          <img
            className={styles.app_shape_img6}
            src={shapeImg6}
            alt={shapeImg6}
          />
          <img
            className={styles.app_shape_img3}
            src={shapeImg3}
            alt={shapeImg3}
          />
          <img
            className={styles.app_shape_img4}
            src={shapeImg4}
            alt={shapeImg4}
          />
  
          <div className={styles.keyword__cont_box}>
            <div className={styles.keyword__cont_main}>
              <div className={styles.organic__research__top__view__box}>
                <div className={styles.keyword__top_box__wrap}>
                  <div className={styles.keyword__top_box_wrap}>
                  <a
                    href="/organicsearch/home"
                    className={styles.back_to_next__btn}
                  >
                    <span>
                      <TfiArrowLeft />
                    </span>{' '}
                    Go to all lists
                  </a>
                  <div className={styles.top__right_key__box}>
                      <button onClick={() => setListModal(!openListModal)} className={styles.share__info_item}>
                        <span className={styles.users__icon}>
                          <HiPlus />
                        </span>{' '}
                        Create list
                      </button>
                    </div>
                  </div>
           
  
                  <div className={styles.key__top__nav_items}>
                    <h2 className={styles.key__top_nav_title}>
                      Traffic Analytics:{' '}
                      <span className="link__text">
                        amazon.com{' '}
                        <a href="/">
                          <FiExternalLink />
                        </a>
                      </span>{' '}
                    </h2>
                    <div className={styles.top__right_key__box}>
                      <button className={styles.share__info_item}>
                        <span className={styles.users__icon}>
                          <TfiExport />
                        </span>{' '}
                        Export to PDF
                      </button>
                    </div>
                  </div>
  
                  <div className={styles.topbar__key__filter__itembox}>
                    <div className={styles.database__filter_wrap_box}>
                      <div className={styles.search__and_database__filterbox}>
                        <div className={styles.topbar__key__tabs__filter_wrap}>
                          <div className={styles.topbar__key__tabs__filter}>
                            <button className={styles.tabs__filters_btn}>
                              CA <span className={styles.number__fild}>3.7k</span>
                            </button>
                            <button className={styles.tabs__filters_btn}>
                              US <span className={styles.number__fild}>3.2k</span>
                            </button>
                            <button className={styles.tabs__filters_btn}>
                              AU <span className={styles.number__fild}>362</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
  
                  <div className={styles.filter__tabs__Box}>
                    <button className={styles.filter__tabs__btn__items}>
                      Overview
                    </button>
                    <button className={styles.filter__tabs__btn__items}>
                      Audience Insights
                    </button>
                    <button className={styles.filter__tabs__btn__items}>
                      Traffic Journey
                    </button>
                    <button className={styles.filter__tabs__btn__items}>
                      Top Pages
                    </button>
                    <button className={styles.filter__tabs__btn__items}>
                      Subfolders
                    </button>
                    <button className={styles.filter__tabs__btn__items}>
                      Subdomains
                    </button>
                    <button className={styles.filter__tabs__btn__items}>
                      Geo Distribution
                    </button>
                    <button className={styles.filter__tabs__btn__items}>
                      Bulk Analysis
                    </button>
                  </div>
                  
                </div>
              </div>
              <div className={styles.organic__insight_overview_tabs1}>
                {/* ============= */}
                <div className={styles.insight__overview__middlecont}>
                  <div className={styles.keyword__overlape__box}>
                    <div className={styles.traffics__compare_box}>
                      <div className={styles.compare__fild__box_cont}>
                        <div className={styles.keyword__input_item_mainbox}>
                          <div className={styles.keyword_inputfild__contbox}>
                            <div className={styles.keyword__input_fildbox}>
                              <label
                                htmlFor="text"
                                className={styles.seal__text_color}
                              >
                                <span>You</span>
                              </label>
                              <input
                                type="text"
                                className={styles.add__domain_fild}
                                placeholder="add domain"
                              />
                            </div>
                          </div>
                        </div>
  
                        {/* ===================== */}
                        <div className={styles.keyword__input_item_mainbox}>
                          <div className={styles.keyword_inputfild__contbox}>
                            <div className={styles.keyword__input_fildbox}>
                              <label
                                htmlFor="text"
                                className={styles.seal__text_color}
                              >
                                <span></span>
                              </label>
                              <input
                                type="text"
                                className={styles.add__domain_fild}
                                placeholder="add domain"
                              />
                            </div>
                          </div>
                        </div>
                        {/* ===================== */}
                        <div className={styles.keyword__input_item_mainbox}>
                          <div className={styles.keyword_inputfild__contbox}>
                            <div className={styles.keyword__input_fildbox}>
                              <label
                                htmlFor="text"
                                className={styles.seal__text_color}
                              >
                                <span></span>
                              </label>
                              <input
                                type="text"
                                className={styles.add__domain_fild}
                                placeholder="add domain"
                              />
                            </div>
                          </div>
                        </div>
                        {/* ===================== */}
                        <div className={styles.keyword__input_item_mainbox}>
                          <div className={styles.keyword_inputfild__contbox}>
                            <div className={styles.keyword__input_fildbox}>
                              <label
                                htmlFor="text"
                                className={styles.seal__text_color}
                              >
                                <span></span>
                              </label>
                              <input
                                type="text"
                                className={styles.add__domain_fild}
                                placeholder="add domain"
                              />
                            </div>
                          </div>
                        </div>
                        {/* ===================== */}
                        <div className={styles.keyword__input_item_mainbox}>
                          <div className={styles.keyword_inputfild__contbox}>
                            <div className={styles.keyword__input_fildbox}>
                              <label
                                htmlFor="text"
                                className={styles.seal__text_color}
                              >
                                <span></span>
                              </label>
                              <input
                                type="text"
                                className={styles.add__domain_fild}
                                placeholder="add domain"
                              />
                            </div>
                          </div>
                        </div>
  
                        <div className={styles.compare__control__box}>
                          <div className={styles.competitor__controll_box}>
                            <button className={styles.compare__button}>
                              Compare
                            </button>
                          </div>
                        </div>
                      </div>
  
                      {/* =================== */}
                      <div className={styles.keyword__insight__graph}>
                        <div className={styles.insight__overview_box}>
                          <h6 className={styles.insight__title}>Visits</h6>
                          <h6 className={styles.insight__title}>Dec 2022</h6>
                          <h3 className={styles.insight__info}>
                            2.9B{' '}
                            <span className={styles.insight_percent}>↓1.41%</span>
                          </h3>
                        </div>
  
                        <div className={styles.insight__overview_box}>
                          <h6 className={styles.insight__title}>
                            {' '}
                            Unique Visitors
                          </h6>
                          <h6 className={styles.insight__title}>Dec 2022</h6>
                          <h3 className={styles.insight__info}>
                            933.4M{' '}
                            <span className={styles.insight_percent}>↓1.57%</span>
                          </h3>
                        </div>
                        <div className={styles.insight__overview_box}>
                          <h6 className={styles.insight__title}>
                            {' '}
                            Pages / Visit
                          </h6>
                          <h6 className={styles.insight__title}>Dec 2022</h6>
                          <h3 className={styles.insight__info}>
                            5.71{' '}
                            <span className={styles.insight_percent}>↓4.34%</span>
                          </h3>
                        </div>
                        <div className={styles.insight__overview_box}>
                          <h6 className={styles.insight__title}>
                            {' '}
                            Avg. Visit Duration{' '}
                          </h6>
                          <h6 className={styles.insight__title}> Dec 2022</h6>
                          <h3 className={styles.insight__info}>
                            13:06{' '}
                            <span className={styles.insight_percent}>↓3.08%</span>
                          </h3>
                        </div>
                        <div className={styles.insight__overview_box}>
                          <h6 className={styles.insight__title}>Bounce Rate</h6>
                          <h6 className={styles.insight__title}>Dec 2022</h6>
                          <h3 className={styles.insight__info}>
                            43.40%{' '}
                            <span className={styles.insight_percent}>↓0.39%</span>
                          </h3>
                        </div>
                      </div>
                        
                      <div
                        className={styles.traffic__analytics__merket_statics_box}
                      >
                        <h6 className={styles.traffic__statics_title}>
                          Market Metrics{' '}
                          <span className={styles.traffics__date}>Dec 2022</span>
                        </h6>
                        <ul className={styles.traffics__statics_list}>
                          <li
                            className={styles.traffics__analytics__statics_item}
                          >
                            <h6 className={styles.traffic__statics_title}>
                              Market Share{' '}
                              <span className={styles.traffics__update}>
                                5.91%
                              </span>
                            </h6>
                          </li>
                          <li
                            className={styles.traffics__analytics__statics_item}
                          >
                            <h6 className={styles.traffic__statics_title}>
                              Market Traffic
                              <span className={styles.traffics__update}>
                                45.7B ↑
                              </span>
                            </h6>
                          </li>
                          <li
                            className={styles.traffics__analytics__statics_item}
                          >
                            <a href="/" className={styles.link__page}>
                              Explore your market
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
  
                  {/* ============= */}
                  <div className={styles.trend__by_device_analytics__box}>
                    <div className={styles.top__title__box}>
                      <h4 className={styles.top__title}>
                        Trend by{' '}
                        <button>
                          {' '}
                          Device{' '}
                          <span className={styles.arrow__down}>
                            <TfiAngleDown />
                          </span>
                        </button>{' '}
                      </h4>
  
                      <div className={styles.top__right_key__box}>
                        <button className={styles.share__info_item}>
                          <span className={styles.users__icon}>
                            <TfiExport />
                          </span>{' '}
                          Export
                        </button>
                      </div>
                    </div>
  
                    <div className={styles.keyword_middle_insight__graph}>
                      <div className={styles.insight__graph_top_tabs}>
                        <ul className={styles.insight__category_tabs}>
                          <li className={styles.insight__category_item}>
                            {' '}
                            <button className={styles.tabs__btn}> Visits </button>
                          </li>
                          <li className={styles.insight__category_item}>
                            {' '}
                            <button className={styles.tabs__btn}>
                              {' '}
                              Unique Visitors{' '}
                            </button>
                          </li>
                          <li className={styles.insight__category_item}>
                            {' '}
                            <button className={styles.tabs__btn}>
                              {' '}
                              Pages / Visit{' '}
                            </button>
                          </li>
                          <li className={styles.insight__category_item}>
                            {' '}
                            <button className={styles.tabs__btn}>
                              {' '}
                              Avg. Visit Duration{' '}
                            </button>
                          </li>
                          <li className={styles.insight__category_item}>
                            {' '}
                            <button className={styles.tabs__btn}>
                              {' '}
                              Bounce Rate{' '}
                            </button>
                          </li>
                        </ul>
                        <div className={styles.insight__view_right_cont}>
                          <ul className={styles.insight__category_tabs}>
                            <li className={styles.insight__category_item}>
                              {' '}
                              <button className={styles.tabs__btn}>
                                {' '}
                                Months
                              </button>
                            </li>
                            <li className={styles.insight__category_item}>
                              {' '}
                              <button className={styles.tabs__btn}>
                                {' '}
                                Quarters{' '}
                              </button>
                            </li>
                          </ul>
                          <div className={styles.insight__tract_by_time}>
                            <button className={styles.nsight_time_select_update}>
                              Last 6 months{' '}
                              <span className={styles.arrow__down}>
                                <TfiAngleDown />
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className={styles.keyword_middle_insight__graph}>
                      <div className={styles.graph__insight_overview}>
                        <img src={trafficSourceImg1} alt={trafficSourceImg1} className="traffic_journy_graph" />
                      </div>
                      <button className={styles.view__more}>
                        View full report
                      </button>
                    </div>
                    </div>
                  </div>
  
                  <div className={styles.traffic__share_leftbox}>
                    <div className={styles.top__title__box}>
                      <div className={styles.top_title_box_wrap}>
                        <ul className={styles.insight__category_tabs}>
                          <li className={styles.insight__category_item}>
                            {' '}
                            <button className={styles.tabs__btn}>
                              {' '}
                              Top Pages{' '}
                            </button>
                          </li>
                          <li className={styles.insight__category_item}>
                            {' '}
                            <button className={styles.tabs__btn}>
                              {' '}
                              Top Subfolders{' '}
                            </button>
                          </li>
                          <li className={styles.insight__category_item}>
                            {' '}
                            <button className={styles.tabs__btn}>
                              {' '}
                              Top Subdomains{' '}
                            </button>
                          </li>
                        </ul>
                        <div className={styles.top_title_cont_wrap}>
                          <h4 className={styles.top__title}>All device </h4>
                          <button className={styles.date_title_widget}>
                            Dec 2022
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className={styles.insight_graph__box_overview}>
                      <div className={styles.keyword__insight__graph}>
                        <div className={styles.insight__graph__top_head}>
                          <h6 className={styles.title}>Page</h6>
                          <h6 className={styles.title}>Traffic Share</h6>
                          <h6 className={styles.title}>Unique Pageviews</h6>
                          <h6 className={styles.title}>Unique Visitors</h6>
                        </div>
                        <ul className={styles.insight__graph_details}>
                          <li className={styles.insight__graph__item}>
                          <div className={styles.insight__graph_details}>
                            <a href="/" className={styles.graph_item_link}>
                            amazon.com
                              <span className={styles.arrow_right_icon}>
                                <FiExternalLink />
                              </span>
                            </a>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                          </li>
                          <li className={styles.insight__graph__item}>
                          <div className={styles.insight__graph_details}>
                            <a href="/" className={styles.graph_item_link}>
                            /ap/signin
                              <span className={styles.arrow_right_icon}>
                                <FiExternalLink />
                              </span>
                            </a>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                          </li>
                          <li className={styles.insight__graph__item}>
                            <div className={styles.insight__graph_details}>
                            <a href="/" className={styles.graph_item_link}>
                            /ap/signin
                              <span className={styles.arrow_right_icon}>
                                <FiExternalLink />
                              </span>
                            </a>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                          </li>
                          <li className={styles.insight__graph__item}>
                          <div className={styles.insight__graph_details}>
                            <a href="/" className={styles.graph_item_link}>
                            /ap/signin
                              <span className={styles.arrow_right_icon}>
                                <FiExternalLink />
                              </span>
                            </a>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                          </li>
                          <li className={styles.insight__graph__item}>
                          <div className={styles.insight__graph_details}>
                            <a href="/" className={styles.graph_item_link}>
                            /gp/buy/thankyou/handlers/display.html
  
                              <span className={styles.arrow_right_icon}>
                                <FiExternalLink />
                              </span>
                            </a>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                          </li>
                        </ul>
                      </div>
                      <button className={styles.view__more}>
                        View full report
                      </button>
                    </div>
                  </div>
  
                  <div className={styles.traffic__share_rightbox}>
                    <div className={styles.top__title__box}>
                      <div className={styles.top_title_cont_wrap}>
                        <h4 className={styles.top__title}>Traffic Share </h4>
                        <button className={styles.date_title_widget}>
                          Dec 2022
                        </button>
                      </div>
  
                      <div className={styles.top__right_key__box}>
                        <button className={styles.share__info_item}>
                          <span className={styles.users__icon}>
                            <TfiExport />
                          </span>{' '}
                          Export
                        </button>
                      </div>
                    </div>
                    <div className={styles.insight_graph__box_overview}></div>
                  </div>
  
                  <div className={styles.trend__by_device_analytics__box}>
                    <div className={styles.top__title__box}>
                      <div className={styles.content_wrap_box}>
                        <h4 className={styles.top__title}>Traffic Sources by 
                        <button>
                            {' '}
                            Type{' '}
                            <span className={styles.arrow__down}>
                              <TfiAngleDown />
                            </span>
                          </button>{' '}
                        </h4>
                        <div className={styles.top_title_cont_wrap}>
                          <h4 className={styles.top__title}>All device </h4>
                        </div>
                      </div>
  
                      <div className={styles.top__right_key__box}>
                        <button className={styles.share__info_item}>
                          <span className={styles.users__icon}>
                            <TfiExport />
                          </span>{' '}
                          Export
                        </button>
                      </div>
                    </div>
  
                    <div className={styles.keyword_middle_insight__graph}>
                      <div className={styles.insight__graph_top_tabs}>
                        <ul className={styles.insight__category_tabs}></ul>
                        <div className={styles.insight__view_right_cont}>
                          <ul className={styles.insight__category_tabs}>
                            <li className={styles.insight__category_item}>
                              {' '}
                              <button className={styles.tabs__btn}>
                                {' '}
                                Months
                              </button>
                            </li>
                            <li className={styles.insight__category_item}>
                              {' '}
                              <button className={styles.tabs__btn}>
                                {' '}
                                Quarters{' '}
                              </button>
                            </li>
                          </ul>
                          <div className={styles.insight__tract_by_time}>
                            <button className={styles.nsight_time_select_update}>
                              Last 6 months{' '}
                              <span className={styles.arrow__down}>
                                <TfiAngleDown />
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className={styles.keyword_middle_insight__graph}>
                      <div className={styles.graph__insight_overview}>
                        <img src={trafficSourceImg1} alt={trafficSourceImg1} className="traffic_journy_graph"  />
                      </div>
                      <button className={styles.view__more}>
                        View full report
                      </button>
                    </div>
               
                    </div>
                  </div>
  
                  <div className={styles.trend__by_device_analytics__box}>
                    <div className={styles.top__title__box}>
                      <div className={styles.content_wrap_box}>
                        <h4 className={styles.top__title}>Traffic Journey </h4>
                        <div className={styles.top_title_cont_wrap}>
                          <h4 className={styles.top__title}>All device </h4>
                          <button className={styles.date_title_widget}>
                            Dec 2022
                          </button>
                        </div>
                      </div>
                      <div className={styles.top__right_key__box}>
                        <button className={styles.share__info_item}>
                          <span className={styles.users__icon}>
                            <TfiExport />
                          </span>{' '}
                          Export
                        </button>
                      </div>
  
                    </div>
  
                    <div className={styles.keyword_middle_insight__graph}>
                      <div className={styles.graph__insight_overview}>
                        <img src={trafficGraph} alt={trafficGraph} className="traffic_journy_graph" />
                      </div>
                      <button className={styles.view__more}>
                        View full report
                      </button>
                    </div>
                  </div>
  
                  <div className={styles.trend__by_device_analytics__box}>
                    <div className={styles.top__title__box}>
                      <div className={styles.content_wrap_box}>
                        <h4 className={styles.top__title}>Audience </h4>
                        <div className={styles.top_title_cont_wrap}>
                          <h4 className={styles.top__title}>All device </h4>
                          <button className={styles.date_title_widget}>
                            Dec 2022
                          </button>
                        </div>
                      </div>
                      <div className={styles.top__right_key__box}>
                        <button className={styles.share__info_item}>
                          <span className={styles.users__icon}>
                            <TfiExport />
                          </span>{' '}
                          Export
                        </button>
                      </div>
                    </div>
  
                    <div className={styles.keyword_middle_insight__graph}>
                      <div className={styles.graph__insight_overview}>
                        <div className={styles.grid_wrap}>
                        <div className={styles.large_span_8}>
                          <div className={styles.graph__insight_left}>
                          <img src={audiencedImg1} alt={audiencedImg1} className="audienced_graph" height={'280px'} />
                          </div>
                        </div>
                        <div className={styles.large_span_4}>
                          <div className={styles.graph__insight_right}>
                          <img src={audiencedImg2} alt={audiencedImg2} className="audienced_graph" height={'280px'} />
                          </div>
                        </div>
                        </div>
                      </div>
                      <button className={styles.view__more}>
                        View full report
                      </button>
                    </div>
                  </div>
  
                  <div className={styles.trend__by_device_analytics__box}>
                    <div className={styles.top__title__box}>
                      <div className={styles.content_wrap_box}>
                        <h4 className={styles.top__title}>
                          Distribution by{' '}
                          <button>
                            {' '}
                            Country{' '}
                            <span className={styles.arrow__down}>
                              <TfiAngleDown />
                            </span>
                          </button>{' '}
                        </h4>
                        <div className={styles.top_title_cont_wrap}>
                          <h4 className={styles.top__title}>All device </h4>
                          <button className={styles.date_title_widget}>
                            Dec 2022
                          </button>
                        </div>
                      </div>
                      <div className={styles.top__right_key__box}>
                        <button className={styles.share__info_item}>
                          <span className={styles.users__icon}>
                            <TfiExport />
                          </span>{' '}
                          Export
                        </button>
                      </div>
                    </div>
  
                    <div className={styles.keyword_middle_insight__graph}>
                      <div className={styles.insight__graph_top_tabs}>
                        <div className={styles.insight__view_right_cont}>
                          <ul className={styles.insight__category_tabs}>
                            <li className={styles.insight__category_item}>
                              {' '}
                              <button className={styles.tabs__btn}>
                                {' '}
                                Visits
                              </button>
                            </li>
                            <li className={styles.insight__category_item}>
                              {' '}
                              <button className={styles.tabs__btn}>
                                {' '}
                                Unique Visitors{' '}
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className={styles.graph__insight_overview}>
                        <div className={styles.graph__insight_leftbox}> 
                        <div className={styles.insight_graph__box_overview}>
                      <div className={styles.keyword__insight__graph}>
                        <div className={styles.insight__graph__top_head}>
                          <h6 className={styles.title}>Country</h6>
                          <h6 className={styles.title}>All device</h6>
                          <h6 className={styles.title}>Desktop</h6>
                          <h6 className={styles.title}>Mobile</h6>
                        </div>
                        <ul className={styles.insight__graph_details}>
                        <li className={styles.insight__graph__item}>
                          <div className={styles.insight__graph_details}>
                            <a href="/" className={styles.graph_item_link}>
                            United States
                             
                            </a>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <div className={styles.insight_right__item}>
                            <span className={styles.percent_number}>71.84%</span>
                              <span className={styles.percent_number}>2.1B</span>
                            </div>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                          </li>
                          <li className={styles.insight__graph__item}>
                          <div className={styles.insight__graph_details}>
                            <a href="/" className={styles.graph_item_link}>
                            India
                             
                            </a>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <div className={styles.insight_right__item}>
                            <span className={styles.percent_number}>71.84%</span>
                              <span className={styles.percent_number}>2.1B</span>
                            </div>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                          </li>
                          <li className={styles.insight__graph__item}>
                          <div className={styles.insight__graph_details}>
                            <a href="/" className={styles.graph_item_link}>
                            United Kingdom
                             
                            </a>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <div className={styles.insight_right__item}>
                            <span className={styles.percent_number}>71.84%</span>
                              <span className={styles.percent_number}>2.1B</span>
                            </div>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                          </li>
                          <li className={styles.insight__graph__item}>
                          <div className={styles.insight__graph_details}>
                            <a href="/" className={styles.graph_item_link}>
                            Canada
                             
                            </a>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <div className={styles.insight_right__item}>
                            <span className={styles.percent_number}>71.84%</span>
                              <span className={styles.percent_number}>2.1B</span>
                            </div>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                          </li>
                          <li className={styles.insight__graph__item}>
                          <div className={styles.insight__graph_details}>
                            <a href="/" className={styles.graph_item_link}>
                            Germany
                             
                            </a>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <div className={styles.insight_right__item}>
                            <span className={styles.percent_number}>71.84%</span>
                              <span className={styles.percent_number}>2.1B</span>
                            </div>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                            <div className={styles.insight__graph_details}>
                            <span className={styles.insight_right__item}>
                              1,000
                            </span>
                            </div>
                          </li>
                        </ul>
                      </div>
                      
                    </div>
                        </div>
                        <div className={styles.graph__insight_righttbox}>
                          <div className={styles.graph__modal_map}>
                            <img src={graphMapModal} alt={graphMapModal} className={styles.graph_modal__img} width={'100%'} height={'325px'} />
                          </div>
                        </div>
                      </div>
                      <button className={styles.view__more}>
                        View full report
                      </button>
                    </div>
                  </div>
  
  
                  {/* ============company info>>> */}
  
                  <div className={styles.trend__by_device_analytics__box}>
                    <div className={styles.top__title__box}>
                      <div className={styles.content_wrap_box}>
                        <h4 className={styles.top__title}>Company Info </h4>
                      </div>
                    </div>
  
                    <div className={styles.keyword_middle_insight__graph}>
                      <div className={styles.info__insight_overview}>
                        <div className={styles.company__logo}>
                          <a href="/" className={styles.company__brand_logo}>
                            <img src={infoCompanybrand} alt={infoCompanybrand} />
                          </a>
                        </div>
                        <div className={styles.info__details_content}>
                          <h3 className={styles.key__top_nav_title}>
                            Amazon{' '}
                            <span className="link__text">
                              {' '}
                              <a href="https://amazon.com">
                                <FiExternalLink />
                              </a>
                            </span>{' '}
                          </h3>
                          <ul className={styles.social__widget__links}>
                            <li className={styles.socials__link_item}>
                              <a href="/">
                                <span>
                                  <TfiFacebook />
                                </span>
                              </a>
                            </li>
                            <li className={styles.socials__link_item}>
                              <a href="/">
                                <span>
                                  <TfiTwitterAlt />
                                </span>
                              </a>
                            </li>
                            <li className={styles.socials__link_item}>
                              <a href="/">
                                <span>
                                  <TfiLinkedin />
                                </span>
                              </a>
                            </li>
                          </ul>
  
                          <p className={styles.info__desc_text}>
                            {' '}
                            Amazon is an e-commerce website for consumers,
                            sellers, and content creators.
                          </p>
                          <ul className={styles.category__info_item}>
                            <li className={styles.category_items}>
                              <a href="/">Crowdsourcing</a>
                            </li>
                            <li className={styles.category_items}>
                              <a href="/">Delivery</a>
                            </li>
                            <li className={styles.category_items}>
                              <a href="/">E-Commerce</a>
                            </li>
                            <li className={styles.category_items}>
                              <a href="/">Retail</a>
                            </li>
                          </ul>
                          <ul className={styles.company_info__box}>
                          <li className="company_location">
                            <span className="location_icon">
                              <TfiLocationPin />
                            </span>{' '}
                            Seattle, United States
                          </li>
                          <li className="company_location">
                            <span className="users_icon">
                              <FiUsers />
                            </span>{' '}
                            10,001+
                          </li>
                          <li className="company_location">
                            <span className="earb_icon">
                             <BsCurrencyExchange />
                            </span>{' '}
                            $8,108,000,000
                          </li>
                          <li className="company_location">
                            Founded Date: Jul 05, 1994
                          </li>
                          </ul>
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* =============create list popup box================ */}
            {
                  openListModal && 
            <div className={styles.create__list_keyword_popup}>
                 <h4 className={styles.keyword__popup_title}>Create list</h4>
                 <div className={styles.create__list_details_Box}>
  
                    <div className={styles.list_box}>
                      <label htmlFor="textInput" className={styles.list_input_title}>List name</label>
                      <div className={styles.input_box}>
                      <input type="text" className={styles.list_input_item} placeholder='Competitor List 1' />
                      </div>
                    </div>
  
                    <div className={styles.list_box}>
                      <label  className={styles.list_input_title}>Location</label>
                      <div className={styles.input_box}>
                      <input type='text' className={styles.list_input_item} placeholder='Worldwide' />
                      <span className="arrow_down_icons"></span>
                      </div>
                    </div>
  
                 </div>
  
                 <div className={styles.list_box}>
                  <label htmlFor="text" className={styles.list_input_title}>Competitors <span>0/20</span></label>
                  <div className={styles.input_box}>
                  <input type="text" className={styles.list_input_item} placeholder='Enter domains, subdomains, or subfolders' />
                  </div>
                 </div>
  
                 <div className={styles.create_list_btnbox}>
                  <button className={styles.create_analyze_btn}>Create and analyze</button>
                  <button onClick={() => setListModal(false)} className={styles.cancel__btn}>Cancel</button>
                 </div>
            </div>
  }
            {/* ============ */}
          </div>
        </section>
      </>
    );
  };
  
  export default TrafficOverview