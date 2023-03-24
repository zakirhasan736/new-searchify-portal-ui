import React, { useState, useEffect } from 'react';
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
import { BsCurrencyExchange } from 'react-icons/bs';
import { FiExternalLink, FiUsers } from 'react-icons/fi';
import { HiPlus } from 'react-icons/hi';
import db from './db.json';
import Loader from '../../../share/loader/Loader';
import Dropdown from './Dropdown';


const TrafficOverview = () => {

  const [openListModal, setListModal] = useState(false);
  const [tabs, setTabs] = useState([
    {
      id: 1,
      name: "ca",
      number: "1.3"
    },
    {
      id: 2,
      name: "us",
      number: "2.5"
    },
    {
      id: 3,
      name: "au",
      number: "1.8"
    }
  ]);
  const [filterTabs, setFiltertabs] = useState(tabs);
  const [tabs2, setTabs2] = useState([
    {
      id: 1,
      name: "Overview"
    },
    {
      id: 2,
      name: "Audience Insights"
    },
    {
      id: 3,
      name: "Traffic Journey"
    },
    {
      id: 4,
      name: "Top Pages"
    },
    {
      id: 5,
      name: "Subfolders"
    },
    {
      id: 6,
      name: "Subdomains"
    },
    {
      id: 7,
      name: "Geo Distribution"
    },
    {
      id: 8,
      name: "Bulk Analysis"
    }
  ]);
  const [activetab, setActiveTab] = useState("Overview");
  const [data, setData] = useState([]);
  const [selectedPage, setSelectedPage] = useState("top_pages");
  const [tab3db1, setTab3db1] = useState([]);
  const [tab3db, setTab3db] = useState([]);
  const [tab3db11, setTab3db11] = useState([]);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState("Last 6 months");
  const [selectedMq, setSelectedMq] = useState("m");
  const [openOpt, openOption] = useState(false);
  const [visitorType, setVisitorType] = useState("Visits")
  //second options
  const [options1, setOptions1] = useState([]);
  const [selectedOption1, setSelectedOption1] = useState("Last 6 months");
  const [selectedMq1, setSelectedMq1] = useState("m");
  const [openOpt1, openOption1] = useState(false);
  //selected visit option
  const [visitdb, setvisitDb] = useState([]);
  const [input, setInput] = useState();
  const [clear, setClearfield] = useState(false);
  //handle country state
  const [country, setCountries] = useState([]);
  const [selectedcountry, setCountry] = useState();
  const [opencountry, setOpenCountry] = useState(false);
  const [opencountry1, setOpenCountry1] = useState(false);

  //handle created list state
  const [domains, setdomains] = useState([]);
  const [domains2, setdomains2] = useState([]);
  const [opendomain, setOpendomain] = useState(false);
  const [openCompitior, setOpenCompitior] = useState(false);
  const [compitor, setCompitorList] = useState();
  const [selectedcountry1, setCountry1] = useState();
  const [list, setList] = useState([]);

  //handle multiple compitior
  const [targetList, setTargetList] = useState([]);
  const [targetList1, setTargetList1] = useState([])
  const [more, setMore] = useState(false);

  const handleCountry = (props) => {
    setOpenCountry(false);
    let find = filterTabs.filter((item) => item.name.common === props.name.common)
    if (find.length === 0 && filterTabs.length < 3) {
      setCountry(props);
      setFiltertabs(prev => [...prev, props]);
    }
    if (find.length === 0 && filterTabs.length === 3) {
      let find = filterTabs.filter((item) => item.name.common !== filterTabs[0].name.common);
      setFiltertabs(find)
      setCountry(props);
      setFiltertabs(prev => [...prev, props]);
    }
  }

  const handleTabs2 = (props) => {
    setActiveTab(props);
  }

  const handleChange = (name, value) => {
    setTargetList(prev => [...prev, value]);
    setInput({
      ...input,
      [name]: value
    })

  };

  const hnadleCompare = () => {
    if (input.domain_1 !== undefined && input.domain_2 !== undefined) {
      let dbs = db.filter((item => item.category === "Audience Insights"));
      let db1 = dbs[0].trend_devices.filter((item => item.name === "Visits"));
      setData(dbs);
      setTab3db(db1);
      setTargetList1(targetList);
      setMore(true);
    }
  }
  const handleResetAll = () => {
    setTargetList1([]);
    setMore(false);
    setClearfield(true);
  }
  const handleSelected = (props) => {
    setSelectedOption(props)
    openOption(false);
  }
  const handleSelected1 = (props) => {
    setSelectedOption1(props)
    openOption1(false);
  }

  //handle create list
  const handleChnageDomain = (props) => {
    setOpendomain(false)
    let find = domains.filter((item) => item === props)
    if (find.length === 0) {
      setdomains(prev => [...prev, props])
    }
  }
  const handleRemovedDomain = (props) => {
    let find = domains.filter((item) => item !== props)
    setdomains(find);
    setOpendomain(false);
  }

  const hnadlecountry1 = (props) => {
    setCountry1(props);
    setOpenCountry1(false)
  }
  const handlecreatedList = (dm, compt, cty) => {
    let db = {
      domains: [dm],
      compitor: compt,
      country: cty.name.common
    }
    setList(prev => [...prev, db]);
    setClearfield(false);
    setdomains2(domains);
    setdomains([]);
    setListModal(false)
  }

  const getdb3 = (props) => {
    if (props === "Months" || props === "Quarters") {
      let db2 = tab3db1[0].photos.filter((i) => i.name === props);
      setTab3db(db2);
    }
    else {
      let db = data[0].trend_devices.filter((item => item.name === props));
      setTab3db(db);
      setTab3db1(db);
    }
  }
  const getdb31 = (mq) => {
    let db2 = data[0].traffic_sources.filter((item => item.name.includes(mq)));
    let db3 = db2.filter((its => its.name2.includes(selectedOption1)))
    setTab3db11(db3);
  }

  const getVdb = (props) => {
    let db4 = data[0].all_devicess.filter((item => item.visit_type.includes(props)));
    setvisitDb(db4);
  }

  useEffect(() => {
    let dbs = db.filter((item => item.category === activetab));
    let db1 = dbs[0].trend_devices.filter((item => item.name === "Visits"));
    let db2 = dbs[0].traffic_sources.filter((item => item.name.includes("Months")));
    let db4 = dbs[0].all_devicess.filter((item => item.visit_type.includes("Visits")));
    let db3 = db2.filter((its => its.name2.includes(selectedOption1)))
    setTab3db11(db3);
    setData(dbs);
    setTab3db(db1);
    setvisitDb(db4);
  }, [activetab]);

  useEffect(() => {
    //options setOptions
    let db2 = [{
      id: 1,
      name: "Last 6 months",
      filter: ["m", "q"],
      value: "Last 6 months"
    },
    {
      id: 2,
      name: "Last year",
      filter: ["m", "q"],
      value: "Last year"
    }, {
      id: 3,
      name: "All Time",
      filter: ["m", "q"],
      value: "All Time"
    }
      , {
      id: 4,
      name: "Current Year",
      filter: ["m", "q"],
      value: "Current Year"
    }
      , {
      id: 5,
      name: "Last 2 quarters",
      filter: ["q"],
      value: "Last 2 quarters"
    }
      , {
      id: 6,
      name: "Last 4 quarters",
      filter: ["q"],
      value: "Last 4 quarters"
    }];
    let filter = db2.filter((it) => it.filter.includes(selectedMq));
    setOptions(filter);
    let filter2 = db2.filter((ist) => ist.filter.includes(selectedMq1));
    setOptions1(filter2);
  }, [selectedMq, selectedMq1]);

  useEffect(() => {
    try {
      fetch("https://restcountries.com/v3.1/all")
        .then(res => res.json())
        .then(data => {
          setCountries(data)
          setFiltertabs(data.slice(0, 2))
        });
    }
    catch (err) {
      console.log(err)
    }
  }, [])

  if (data.length === 0) return <Loader />
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
                    <span onClick={() => setOpenCompitior(!openCompitior)} className="link__text">
                      amazon.com{' '}
                      <span>
                        <FiExternalLink />
                      </span>
                    </span>
                    {openCompitior && <ul>
                      {
                        list.length > 0 &&
                        list.map((item) => (
                          <li>{item.compitor}</li>
                        ))
                      }
                    </ul>}
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
                          {filterTabs.length > 0 &&
                            filterTabs.map((item, index) => (
                              <div className={`${styles.selectedcountry} ${selectedcountry?.name.common === item.name.common && styles.activecountry}`}>
                                <button className={styles.tabs__filters_btn}>
                                  {item.name.common}
                                </button>
                                {/* <img src={item?.flags?.png} alt="" srcset="" /> */}
                              </div>
                            ))}
                          {/*country select options */}
                          <div>
                            <button onClick={() => setOpenCountry(!opencountry)}>Worldwide</button>
                            {opencountry && <ul className={styles.country_content}>
                              {
                                country.map((item, index) => (
                                  <li onClick={() => handleCountry(item)} className={styles.country_list}>
                                    {/* <img src={item.flags.png} alt="" srcset="" /> */}
                                    <h6>{item.name.common}</h6>
                                  </li>
                                ))
                              }
                            </ul>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.filter__tabs__Box}>
                  {tabs2.map(((item, index) => (
                    <button onClick={() => handleTabs2(item.name)} className={`${styles.filter__tabs__btn__items} ${item.name === activetab ? styles.active : ""}`}>
                      {item.name}
                    </button>
                  )))}
                </div>
                {/* {`${styles.filter__tabs__btn__items} ${item === activetab ? styles.active : ""}`} */}
              </div>
            </div>
            <div className={styles.organic__insight_overview_tabs1}>
              {/* ============= */}
              <div className={styles.insight__overview__middlecont}>
                <div className={styles.keyword__overlape__box}>
                  <div className={styles.traffics__compare_box}>
                    <div className={styles.compare__fild__box_cont}>
                      <Dropdown onChange={handleChange} name={"domain_1"} values={domains2[0]} clear={clear} />
                      <Dropdown onChange={handleChange} name={"domain_2"} values={domains2[1]} clear={clear} />
                      <Dropdown onChange={handleChange} name={"domain_3"} values={domains2[2]} clear={clear} />
                      <Dropdown onChange={handleChange} name={"domain_4"} values={domains2[3]} clear={clear} />
                      <Dropdown onChange={handleChange} name={"domain_5"} values={domains2[4]} clear={clear} />
                      <div className={styles.compare__control__box}>
                        <div className={styles.competitor__controll_box}>
                          <button onClick={() => hnadleCompare()} className={styles.compare__button}>
                            Compare
                          </button>
                          <button onClick={() => handleResetAll()} className={styles.reset__button}>
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* =================== */}
                    {more ?
                      <div className={styles.multiple_competitor_list}>
                        <table>
                          <tr>
                            {
                              ["Target", "Visits", "Unique Visitors", "Pages / Visit", "Avg. Visit Duration", "Bounce Rate"].map((item, index) => (
                                <th>{item}</th>
                              ))
                            }
                          </tr>
                          {targetList1.length > 0 &&
                            targetList1.map((tn) => (
                              <tr>
                                <td>{tn}</td>
                                {[1, 2, 3, 4, 5].map((item, index) => (
                                  <td>{index + 1}</td>
                                ))}
                              </tr>
                            ))}
                        </table>
                      </div>
                      :
                      <>
                        <div className={styles.keyword__insight__graph}>
                          <div className={styles.insight__overview_box}>
                            <h6 className={styles.insight__title}>Visits</h6>
                            <h6 className={styles.insight__title}>{data[0].visitor.visit.date}</h6>
                            <h3 className={styles.insight__info}>
                              {data[0].visitor.visit.visit}{' '}
                              <span className={styles.insight_percent}>
                                {` ${data[0].visitor.visit.increase ? "↑" : "↓"}  ${data[0].visitor.visit.increase_or_decrease} %`}
                              </span>
                            </h3>
                          </div>

                          <div className={styles.insight__overview_box}>
                            <h6 className={styles.insight__title}>
                              {' '}
                              Unique Visitors
                            </h6>
                            <h6 className={styles.insight__title}>
                              {data[0].visitor.unique_visit.date}
                            </h6>
                            <h3 className={styles.insight__info}>
                              {data[0].visitor.unique_visit.visit} {' '}
                              <span className={styles.insight_percent}>
                                {` ${data[0].visitor.unique_visit.increase ? "↑" : "↓"}  ${data[0].visitor.unique_visit.increase_or_decrease} %`}
                              </span>
                            </h3>
                          </div>
                          <div className={styles.insight__overview_box}>
                            <h6 className={styles.insight__title}>
                              {' '}
                              Pages / Visit
                            </h6>
                            <h6 className={styles.insight__title}>
                              {data[0].visitor.page_visit.date}
                            </h6>
                            <h3 className={styles.insight__info}>
                              {data[0].visitor.page_visit.visit} {' '}
                              <span className={styles.insight_percent}>
                                {` ${data[0].visitor.page_visit.increase ? "↑" : "↓"}  ${data[0].visitor.page_visit.increase_or_decrease} %`}
                              </span>
                            </h3>
                          </div>
                          <div className={styles.insight__overview_box}>
                            <h6 className={styles.insight__title}>
                              {' '}
                              Avg. Visit Duration{' '}
                            </h6>
                            <h6 className={styles.insight__title}>
                              {data[0].visitor.avg_visit.date}
                            </h6>
                            <h3 className={styles.insight__info}>
                              {data[0].visitor.avg_visit.visit} {' '}
                              <span className={styles.insight_percent}>
                                {`${data[0].visitor.avg_visit.increase ? "↑" : "↓"} ${data[0].visitor.avg_visit.increase_or_decrease} %`}
                              </span>
                            </h3>
                          </div>
                          <div className={styles.insight__overview_box}>
                            <h6 className={styles.insight__title}>Bounce Rate</h6>
                            <h6 className={styles.insight__title}>
                              {data[0].visitor.bounce_visit.date}
                            </h6>
                            <h3 className={styles.insight__info}>
                              {data[0].visitor.bounce_visit.visit} {' '}
                              <span className={styles.insight_percent}>
                                {` ${data[0].visitor.bounce_visit.increase ? "↑" : "↓"}  ${data[0].visitor.bounce_visit.increase_or_decrease} %`}
                              </span>
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
                      </>
                    }
                  </div>
                </div>

                {/* ============= */}
                {more ?
                  <div className={styles.trend__by_device_analytics__box}>
                    <div className={styles.top__title__box}>
                      <h4 className={styles.top__title}>
                        Trend by{' '}
                        <button>
                          {' '}
                          Competitors{' '}
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
                          {
                            [{ id: 1, name: "Visits", title: "Visits" }, { id: 2, name: "Unique Visitors", title: "Unique Visitors" }, { id: 3, name: "Pages / Visit", title: "Pages / Visit" }, { id: 4, name: "Avg. Visit Duration", title: "Avg. Visit Duration" }, { id: 5, name: "Bounce Rate", title: "Bounce Rate" }].map(((item, index) => (
                              <li onClick={() => getdb3(item.name)} key={index} className={styles.insight__category_item}>
                                {' '}
                                <button className={styles.tabs__btn}> {item.title} </button>
                              </li>
                            )))
                          }
                        </ul>
                        <div className={styles.insight__view_right_cont}>
                          <ul className={styles.insight__category_tabs}>
                            <li className={styles.insight__category_item}>
                              {' '}
                              <button onClick={() => { setSelectedMq("m"); getdb3("Months") }} className={styles.tabs__btn}>
                                {' '}
                                Months
                              </button>
                            </li>
                            <li className={styles.insight__category_item}>
                              {' '}
                              <button onClick={() => { setSelectedMq("q"); getdb3("Quarters") }} className={styles.tabs__btn}>
                                {' '}
                                Quarters{' '}
                              </button>
                            </li>
                          </ul>
                          <div className={styles.insight__tract_by_time}>
                            <button onClick={() => openOption(!openOpt)} className={styles.nsight_time_select_update}>
                              {selectedOption}{' '}
                              <span className={styles.arrow__down}>
                                <TfiAngleDown />
                              </span>
                            </button>
                            {openOpt && <ul className={styles.tract_date_time_list}>
                              {
                                options.map((item) => (
                                  <li onClick={() => handleSelected(item.value)}>{item.name}</li>
                                ))
                              }
                            </ul>}
                          </div>
                        </div>
                      </div>
                      <div className={styles.keyword_middle_insight__graph}>
                        {
                          tab3db.map((item2) => (
                            <div className={styles.graph__insight_overview}>
                              <img src={require(`../../../../assets/img/${item2.photo}`)} alt={trafficSourceImg1} className="traffic_journy_graph" />
                            </div>
                          ))
                        }
                        <button className={styles.view__more}>
                          View full report
                        </button>
                      </div>
                    </div>
                  </div>
                  :
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
                          {
                            [{ id: 1, name: "Visits", title: "Visits" }, { id: 2, name: "Unique Visitors", title: "Unique Visitors" }, { id: 3, name: "Pages / Visit", title: "Pages / Visit" }, { id: 4, name: "Avg. Visit Duration", title: "Avg. Visit Duration" }, { id: 5, name: "Bounce Rate", title: "Bounce Rate" }].map(((item, index) => (
                              <li onClick={() => getdb3(item.name)} key={index} className={styles.insight__category_item}>
                                {' '}
                                <button className={styles.tabs__btn}> {item.title} </button>
                              </li>
                            )))
                          }
                        </ul>
                        <div className={styles.insight__view_right_cont}>
                          <ul className={styles.insight__category_tabs}>
                            <li className={styles.insight__category_item}>
                              {' '}
                              <button onClick={() => { setSelectedMq("m"); getdb3("Months") }} className={styles.tabs__btn}>
                                {' '}
                                Months
                              </button>
                            </li>
                            <li className={styles.insight__category_item}>
                              {' '}
                              <button onClick={() => { setSelectedMq("q"); getdb3("Quarters") }} className={styles.tabs__btn}>
                                {' '}
                                Quarters{' '}
                              </button>
                            </li>
                          </ul>
                          <div className={styles.insight__tract_by_time}>
                            <button onClick={() => openOption(!openOpt)} className={styles.nsight_time_select_update}>
                              {selectedOption}{' '}
                              <span className={styles.arrow__down}>
                                <TfiAngleDown />
                              </span>
                            </button>
                            {openOpt && <ul>
                              {
                                options.map((item) => (
                                  <li onClick={() => handleSelected(item.value)}>{item.name}</li>
                                ))
                              }
                            </ul>}
                          </div>
                        </div>
                      </div>
                      <div className={styles.keyword_middle_insight__graph}>
                        {
                          tab3db.map((item2) => (
                            <div className={styles.graph__insight_overview}>
                              <img src={require(`../../../../assets/img/${item2.photo}`)} alt={trafficSourceImg1} className="traffic_journy_graph" />
                            </div>
                          ))
                        }
                        <button className={styles.view__more}>
                          View full report
                        </button>
                      </div>
                    </div>
                  </div>}

                <div className={styles.traffic__share_leftbox}>
                  <div className={styles.top__title__box}>
                    <div className={styles.top_title_box_wrap}>
                      <ul className={styles.insight__category_tabs}>
                        {
                          [{
                            id: 1,
                            name: "top_pages",
                            title: "Top Pages"
                          },
                          {
                            id: 2,
                            name: "sub_folder",
                            title: "Top Subfolders"
                          },
                          {
                            id: 3,
                            name: "sub_domain",
                            title: "Top Subdomains"
                          }].map(((item, index) => (
                            <li onClick={() => setSelectedPage(item.name)} key={index} className={styles.insight__category_item}>
                              {' '}
                              <button className={styles.tabs__btn}>
                                {' '}
                                {item.title} {' '}
                              </button>
                            </li>
                          )))
                        }
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
                        {
                          data[0]?.all_devices[selectedPage].data.map(((item, index) => (
                            <li className={styles.insight__graph__item}>
                              <div className={styles.insight__graph_details}>
                                <a href="/" className={styles.graph_item_link}>
                                  {item.page}
                                  <span className={styles.arrow_right_icon}>
                                    <FiExternalLink />
                                  </span>
                                </a>
                              </div>
                              <div className={styles.insight__graph_details}>
                                <span className={styles.insight_right__item}>
                                  {item.traffic_share}
                                </span>
                              </div>
                              <div className={styles.insight__graph_details}>
                                <span className={styles.insight_right__item}>
                                  {item.unique_page_view}
                                </span>
                              </div>
                              <div className={styles.insight__graph_details}>
                                <span className={styles.insight_right__item}>
                                  {item.unique_visitors}
                                </span>
                              </div>
                            </li>
                          )))
                        }
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
                            <button onClick={() => { setSelectedMq1("m"); getdb31("Months") }} className={styles.tabs__btn}>
                              {' '}
                              Months
                            </button>
                          </li>
                          <li className={styles.insight__category_item}>
                            {' '}
                            <button onClick={() => { setSelectedMq1("q"); getdb31("Quarters") }} className={styles.tabs__btn}>
                              {' '}
                              Quarters{' '}
                            </button>
                          </li>
                        </ul>
                        <div className={styles.insight__tract_by_time}>
                          <button onClick={() => openOption1(!openOpt1)} className={styles.nsight_time_select_update}>
                            {selectedOption1}{' '}
                            <span className={styles.arrow__down}>
                              <TfiAngleDown />
                            </span>
                          </button>
                          {openOpt1 && <ul>
                            {
                              options1.map((item) => (
                                <li onClick={() => handleSelected1(item.value)}>{item.name}</li>
                              ))
                            }
                          </ul>}
                        </div>
                      </div>
                    </div>
                    <div className={styles.keyword_middle_insight__graph}>
                      <div className={styles.graph__insight_overview}>
                        {
                          tab3db11.map((item2) => (
                            <div className={styles.graph__insight_overview}>
                              <img src={require(`../../../../assets/img/${item2.photo}`)} alt={trafficSourceImg1} className="traffic_journy_graph" />
                            </div>
                          ))
                        }
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

                {
                  more ?
                    <div className={styles.trend__by_device_analytics__box}>
                      <div className={styles.top__title__box}>
                        <div className={styles.content_wrap_box}>
                          <h4 className={styles.top__title}>
                            Traffic  by{' '}
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
                                <button onClick={() => { setVisitorType("Visits"); getVdb("Visits") }} className={styles.tabs__btn}>
                                  {' '}
                                  Visits
                                </button>
                              </li>
                              <li className={styles.insight__category_item}>
                                {' '}
                                <button onClick={() => { setVisitorType("Unique Visitors"); getVdb("Unique Visitors") }} className={styles.tabs__btn}>
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
                                  {targetList1.length > 0 && targetList1.map((item) => (
                                    <h6 className={styles.title}>{item}</h6>
                                  ))}
                                </div>
                                <ul className={styles.insight__graph_details}>
                                  {targetList1.length > 0 &&
                                    ["United States", "India", "Canada", "United Kingdom", "Brazil"].map((i) => (
                                      <li className={styles.insight__graph__item}>
                                        <div className={styles.insight__graph_details}>
                                          <a href="/" className={styles.graph_item_link}>
                                            {i}
                                          </a>
                                        </div>
                                        {
                                          visitorType === "Unique Visitors" &&
                                          targetList1.map((item, index) => (
                                            <div className={styles.insight__graph_details}>
                                              <div className={styles.insight_right__item}>
                                                <span className={styles.percent_number}>
                                                  {3 + index + 1}B
                                                </span>
                                                <span className={styles.percent_number}>
                                                  {2 + index + 1}M
                                                </span>
                                              </div>
                                            </div>
                                          ))
                                        }
                                        {
                                          visitorType === "Visits" &&
                                          targetList1.map((ite, index) => (
                                            <div className={styles.insight__graph_details}>
                                              <div className={styles.insight_right__item}>
                                                <span className={styles.percent_number}>
                                                  {3 + index + 2}B
                                                </span>
                                                <span className={styles.percent_number}>
                                                  {2 + index + 1}M
                                                </span>
                                              </div>
                                            </div>
                                          ))
                                        }
                                      </li>
                                    ))
                                  }
                                </ul>
                              </div>

                            </div>
                          </div>
                          {!more && <div className={styles.graph__insight_righttbox}>
                            <div className={styles.graph__modal_map}>
                              <img src={graphMapModal} alt={graphMapModal} className={styles.graph_modal__img} width={'100%'} height={'325px'} />
                            </div>
                          </div>}
                        </div>
                        <button className={styles.view__more}>
                          View full report
                        </button>
                      </div>
                    </div> :
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
                                <button onClick={() => getVdb("Visits")} className={styles.tabs__btn}>
                                  {' '}
                                  Visits
                                </button>
                              </li>
                              <li className={styles.insight__category_item}>
                                {' '}
                                <button onClick={() => getVdb("Unique Visitors")} className={styles.tabs__btn}>
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
                                  {
                                    visitdb.map((item, index) => (
                                      <li key={index} className={styles.insight__graph__item}>
                                        <div className={styles.insight__graph_details}>
                                          <a href="/" className={styles.graph_item_link}>
                                            {item.country}
                                          </a>
                                        </div>
                                        <div className={styles.insight__graph_details}>
                                          <div className={styles.insight_right__item}>
                                            <span className={styles.percent_number}>
                                              {item.all_device}B
                                            </span>
                                            <span className={styles.percent_number}>
                                              {item.mobile}M
                                            </span>
                                          </div>
                                        </div>
                                        <div className={styles.insight__graph_details}>
                                          <span className={styles.insight_right__item}>
                                            {item.desktop}M
                                          </span>
                                        </div>
                                      </li>
                                    ))
                                  }
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
                }
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
                      {targetList1.length > 0 ? targetList1.filter(item => item !== undefined).map((item) => (
                        <div className={styles.info__details_content}>
                          <h3 className={styles.key__top_nav_title}>
                            {item}{' '}
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
                            {item} is an e-commerce website for consumers,
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

                        </div>)) :
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
                      }
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
                    <input type="text" className={styles.list_input_item} placeholder='Competitor List 1' onChange={(e) => setCompitorList(e.target.value)} />
                  </div>
                </div>
                <div className={styles.list_box}>
                  <label className={styles.list_input_title}>Location</label>
                  <div className={styles.input_box}>
                    <input onClick={() => setOpenCountry1(!opencountry1)} type='text' className={styles.list_input_item} placeholder='Worldwide' value={selectedcountry1?.name.common} />
                    <span className="arrow_down_icons"></span>
                    <div>

                      {opencountry1 && <ul className={styles.country_content}>
                        {
                          country.map((item, index) => (
                            <li onClick={() => hnadlecountry1(item)} className={styles.country_list}>
                              <img src={item.flags.png} alt="" srcset="" />
                              <h6>{item.name.common}</h6>
                            </li>
                          ))
                        }
                      </ul>}
                    </div>
                  </div>
                </div>

              </div>

              <div className={styles.list_box}>
                <label htmlFor="text" className={styles.list_input_title}>Competitors <span>0/20</span></label>
                <div className={styles.input_box}>
                  {domains.length > 0 ?
                    <div className={styles.domain_container}>
                      <div className={styles.domain_selection}>
                        {domains.map(d => (
                          <div className={styles.domain_selected_item}>
                            <h4>{d}</h4>
                            <span onClick={() => handleRemovedDomain(d)}>x</span>
                          </div>
                        ))}
                      </div>
                      <input type="text" onChange={(e) => e.target.value.length > 1 ? setOpendomain(true) : setOpendomain(false)} className={styles.list_input_item} />
                    </div> :
                    <input type="text" onChange={() => setOpendomain(true)} className={styles.list_input_item} placeholder='Enter domains, subdomains, or subfolders' />
                  }
                  {opendomain && <ul className={styles.competitor_dropdown}>
                    {
                      ["ebuy.com", "amazon.com", "walmart.com", "pinterest.com", "youtube.com"].map((item, index) => (
                        <li onClick={() => handleChnageDomain(item)}>{item}</li>
                      ))
                    }
                  </ul>}
                </div>
              </div>

              <div className={styles.create_list_btnbox}>
                <button onClick={() => handlecreatedList(domains, compitor, selectedcountry1)} className={styles.create_analyze_btn}>Create and analyze</button>
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