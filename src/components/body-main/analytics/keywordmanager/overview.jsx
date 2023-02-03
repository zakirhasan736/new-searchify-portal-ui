import React from 'react';
import styles from '../analytics.module.css';
import shapeImg6 from '../../../../assets/img/gradient-shape6.png';
import shapeImg3 from '../../../../assets/img/gradient-shape3.png';
import shapeImg4 from '../../../../assets/img/gradient-shape4.png';
// import infoModal1 from '../../../../assets/img/keywordmannager-modal1.svg';

import { TfiAngleDown, TfiArrowLeft, TfiBackRight, TfiExport } from 'react-icons/tfi';
import { FiUsers, FiPlus, FiSearch } from 'react-icons/fi';
import {AiOutlineDelete} from 'react-icons/ai'
const overview = () => {
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
                    Soap and More{' '}
                    <span className={styles.arrow_downicon}>
                      <TfiAngleDown />
                    </span>
                    <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}>
                         Informational
                        </li>
                        <li className={styles.select__widget__items}>
                      Naviagation
                        </li>
                        <li className={styles.select__widget__items}>
                          Commercial 
                        </li>
                        <li className={styles.select__widget__items}>
                         Transactional 
                        </li>
                      </ul>
                  </button>
                  <ul className={styles.drop__select__items}>
                    <li className={styles.drop__select_list}></li>
                  </ul>
                </h2>
                <div className={styles.top__right_key__box}>
                  <button className={styles.share__info_item}>
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

                  <div className={styles.database__filterbox}>
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
                  </div>

                </div>

                <div className={styles.filter_drop__selec__items}>
                  <div className={styles.selected__filter_item}>
                    <button className={styles.selected__drop_item}>
                      Volume{' '}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                      <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}>
                          All domains
                        </li>
                        <li className={styles.select__widget__items}>
                          You-domain 
                        </li>
                        <li className={styles.select__widget__items}>
                          Competitors 
                        </li>
                        <li className={styles.custom_rangebox}>
                              <h6 className={styles.range_title}>Custom range</h6>
                              <div className={styles.range_input_box}>
                              <input type="text" className={styles.input_item_one} placeholder='from' />
                                <input type="text" className={styles.input_item_two} placeholder='to' />
                              </div>
                              <button className={styles.apply_btn}>Apply</button>
                            </li>
                      </ul>
                    </button>
                  </div>
                  <div className={styles.selected__filter_item}>
                    <button className={styles.selected__drop_item}>
                      KD%{' '}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                      <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}>
                          All domains
                        </li>
                        <li className={styles.select__widget__items}>
                          You-domain 
                        </li>
                        <li className={styles.select__widget__items}>
                          Competitors 
                        </li>
                        <li className={styles.custom_rangebox}>
                              <h6 className={styles.range_title}>Custom range</h6>
                              <div className={styles.range_input_box}>
                              <input type="text" className={styles.input_item_one} placeholder='from' />
                                <input type="text" className={styles.input_item_two} placeholder='to' />
                              </div>
                              <button className={styles.apply_btn}>Apply</button>
                            </li>
                      </ul>
                    </button>
                  </div>
                  <div className={styles.selected__filter_item}>
                    <button className={styles.selected__drop_item}>
                      Intent{' '}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                      <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}>
                         <label htmlFor="checkeditem1"><input type="checkbox" id='checkeditem1' className={styles.checked__item} /> Informational</label>
                        </li>
                        <li className={styles.select__widget__items}>
                         <label htmlFor="checkeditem2"><input type="checkbox" id='checkeditem2' className={styles.checked__item} /> Naviagation</label>
                        </li>
                        <li className={styles.select__widget__items}>
                         <label htmlFor="checkeditem3"><input type="checkbox" id='checkeditem3' className={styles.checked__item} /> Commercial</label> 
                        </li>
                        <li className={styles.select__widget__items}>
                         <label htmlFor="checkeditem3"><input type="checkbox" id='checkeditem3' className={styles.checked__item} /> Transactional</label> 
                        </li>
                        <li className={styles.custom_rangebox}>
                              <button className={styles.apply_btn}>Apply</button>
                            </li>
                      </ul>
                    </button>
                  </div>
                  <div className={styles.selected__filter_item}>
                    <button className={styles.selected__drop_item}>
                      CPC (USD){' '}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                      <ul className={styles.keyword__select_widget_box}>
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
                      </ul>
                    </button>
                  </div>
                  <div className={styles.selected__filter_item}>
                    <button className={styles.selected__drop_item}>
                      SERP Features{' '}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                      <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}>
                         <label htmlFor="serp1"><input type="checkbox" id='serp1' className={styles.checked__item} /> Informational</label>
                        </li>
                        <li className={styles.select__widget__items}>
                         <label htmlFor="serp2"><input type="checkbox" id='serp2' className={styles.checked__item} /> Naviagation</label>
                        </li>
                        <li className={styles.select__widget__items}>
                         <label htmlFor="serp3"><input type="checkbox" id='serp3' className={styles.checked__item} /> Commercial</label> 
                        </li>
                        <li className={styles.select__widget__items}>
                         <label htmlFor="serp3"><input type="checkbox" id='serp3' className={styles.checked__item} /> Transactional</label> 
                        </li>
                        <li className={styles.select__widget__items}>
                         <label htmlFor="serp4"><input type="checkbox" id='serp4' className={styles.checked__item} /> None</label> 
                        </li>
                        <li className={styles.select__widget__items}>
                         <label htmlFor="serp5"><input type="checkbox" id='serp5' className={styles.checked__item} /> None</label> 
                        </li>
                        <li className={styles.select__widget__items}>
                         <label htmlFor="serp6"><input type="checkbox" id='serp6' className={styles.checked__item} /> None</label> 
                        </li>
                        <li className={styles.custom_rangebox}>
                              <button className={styles.apply_btn}>Apply</button>
                            </li>
                      </ul>
                    </button>
                  </div>
                  <div className={styles.selected__filter_item}>
                    <button className={styles.selected__drop_item}>
                      Competitive density{' '}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                       <ul className={styles.keyword__select_widget_box}>
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
                      </ul>
                    </button>
                  </div>
                  <div className={styles.selected__filter_item}>
                    <button className={styles.selected__drop_item}>
                      Click potential{' '}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                       <ul className={styles.keyword__select_widget_box}>
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
                      </ul>
                    </button>
                  </div>
                  <div className={styles.selected__filter_item}>
                    <button className={styles.selected__drop_item}>
                      Tags{' '}
                      <span className={styles.arrow_downicon}>
                        <TfiAngleDown />
                      </span>
                       <ul className={styles.keyword__select_widget_box}>
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
                      </ul>
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
      </section>
    </>
  );
};

export default overview;
