import React, { useEffect, useState } from 'react'
import styles from '../analytics.module.css';
import shapeImg6 from '../../../../assets/img/gradient-shape6.png';
import shapeImg7 from '../../../../assets/img/gradient-shape-7.png';
import repeatIcon from '../../../../assets/icon/repeat.png';
import excellIcon from '../../../../assets/icon/excel-img.svg';
import tablemetricsIcon from '../../../../assets/icon/table-matrics.svg';
import { AarrowIcon, CalendarIcon } from '../icons';
import BreadCrumb from '../../../share/breadcrumb/BreadCrumb'
import SearchFilterSelect from '../../../share/search/SearchFilterSelect';
import DropDown from './DropDown';
import { db } from './db';
import TableRow from './TableRow';
import { useDebounce } from 'use-debounce';


const GenerateKeyOverview = () => {
  const [checked, setChecked] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [keyworddb, setKeywordDb] = useState([]);
  const [filterbyTab, setFiltertab] = useState("phrasematch");
  const [text, setText] = useState('');
  const [value] = useDebounce(text, 1000);

  const handleKeywordbyFilter = (arg) => {
    let filter = db.filter((item => item.role.includes(arg)));
    setKeywordDb(filter)
  }
  const handleOnChange = (e) => {
    setText(e.target.value)
  }
  const handleKeywordbyTabFilter = (arg) => {
    setKeywordDb(db)
    setFiltertab(arg)
    let filter = db.filter((item => item.type === arg));
    setKeywordDb(filter)
  }

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

  useEffect(() => {
    let filter = db.filter((item => item.type === filterbyTab));
    setKeywordDb(filter)
  }, [])


  useEffect(() => {
    if (value) {
      let filter = db.filter((item => item.keyword === value));
      setKeywordDb(filter)
    }
    else {
      let filter = db.filter((item => item.type === filterbyTab));
      setKeywordDb(filter)
    }
  }, [value])

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
          <h2 className={styles.analytics_title}>Keyword Generator</h2>
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
        <div className={styles.traffic_engagement__overview}>
          <ul className={styles.traffics__keyword__tabsbox}>
            <li onClick={() => handleKeywordbyTabFilter("phrasematch")} className={filterbyTab === "phrasematch" && styles.active}>Phrase Match {`(${db.filter((item => item.type === "phrasematch")).length})`}</li>
            <li className={filterbyTab === "relatedkeywords" && styles.active} onClick={() => handleKeywordbyTabFilter("relatedkeywords")}>Related Keywords {`(${db.filter((item => item.type === "relatedkeywords")).length})`}</li>
            <li className={filterbyTab === "trendingkeywords" && styles.active} onClick={() => handleKeywordbyTabFilter("trendingkeywords")}>Trending Keywords {`(${db.filter((item => item.type === "trendingkeywords")).length})`}</li>
            <li className={filterbyTab === "questionsqueries" && styles.active} onClick={() => handleKeywordbyTabFilter("questionsqueries")}>Questions Queries {`(${db.filter((item => item.type === "questionsqueries")).length})`}</li>
          </ul>
          {/* ========================= */}
          <div className={styles.traffic_engagement_contbox}>

            {/* total visite updates card */}
            <div className={styles.analytics__main_cont_wrapbox}>
              {/* =============== */}
              <div className={styles.filter__updates_status_cont}>

                <div className={styles.filter__updates_status}>
                  <h2 className={styles.analytics_title}>Total Keywords shown</h2>
                </div>

                <div className={styles.filter__updates_status}>
                  <h2 className={styles.analytics_title}>Total search visits</h2>
                </div>
              </div>
              <div className={styles.site__keywords__filterbox}>
                <div className={styles.site__keywords__filteritemsbox}>
                  <ul className={styles.dropdown__filterbox}>
                    <DropDown handleFilterType={handleKeywordbyFilter} />
                    <DropDown handleFilterType={handleKeywordbyFilter} />
                    <DropDown handleFilterType={handleKeywordbyFilter} />
                  </ul>
                </div>
              </div>

              {/* ===================== */}
              <div className={styles.filter__keyword_table_select}>
                <div className={styles.search__keyword_Contbox}>
                  <div className={styles.search__filter_type_select}>
                    <SearchFilterSelect placeholdertext='Filter keywords or URLs' onChange={handleOnChange} />
                  </div>
                  <ul className={styles.search__filter_btns}>
                    <li className={styles.filter__btn_items}><img width={25} src={excellIcon} alt={excellIcon} /></li>
                    <li className={styles.filter__btn_items}><img width={25} src={tablemetricsIcon} alt={tablemetricsIcon} /></li>
                  </ul>
                </div>
                <div className={styles.table__data__cont}>
                  <table className={styles.filter__updates_Table}>
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" onChange={() => setChecked(!checked)} />
                        </th>
                        <th></th>
                        <th>Keywords <span>(1,004)</span></th>
                        <th>Volume</th>
                        <th>Yearly trend</th>
                        <th>Zero-click queries</th>
                        <th>KD</th>
                        <th>Intent</th>
                        <th>CPC</th>
                        <th>Leader</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        keyworddb.map(((item, index) => (
                          <TableRow data={item} index={index} checked={checked} />
                        )))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}

export default GenerateKeyOverview