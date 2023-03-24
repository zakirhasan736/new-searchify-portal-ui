import React, { useState } from 'react';
import styles from '../analytics.module.css';
import shapeImg6 from '../../../../assets/img/gradient-shape6.png';
import shapeImg3 from '../../../../assets/img/gradient-shape3.png';
import shapeImg4 from '../../../../assets/img/gradient-shape4.png';
// import infoModal1 from '../../../../assets/img/keywordmannager-modal1.svg';

import { TfiAngleDown, TfiArrowLeft, TfiBackRight, TfiExport } from 'react-icons/tfi';
import { FiUsers, FiPlus, FiSearch } from 'react-icons/fi';
import {AiOutlineDelete} from 'react-icons/ai'
const Overview = () => {
  const [keyList, setKeyList] = useState(false);
  const [keyListSelected, setKeylistSelected] = useState("");
  const [openValueList, setValueList] = useState(false);
  const [volumeListSelected, setValuelistSelected] = useState("");
  const [kdOpen, setKdOpen] = useState(false);
  const [selected__kd, setSelectedKd] = useState("");
  const [intOpen, setIntOpen] = useState(false);
  const [serpOpen, setSerpOpen] = useState(false);
  const [selected__int, setSelectedInt] = useState("");
  const [selected__serp, setSelectedSerp] = useState("");
  const [openDencity, setDencityOpen] = useState(false);
  const [openPotential, setPotentialOpen] = useState(false);
  const [openTags, setTagslOpen] = useState(false);
  const [cpcOpen, setCpcOpen] = useState(false);
  const [openSharedListModal, setopenSharedListModal] = useState(false);
  const [openViwer, setopenViwer] = useState(false);
  const [viewerList, setViewerList] = useState("");
  const [openShareModal, setShareModal] = useState(false);
  const [shareEmailInput, setSharedEmailInput] = useState("");
  const [shareKeywordInput, setSharedKeywordInput] = useState("");

  const [viewers] = useState([
      {
          id: 1,
          list: "Viewer"
      },
      {
          id: 2,
          list: "Editor"
      }
  ])
  const [select__intItem] = useState([
    {
        id: 1,
        name: "Informational"
    },
    {
        id: 2,
        name: "Naviagation"
    },
    {
        id: 3,
        name: "Commercial"
    },
    {
      id: 4,
      name: "Transactional"
  }
]);
  const [keyListItem] = useState([
    {
        id: 1,
        listItems: "Informational"
    },
    {
        id: 2,
        listItems: "Naviagation"
    },
    {
        id: 3,
        listItems: "Commercial"
    },
    {
      id: 4, 
      listItems: "Transactional"
  }
]);
const [select__serpItem] = useState([
    {
        id: 1,
        listItems: "Informational"
    },
    {
        id: 2,
        listItems: "Naviagation"
    },
    {
        id: 3,
        listItems: "Commercial"
    },
    {
      id: 4, 
      listItems: "Transactional"
  }
]);
const [valumeListItem] = useState([
  {
      id: 1,
      listItems: "All domains"
  },
  {
      id: 2,
      listItems: "You-domain"
  },
  {
      id: 3,
      listItems: "Competitors"
  }
]);
const [select__kd] = useState([
  {
      id: 1,
      name: "All domains"
  },
  {
      id: 2,
      name: "Your-domain"
  },
  {
      id: 3,
      name: "Competitors"
  }
]);

const [updated] = useState([
  {
      id: 1,
      list: "Soap and More"
  },
  {
      id: 2,
      list: "Soap and More2"
  },
  {
      id: 3,
      list: "Soap and More3"
  }
]);


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

            <div className={styles.keyword__top_box__wrap}>
              
              <a href="/keywordmannager/home" className={styles.back_to_next__btn}>
                <span>
                  <TfiArrowLeft />
                </span>{' '}
                Go to all lists
              </a>

              <div className={styles.key__top__nav_items}>
                <h2 className={styles.key__top_nav_title}>
                  Keyword Manager:

                  <button className={styles.drop__select}>
                  <span onClick={() => setKeyList(!keyList)} className={styles.selected__item_text}>
                    {keyListSelected !== "" ? keyListSelected : "Soap and More"}
                    <span className={styles.arrow_downicon}>
                      <TfiAngleDown />
                    </span>
                    </span>

                   {keyList && <ul className={styles.keyword__select_widget_box}>
                   {keyListItem.map((item, index) => (
                        <li onClick={() => setKeylistSelected(item.listItems)} key={index} className={styles.select__widget__items}>
                         {item.listItems}
                        </li>
                   ))}
                     
                      </ul>}

                  </button>
                  <ul className={styles.drop__select__items}>
                    <li className={styles.drop__select_list}></li>
                  </ul>
                </h2>
                <div className={styles.top__right_key__box}>
                  <button  onClick={() => setShareModal(!openShareModal)} className={styles.share__info_item}>
                    <span className={styles.users__icon}>
                      <FiUsers />
                    </span>{' '}
                    Share
                  </button>
                  <button className={styles.add__list_item}>
                    <span className={styles.plus__icon}>
                      <FiPlus />
                    </span>{' '}
                    Add keywords <span className={styles.pintext}>1/1000</span>
                  </button>
                </div>
              </div>

              <div className={styles.topbar__key__filter__itembox}>

                <div className={styles.search__and_database__filterbox}>

                  <div className={styles.search__filterbox}>
                    <input
                      type="search"
                      placeholder='seach by filter'
                      className={styles.search__box_input}
                    />
                    <button className={styles.search__button}>
                      <span className={styles.search__icon}>
                        <FiSearch />
                      </span>
                    </button>
                  </div>

                  {/* <div className={styles.database__filterbox}>
                    <div className={styles.selecte__item_databases}>
                      <input
                        type="select"
                        className={styles.selected_database}
                        placeholder="Databesess"
                      />
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                    </div>
                    <ul className={styles.select__item__box}>
                      <li className={styles.selected__items}></li>
                    </ul>
                  </div> */}

                </div>

                <div className={styles.filter_drop__selec__items}>

                  <div className={styles.selected__filter_item}>
                    <button className={styles.selected__drop_item}>
                    <span onClick={() => setValueList(!openValueList)} className={styles.selected__item_text}>
                      {volumeListSelected !== "" ? volumeListSelected : "Volume"}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                      </span>
                    {openValueList &&   <ul className={styles.keyword__select_widget_box}>
                    {valumeListItem.map((item, index) => (
                        <li onClick={() => setValuelistSelected(item.listItems)} key={index} className={styles.select__widget__items}>
                          {item.listItems}
                        </li>
                    ))}
                        <li className={styles.custom_rangebox}>
                              <h6 className={styles.range_title}>Custom range</h6>
                              <div className={styles.range_input_box}>
                              <input type="text" className={styles.input_item_one} placeholder='from' />
                                <input type="text" className={styles.input_item_two} placeholder='to' />
                              </div>
                              <button className={styles.apply_btn}>Apply</button>
                            </li>
                      </ul>}
                    </button>
                  </div>
                  <div className={styles.selected__filter_item}>
                    <button onClick={() => setKdOpen(!kdOpen)}  className={styles.selected__drop_item}>
                    <span className={styles.selected__item_text}>
                      {selected__kd !== "" ? selected__kd : "KD%"}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                      </span>
                      {kdOpen &&  <ul className={styles.keyword__select_widget_box}>
                      {select__kd.map((item, index) => (
                    <li onClick={() => setSelectedKd(item.name)} key={index} className={styles.select__widget__items}>{item.name}</li>
                    ))}
                       
                        <li className={styles.custom_rangebox}>
                              <h6 className={styles.range_title}>Custom range</h6>
                              <div className={styles.range_input_box}>
                              <input type="text" className={styles.input_item_one} placeholder='from' />
                                <input type="text" className={styles.input_item_two} placeholder='to' />
                              </div>
                              <button className={styles.apply_btn}>Apply</button>
                            </li>
                      </ul>}
                    </button>
                  </div>
                  <div className={styles.selected__filter_item}>
                    <button onClick={() => setIntOpen(!intOpen)} className={styles.selected__drop_item}>
                    {selected__int !== "" ? selected__int : "Intent"}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                      {intOpen &&  <ul className={styles.keyword__select_widget_box}>
                      {select__intItem.map((item, index) => (
                      <li onClick={() => setSelectedInt(item.name)} key={index} className={styles.select__widget__items}>
                      <label htmlFor="checkeditem1"><input type="checkbox" id='checkeditem1' className={styles.checked__item} /> {item.name}</label>
                      </li>
                    ))}
                        <li className={styles.custom_rangebox}>
                              <button className={styles.apply_btn}>Apply</button>
                        </li>
                      </ul>}
                    </button>
                  </div>

                  <div className={styles.selected__filter_item}>
                    <button onClick={() => setCpcOpen(!cpcOpen)} className={styles.selected__drop_item}>
                      CPC (USD){' '}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                     {cpcOpen && <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}>
                         
                        </li>
                      
                        <li className={styles.custom_rangebox}>
                              <h6 className={styles.range_title}>Custom range</h6>
                              <div className={styles.range_input_box}>
                              <input type="text" className={styles.input_item_one} placeholder='from' />
                                <input type="text" className={styles.input_item_two} placeholder='to' />
                              </div>
                              <button className={styles.apply_btn}>Apply</button>
                            </li>
                      </ul>}
                    </button>
                  </div>

                  <div className={styles.selected__filter_item}>
                    <button onClick={() => setSerpOpen(!serpOpen)} className={styles.selected__drop_item}>
                    {selected__serp !== "" ? selected__serp : "SERP Features"}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                      {serpOpen &&  <ul className={styles.keyword__select_widget_box}>
                      {select__serpItem.map((item, index) => (
                      <li onClick={() => setSelectedSerp(item.listItems)} key={index} className={styles.select__widget__items}>
                      <label htmlFor="serp1"><input type="checkbox" id='serp1' className={styles.checked__item} /> {' '} {item.listItems}</label></li>
                    ))}
                        <li className={styles.custom_rangebox}>
                              <button className={styles.apply_btn}>Apply</button>
                        </li>
                      </ul>}
                    </button>
                  </div>

                  <div className={styles.selected__filter_item}>
                    <button  onClick={() => setDencityOpen(!openDencity)} className={styles.selected__drop_item}>
                    {/* {selected__dencity !== "" ? selected__dencity : "Competitive density"} */}
                      Competitive density{' '}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                     {openDencity &&  <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}>
                         
                        </li>
                      
                        <li className={styles.custom_rangebox}>
                              <h6 className={styles.range_title}>Custom range</h6>
                              <div className={styles.range_input_box}>
                              <input type="text" className={styles.input_item_one} placeholder='from' />
                                <input type="text" className={styles.input_item_two} placeholder='to' />
                              </div>
                              <button
                              //  onClick={() => setDencitySelected({})} 
                               className={styles.apply_btn}>Apply</button>
                            </li>
                      </ul> }
                    </button>
                  </div>

                  <div className={styles.selected__filter_item}>
                    <button  onClick={() => setPotentialOpen(!openPotential)} className={styles.selected__drop_item}>
                      Click potential{' '}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                     {openPotential &&  <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}>
                         
                        </li>
                      
                        <li className={styles.custom_rangebox}>
                              <h6 className={styles.range_title}>Custom range</h6>
                              <div className={styles.range_input_box}>
                              <input type="text" className={styles.input_item_one} placeholder='from' />
                                <input type="text" className={styles.input_item_two} placeholder='to' />
                              </div>
                              <button className={styles.apply_btn}>Apply</button>
                            </li>
                      </ul>}
                    </button>
                  </div>

                  <div className={styles.selected__filter_item}>
                    <button  onClick={() => setTagslOpen(!openTags)} className={styles.selected__drop_item}>
                      Tags{' '}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                      {openTags && <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}>
                         
                        </li>
                      
                        <li className={styles.custom_rangebox}>
                              <h6 className={styles.range_title}>Custom range</h6>
                              <div className={styles.range_input_box}>
                              <input type="text" className={styles.input_item_one} placeholder='from' />
                                <input type="text" className={styles.input_item_two} placeholder='to' />
                              </div>
                              <button className={styles.apply_btn}>Apply</button>
                            </li>
                      </ul>}
                    </button>
                  </div>

                </div>

              </div>

            </div>

            <div className={styles.insight__overview__box}>
              
              <div className={styles.insight__overview__top}>

                <div className={styles.top__insight_overview_left}>
                <p className={styles.top__update__title}>Keyword: <span>0</span></p>
                <ul className={styles.list_of_updated_box}>
                  <li className={styles.list_of_updated_items}>Total volume: <span>0</span></li>
                  <li className={styles.list_of_updated_items}>Average KD: 0% <span>0</span></li>
                </ul>
                </div>

                <div className={styles.top__insight_overview_right}>
                  <div className={styles.update__matrics__box}>
                    <button className={styles.update__matrics__btn}><span><TfiBackRight /></span> Update metrics <span className={styles.numbers__items}>0/5,000</span></button>
                  </div>
                  <button className={styles.export__itemsbox}><span><TfiExport /></span> Export</button>
                    <button className={styles.delete__itemsbox}><span><AiOutlineDelete /></span></button>
                </div>

              </div>

              <div className={styles.insight_overview__middle__feature}>
                    <table className={styles.insight_table__data_cont}>
                      <thead>
                        <tr>
                          <th><input type="checkbox" className={styles.checkbox} /></th>
                          <th>Keyword</th>
                          <th>intent</th>
                          <th>Seed keyword</th>
                          <th>Volume</th>
                          <th>trend</th>
                          <th>keyword difficulty</th>
                          <th>cpc(USD)</th>
                          <th>Competitive density</th>
                          <th>SERP</th>
                          <th>Click Potetial</th>
                          <th>Top Competitor</th>
                          <th>Last Update</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><input type="checkbox" className={styles.checkbox} /></td>
                          <td><span className={styles.country_flag}>countryflag</span> www.shanehomes.com</td>
                          <td><span>n/a</span></td>
                          <td><span>-</span></td>
                          <td><span>20</span></td>
                          <td><span className={styles.graph}>n/a</span></td>
                          <td><span>n/a</span> <span className={styles.highlight_color}></span></td>
                          <td>0.00</td>
                          <td>0.00</td>
                          <td>No</td>
                          <td>Needs updating</td>
                          <td>Needs updating</td>
                          <td>7 hour ago</td>
                          <td><button className={styles.delete__row}><span><AiOutlineDelete /></span></button></td>
                        </tr>
                        <tr>
                          <td><input type="checkbox" className={styles.checkbox} /></td>
                          <td><span className={styles.country_flag}>countryflag</span> www.shanehomes.com</td>
                          <td><span>n/a</span></td>
                          <td><span>-</span></td>
                          <td><span>20</span></td>
                          <td><span className={styles.graph}>n/a</span></td>
                          <td><span>n/a</span> <span className={styles.highlight_color}></span></td>
                          <td>0.00</td>
                          <td>0.00</td>
                          <td>No</td>
                          <td>Needs updating</td>
                          <td>Needs updating</td>
                          <td>7 hour ago</td>
                          <td><button className={styles.delete__row}><span><AiOutlineDelete /></span></button></td>
                        </tr>
                        <tr>
                          <td><input type="checkbox" className={styles.checkbox} /></td>
                          <td><span className={styles.country_flag}>countryflag</span> www.shanehomes.com</td>
                          <td><span>n/a</span></td>
                          <td><span>-</span></td>
                          <td><span>20</span></td>
                          <td><span className={styles.graph}>n/a</span></td>
                          <td><span>n/a</span> <span className={styles.highlight_color}></span></td>
                          <td>0.00</td>
                          <td>0.00</td>
                          <td>No</td>
                          <td>Needs updating</td>
                          <td>Needs updating</td>
                          <td>7 hour ago</td>
                          <td><button className={styles.delete__row}><span><AiOutlineDelete /></span></button></td>
                        </tr>
                      </tbody>
                    </table>
              </div>

              <div className={styles.insight__overview__bottom}>
                <span className={styles.bottom__title}>Page:</span>
                <ul className={styles.pagination__wrap__box}>
                  <li className={styles.pagination__list_page_number}>1</li>
                </ul>
                <span className={styles.bottom__title}>of <span className={styles.number_of_page}>1</span></span>
              </div>
            </div>


          </div>
        </div>
        
         {/* ==============POPUP box =============== */}
         {openShareModal && <div className={styles.share_key__popup__box}>
                <button onClick={() => setShareModal(false)} className={styles.close__popup_btn}>x</button>
                <h3 className={styles.keyword__subtitle}>
                  Share keyword lists
                </h3>
                <div className={styles.add__keyword__list_input}>
                  <div className={styles.add__key_input__boxwrap}>
                    <label htmlFor="select" className={styles.key__list__title}>
                      Keyword lists <span>{shareKeywordInput.split(',').length + "/2"}</span>
                    </label>
                    <div className={styles.add__key_input__box}>
                      <input
                        type="select"
                        className={styles.add__key_list__input}
                        placeholder="select keyword list"
                        value={shareKeywordInput}
                        onClick={() => setopenSharedListModal(!openSharedListModal)}
                      />
                      {
                        openSharedListModal &&
                        <ul className={styles.key__group__list}>
                          {updated.map((item, index) => (
                            <li onClick={() => { setSharedKeywordInput(item.list); setopenSharedListModal(false) }} className={styles.key__list_select}>
                              {item.list}
                            </li>
                          ))}
                        </ul>
                      }
                    </div>
                  </div>

                  <div className={styles.key__send__user_info_box}>
                    <div className={styles.user__info__gmail}>
                      <label htmlFor="email" className={styles.title_label}>
                        Email addresses <span>{shareEmailInput.split(',').length}</span>
                      </label>
                      <div className={styles.user__info__input_box}>
                        <input
                          type="text"
                          name="email"
                          className={styles.user_input__gmail}
                          placeholder="mark@example.com, eve@example.com"
                          onChange={(e) => setSharedEmailInput(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className={styles.user__permition_selectbox}>
                      <span onClick={() => setopenViwer(!openViwer)} className={styles.user__permission_select_item}>
                      {viewerList !== "" ? viewerList : "Viwer"}
                      </span>
                      {openViwer && <ul className={styles.user__permission__list_item}>
                      {viewers.map((item, index) => (
                            <li onClick={() => setViewerList(item.list)} >
                              {item.list}
                            </li>
                          ))}
                       
                      </ul>}
                    </div>
                    <div className={styles.add_list_control__box}>
                      <button onClick={() => (shareEmailInput.length > 3 && shareKeywordInput.length > 3)} className={styles.create__list_button}>
                        Create list
                      </button>
                    </div>
                  </div>
                </div>
              </div>}
              {/* =====popup end===== */}
      </section>
    </>
  );
};

export default Overview;
