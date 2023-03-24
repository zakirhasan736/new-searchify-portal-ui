import React, {useState} from 'react';
import styles from '../../analytics.module.css';


import { FiSearch } from 'react-icons/fi';
import {
    TfiAngleDown,
    TfiExport,
} from 'react-icons/tfi';
import { AiOutlineDelete } from 'react-icons/ai';

const FilterTabsThree = () => {
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
    return (
        <>
            <div className={styles.organic__insight_overview_tabs1}>
                {/* ============= */}
                <div className={styles.insight__overview__middlecont}>
                    <div className={styles.keyword__overlape__box}>

                        <div className={styles.tabs__filters__box_wrap}>

                            <div className={styles.search__and_database__filterbox}>
                                <div className={styles.search__filterbox}>
                                    <input
                                        type="search"
                                        placeholder="seach by filter"
                                        className={styles.search__box_input}
                                    />
                                    <button className={styles.search__button}>
                                        <span className={styles.search__icon}>
                                            <FiSearch />
                                        </span>
                                    </button>
                                </div>
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

                        <div className={styles.keyword__insight__graph}>

                            <div className={styles.insight__overview_box}>
                                <h6 className={styles.insight__title}> All Position Changes</h6>
                                <h3 className={styles.insight__info}>
                                166{' '}
                                </h3>
                            </div>

                            <div className={styles.insight__overview_box}>
                                <h6 className={styles.insight__title}>New</h6>
                                <h3 className={styles.insight__info}>
                                69{' '}
                                    <span className={styles.insight_percent}>-14.81%</span>
                                </h3>
                            </div>

                            <div className={styles.insight__overview_box}>
                                <h6 className={styles.insight__title}>Improved</h6>
                                <h3 className={styles.insight__info}>
                                65{' '}
                                    <span className={styles.insight_percent}>+ 62.5%</span>
                                </h3>
                            </div>
                            <div className={styles.insight__overview_box}>
                                <h6 className={styles.insight__title}>Declined</h6>
                                <h3 className={styles.insight__info}>
                                65{' '}
                                    <span className={styles.insight_percent}>+ 62.5%</span>
                                </h3>
                            </div>
                            <div className={styles.insight__overview_box}>
                                <h6 className={styles.insight__title}>Improved</h6>
                                <h3 className={styles.insight__info}>
                                22{' '}
                                    <span className={styles.insight_percent}>-4.35%</span>
                                </h3>
                            </div>
                            <div className={styles.insight__overview_box}>
                                <h6 className={styles.insight__title}>Lost</h6>
                                <h3 className={styles.insight__info}>
                                10{' '}
                                    <span className={styles.insight_percent}>-28.57%</span>
                                </h3>
                            </div>

                        </div>

                    </div>

                    <div className={styles.organicsearch__modal__insight__view}>
                        {/* ================ */}
                        <div className={styles.insight__overview__box}>
                            <div className={styles.insight__overview__top}>
                                <div className={styles.top__insight_overview_left__wrap}>
                                    <div className={styles.top__insight_overview_left}>
                                        <h6 className={styles.top__update__title}>
                                            <strong>All Changes of Organic Positions</strong>
                                            <span className={styles.updates_number}> 1 - 100 (  166 )</span>
                                        </h6>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.insight__overview__top}>
                                <div className={styles.top__insight_overview_left}>
                        
                                </div>

                                <div className={styles.top__insight_overview_right}>
                                    <button className={styles.export__itemsbox}>
                                        <span>
                                            <TfiExport />
                                        </span>{' '}
                                        Export
                                    </button>
                                </div>
                            </div>

                            <div className={styles.insight_overview__middle__feature}>
                                <table className={styles.insight_table__data_cont}>
                                    <thead>
                                        <tr>
                                            <th>
                                                <input type="checkbox" className={styles.checkbox} />
                                            </th>
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
                                            <td>
                                                <input type="checkbox" className={styles.checkbox} />
                                            </td>
                                            <td>
                                                <span className={styles.country_flag}>countryflag</span>{' '}
                                                www.shanehomes.com
                                            </td>
                                            <td>
                                                <span>n/a</span>
                                            </td>
                                            <td>
                                                <span>-</span>
                                            </td>
                                            <td>
                                                <span>20</span>
                                            </td>
                                            <td>
                                                <span className={styles.graph}>n/a</span>
                                            </td>
                                            <td>
                                                <span>n/a</span>{' '}
                                                <span className={styles.highlight_color}></span>
                                            </td>
                                            <td>0.00</td>
                                            <td>0.00</td>
                                            <td>No</td>
                                            <td>Needs updating</td>
                                            <td>Needs updating</td>
                                            <td>7 hour ago</td>
                                            <td>
                                                <button className={styles.delete__row}>
                                                    <span>
                                                        <AiOutlineDelete />
                                                    </span>
                                                </button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <input type="checkbox" className={styles.checkbox} />
                                            </td>
                                            <td>
                                                <span className={styles.country_flag}>countryflag</span>{' '}
                                                www.shanehomes.com
                                            </td>
                                            <td>
                                                <span>n/a</span>
                                            </td>
                                            <td>
                                                <span>-</span>
                                            </td>
                                            <td>
                                                <span>20</span>
                                            </td>
                                            <td>
                                                <span className={styles.graph}>n/a</span>
                                            </td>
                                            <td>
                                                <span>n/a</span>{' '}
                                                <span className={styles.highlight_color}></span>
                                            </td>
                                            <td>0.00</td>
                                            <td>0.00</td>
                                            <td>No</td>
                                            <td>Needs updating</td>
                                            <td>Needs updating</td>
                                            <td>7 hour ago</td>
                                            <td>
                                                <button className={styles.delete__row}>
                                                    <span>
                                                        <AiOutlineDelete />
                                                    </span>
                                                </button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <input type="checkbox" className={styles.checkbox} />
                                            </td>
                                            <td>
                                                <span className={styles.country_flag}>countryflag</span>{' '}
                                                www.shanehomes.com
                                            </td>
                                            <td>
                                                <span>n/a</span>
                                            </td>
                                            <td>
                                                <span>-</span>
                                            </td>
                                            <td>
                                                <span>20</span>
                                            </td>
                                            <td>
                                                <span className={styles.graph}>n/a</span>
                                            </td>
                                            <td>
                                                <span>n/a</span>{' '}
                                                <span className={styles.highlight_color}></span>
                                            </td>
                                            <td>0.00</td>
                                            <td>0.00</td>
                                            <td>No</td>
                                            <td>Needs updating</td>
                                            <td>Needs updating</td>
                                            <td>7 hour ago</td>
                                            <td>
                                                <button className={styles.delete__row}>
                                                    <span>
                                                        <AiOutlineDelete />
                                                    </span>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className={styles.insight__overview__bottom}>
                                <span className={styles.bottom__title}>Page:</span>
                                <ul className={styles.pagination__wrap__box}>
                                    <li className={styles.pagination__list_page_number}>1</li>
                                </ul>
                                <span className={styles.bottom__title}>
                                    of <span className={styles.number_of_page}>1</span>
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </>
    );
};

export default FilterTabsThree;
