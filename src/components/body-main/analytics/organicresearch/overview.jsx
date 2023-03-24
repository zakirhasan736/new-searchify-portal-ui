import React, {useState, useEffect} from 'react';
import styles from '../analytics.module.css';
import shapeImg6 from '../../../../assets/img/gradient-shape6.png';
import shapeImg3 from '../../../../assets/img/gradient-shape3.png';
import shapeImg4 from '../../../../assets/img/gradient-shape4.png';
// import infoModal1 from '../../../../assets/img/keywordmannager-modal1.svg';
import db from '../traffic-analytics/db.json';
import { TfiArrowLeft, TfiExport } from 'react-icons/tfi';
import { FiExternalLink } from 'react-icons/fi';
import FilterTabsTwo from './filter-tabs/FilterTabsTwo';

const Overview = () => {
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

  const [activetab, setActiveTab] = useState("Overview");
  const [data, setData] = useState([]);
  const [tab3db, setTab3db] = useState([]);
  const [tab3db11, setTab3db11] = useState([]);
  const [options, setOptions] = useState([]);

  const [selectedMq, setSelectedMq] = useState("m");

  //second options
  const [options1, setOptions1] = useState([]);
  const [selectedOption1, setSelectedOption1] = useState("Last 6 months");
  const [selectedMq1, setSelectedMq1] = useState("m");

  //selected visit option
  const [visitdb, setvisitDb] = useState([]);
  //handle country state
  const [country, setCountries] = useState([]);
  const [selectedcountry, setCountry] = useState();
  const [opencountry, setOpenCountry] = useState(false);


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
                <a
                  href="/organicsearch/home"
                  className={styles.back_to_next__btn}
                >
                  <span>
                    <TfiArrowLeft />
                  </span>{' '}
                  Go to all lists
                </a>

                <div className={styles.key__top__nav_items}>
                  <h2 className={styles.key__top_nav_title}>
                    Organic Research:{' '}
                    <span className="link__text">
                      soapandmore.ca{' '}
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
                          {
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
                  <button className={styles.filter__tabs__btn__items}>
                    Overview
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Positions
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Position Changes
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Competitors
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Pages
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Subdomains
                  </button>
                </div>
              </div>
            </div>

            {/* ===========Tabs filter one================ */}
            {/* <FilterTabsOne /> */}
           <FilterTabsTwo />
           {/* <FilterTabsThree /> */}
           {/* <FilterTabsFour /> */}
           {/* <FilterTabsFive /> */}
           {/* <FilterTabsSix /> */}
          </div>
        </div>
      </section>
    </>
  );
};

export default Overview;
