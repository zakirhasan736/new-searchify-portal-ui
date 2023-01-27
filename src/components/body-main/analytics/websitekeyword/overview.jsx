import React, { useEffect, useState } from 'react'
import styles from '../analytics.module.css';
import shapeImg6 from '../../../../assets/img/gradient-shape6.png';
import shapeImg7 from '../../../../assets/img/gradient-shape-7.png';
import repeatIcon from '../../../../assets/icon/repeat.png';
import excellIcon from '../../../../assets/icon/excel-img.svg';
import tablemetricsIcon from '../../../../assets/icon/table-matrics.svg';
import plusIcon from '../../../../assets/icon/plus-icon.svg';
import { AarrowIcon, CalendarIcon } from '../icons';
import BreadCrumb from '../../../share/breadcrumb/BreadCrumb'
import SearchFilterSelect from '../../../share/search/SearchFilterSelect';
import { db } from '../websitekeyword/db';
import { useDebounce } from 'use-debounce';
import DropDown from './DropDown';
import TableRow from './TableRow';


const WebsiteKeyOverview = () => {
  const [checked, setChecked] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [keyworddb, setKeywordDb] = useState([]);
  const [text, setText] = useState('');
  const [value] = useDebounce(text, 1000);
  const [addNew, setNew] = useState(false);
  const [checkItems, setCheckedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([])
  const [reset, setReset] = useState(false);
  const [checked1, setChecked1] = useState(null);

  const handleResetAll = () => {
    setCheckedItems([]);
    setChecked1(false);
    setSelectedItems([]);
    setKeywordDb(db);
    setReset(true);
  };

  const handleFilterAll = () => {
    let filter = db.filter((item => item.role.includes(selectedItems.map(i => i.join("")))));
    setKeywordDb(filter)
  }
  const handleOnCheck = (e) => {
    setCheckedItems(prev => [...prev, e.target.value])
  }

  const handleSelected = (arg, num = 0) => {
    if (num === 1) {
      let selectedItem = selectedItems.filter((item => item !== arg));
      setSelectedItems(selectedItem)
    }
    else {
      setSelectedItems(prev => [...prev, arg])
    }
  }

  const handleOnChange = (e, num = 0) => {
    setText(e.target.value)
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
    setKeywordDb(db)
  }, [])

  useEffect(() => {
    if (value) {
      let filter = db.filter((item => item.keyword === value));
      setKeywordDb(filter)
    }
    else {
      setKeywordDb(db)
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
          <h2 className={styles.analytics_title}>Keywords</h2>
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
          <div className={styles.traffic_engagement_contbox}>
            {/* <h2 className={styles.analytics__overview__title}>Keywords</h2> */}

            {/* total visite updates card */}
            <div className={styles.analytics__main_cont_wrapbox}>

              <div className={styles.site__keywords__filterbox}>

                <div className={styles.site__keywords__filteritemsbox}>
                  <ul className={styles.dropdown__filter}>
                    <DropDown handleFilterType={handleSelected} reset={reset} updatedReset={setReset} />
                    <DropDown handleFilterType={handleSelected} reset={reset} updatedReset={setReset} />
                    <DropDown handleFilterType={handleSelected} reset={reset} updatedReset={setReset} />
                  </ul>
                  <ul className={styles.checkbox__filter}>
                    <li className={styles.checkbox__items}>
                      <input onMouseOver={() => setChecked1(null)} type='checkbox' id='check1' value="organic" onChange={handleOnCheck} checked={checked1} />
                      <label for='check1'>Organic</label>
                    </li>
                    <li className={styles.checkbox__items}>
                      <input onMouseOver={() => setChecked1(null)} type='checkbox' id='check2' value="paid" onChange={handleOnCheck} checked={checked1} />
                      <label for='check2'>Paid</label>
                    </li>
                    <li className={styles.checkbox__items}>
                      <input onMouseOver={() => setChecked1(null)} type='checkbox' id='check3' value="organic" onChange={handleOnCheck} checked={checked1} />
                      <label for='check3'>Organic</label>
                    </li>
                    <li className={styles.checkbox__items}>
                      <input onMouseOver={() => setChecked1(null)} type='checkbox' id='check3' value="paid" onChange={handleOnCheck} checked={checked1} />
                      <label for='check3'>Paid</label>
                    </li>
                  </ul>
                </div>

                <div className={styles.site__keywords__filter_handle}>
                  <button onClick={() => handleResetAll()} className={styles.reset__Btn}>Reset</button>
                  <button onClick={() => (value || selectedItems.length > 0) && handleFilterAll()} className={styles.filter__Btn}>Apply Filters</button>
                </div>

              </div>
              {/* =============== */}
              <div className={styles.filter__updates_status_cont}>

                <div className={styles.filter__updates_status}>
                  <h2 className={styles.analytics_title}>Total search traffic</h2>
                </div>

                <div className={styles.filter__updates_status}>
                  <h2 className={styles.analytics_title}>Organic keywords</h2>
                </div>

                <div className={styles.filter__updates_status}>
                  <h2 className={styles.analytics_title}>Paid keywords</h2>
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
                    <button className={styles.filter__btn_items} onClick={() => setNew(!addNew)}><img width={25} src={plusIcon} alt={plusIcon} /></button>
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
                        <th>Search terms <span>(10,038)</span></th>
                        <th>Traffic</th>
                        <th>KD</th>
                        <th>Intent</th>
                        <th>Change</th>
                        <th>Volume</th>
                        <th>CPC</th>
                        <th>Organic VS Paid</th>
                        <th>Position (Organic)</th>
                        <th>SERP Features</th>
                        <th>URL (Organic)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keyworddb.map((item, index) => (
                        <TableRow data={item} index={index} checked={checked} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

        </div>
        <div className={styles.keyword_newlist_popupbox}>
          {
            addNew &&
            <div className={styles.new_list_container}>
              <div onClick={(e) => e.stopPropagation()} className={styles.list_content}>
                <input type="text" placeholder='name of your group' />
                <hr />
                <h6>keywords in the list</h6>
                <span>keywords</span>
                <hr />
                <input type="text" placeholder='Enter keywords or paste' />
                <button >+</button>
                <div className={styles.show_all_added_keywords}>
                  <ul>

                  </ul>
                </div>
              </div>
              <div className={styles.new__list_ctrlbox}>
                <button className={styles.btn__cancel} onClick={() => setNew(!addNew)}>Cancel</button>
                <button className={styles.btn__save} onClick={() => setNew(!addNew)}>Save</button>
              </div>
            </div>
          }
        </div>
      </section>
    </>
  )
}

export default WebsiteKeyOverview