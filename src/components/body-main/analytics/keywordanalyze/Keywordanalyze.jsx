import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

import styles from '../analytics.module.css'
import shapeImg6 from '../../../../assets/img/gradient-shape6.png'
import shapeImg3 from '../../../../assets/img/gradient-shape3.png'
import shapeImg4 from '../../../../assets/img/gradient-shape4.png'
import { BiPlus } from 'react-icons/bi'
// import FilterSearch from '../../../share/search/FilterSearch';
import searchicon from '../../../../assets/icon/search.svg';
import { Link } from 'react-router-dom'

const Keywordanalyze = () => {
  const [addNew, setNew] = useState(null);
  const [openResult, setResult] = useState(false);
  const [searchList, setSearchList] = useState(["abc0", "adfc", "efcs"]);
  const [groupkeywordList, setGroupKeywordsList] = useState([]);
  const [keywordList, setKeywordsList] = useState([]);
  const [keyword, setKeyword] = useState(null);
  const [update, setUpdate] = useState(false);
  const [selectedtab, setSelectedTab] = useState("list");
  const [selectedtab1, setSelectedTab1] = useState("keyword");
  const [sharedList, setsharedList] = useState([]);
  const [updateselect, setUpdateSelect] = useState(null);
  const [groupName, setGroupName] = useState(null);
  const [text, setText] = useState('');
  const [value] = useDebounce(text, 1000);

  const selectedTabs = (tab) => {
    setSelectedTab(tab);
  };
  const onSaveGroupKeyword = () => {
    let group = {
      name: groupName,
      keyword: keywordList
    }
    setGroupKeywordsList(prev => [...prev, group]);
    setKeywordsList([]);
    setNew(!addNew);
  }
  const onSaveKeyword = () => {
    setKeywordsList(prev => [...prev, keyword]);
    setKeyword("");
  };
  const saveOnPaseKeyword = (val = null) => {
    setKeywordsList(prev => [...prev, val]);
    setKeyword("");
  };

  const removeKeyword = (arg) => {
    let newtags = keywordList.filter((item) => item !== arg);
    setKeywordsList(newtags)
  };

  const onUpdateKeyword = (pre, curr) => {
    let newtags = keywordList.filter((item) => item !== pre);
    setKeywordsList(newtags);
    setKeywordsList(prev => [...prev, curr]);
    setUpdate(false);
  };

  useEffect(() => {
    setSearchList(prev => [...prev, value]);
  }, [value])

  return (
    <>
      <section onClick={() => {openResult && setResult(false);setText('')}} className={styles.keyword__wrap_section}>
        <img className={styles.app_shape_img6} src={shapeImg6} alt={shapeImg6} />
        <img className={styles.app_shape_img3} src={shapeImg3} alt={shapeImg3} />
        <img className={styles.app_shape_img4} src={shapeImg4} alt={shapeImg4} />
        <div className={styles.keyword__cont_box}>
          <div className={styles.keyword__cont_main}>

            <div className={styles.keyword_top__box}>
              <div className={styles.keyword_top_main_box}>
                <h3 className={styles.keyword_title}>Analyze Keywords</h3>
                <p className={styles.keyword_desc}>Monitor your keyword share over time and optimize for each SERP</p>
                <div className={styles.filter_search_inputbox}>
                  <label className={styles.search_icons}><img src={searchicon} alt={searchicon} /></label>
                  <input value={text} className={styles.search_inputbar} placeholder='Search for a keyword or keyword list' onClick={() => setResult(true)} onChange={(e) => setText(e.target.value)} />             
                  {openResult && <div onClick={(e)=>e.stopPropagation()} className={styles.searchList__main_box}>
                    <ul className={styles.keyword_tabs_item}>
                      <li onClick={() => setSelectedTab1("keyword")} className={selectedtab1 === "keyword" && styles.active}>Keyword </li>
                      <li onClick={() => setSelectedTab1("list")} className={selectedtab1 === "list" && styles.active}>Keywords List</li>
                    </ul>
                    {selectedtab1 === "keyword" &&  <ul className={styles.search_list_itembox}>
                      <li>Recent searchs</li>
                      {searchList.map((item) => (
                        <li>
                          <Link to="/keywordanalyze/overview">
                            {item}
                          </Link>
                        </li>
                      ))}
                    </ul>}
                    {selectedtab1 === "list" && <ul className={styles.search_list_itembox}>
                      {groupkeywordList.map((item) => (
                        <li>
                          <Link to="/keywordanalyze/overview">
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>}
                  </div>}
                </div>
              </div>
            </div>

            <div className={styles.keyword_main__box}>
              <div className={styles.keyword_bottom_box}>

                <div className={styles.keyword_bottom_headbox}>
                  <div className={styles.keyword_bottom_tabs__btn}>
                    <ul className={styles.keyword_tabs_item}>
                      <li onClick={() => selectedTabs("list")} className={selectedtab === "list" && styles.active}>My Lists <span className={styles.count_number}>{(`${groupkeywordList.length}`)}</span> </li>
                      <li onClick={() => selectedTabs("shared")} className={selectedtab === "shared" && styles.active}>Shared With Me <span className={styles.count_number}>{(`${sharedList.length}`)}</span> </li>
                    </ul>
                    {/* show keyword list */}

                  </div>
                  <button className={styles.add__new_list} onClick={() => setNew(!addNew)}><span className={styles.plus_icon}><BiPlus /></span>  New list  </button>
                </div>

                <div className={styles.keyword_bottom_contbox}>
                  {selectedtab === "list" && <ul>
                    {groupkeywordList.length > 0 && groupkeywordList.map((item => (
                      <li>{item.name}</li>
                    )))}
                  </ul>}
                  <ul>
                    {selectedtab === "shared" && sharedList.length > 0 && sharedList.map((item => (
                      <li>{item}</li>
                    )))}
                  </ul>
                </div>
              </div>
            </div>
            <div className={styles.keyword_newlist_popupbox}>
              {
                addNew &&
                <div className={styles.new_list_container}>
                  <div onClick={(e) => e.stopPropagation()} className={styles.list_content}>
                  <div className={styles.group__name_box}>
                    <input type="text" placeholder='name of your group' className={styles.name__group} onChange={(e) => setGroupName(e.target.value)} />
                    </div>
                    <div className={styles.keyword__listbox}>
                    <h6>keywords in the list</h6>
                    <span>keywords {`${keywordList.length}/200`}</span>
                    </div>
                    <div className={styles.add_key_box}>
                    <input className={styles.keyword__add_input} value={keyword} type="text" placeholder='Enter keywords or paste' onChange={(e) => setKeyword(e.target.value)} onPaste={(e) => saveOnPaseKeyword(e.target.value)} />
                    <button  className={styles.add__keybtn} onClick={() => onSaveKeyword()}>+</button>
                   </div>
                    <div className={styles.show_all_added_keywords}>
                      <ul>
                        {keywordList.length > 0 && keywordList.map((item => (
                          <li>
                            {(update && updateselect === item) ?
                              <input defaultValue={item} type="text" onBlur={(e) => onUpdateKeyword(item, e.target.value)} /> :
                              <span>{item}</span>
                            }
                            <button onClick={() => { setUpdateSelect(item); setUpdate(!update) }}>{`update`}</button>
                            <button onClick={() => removeKeyword(item)}>{` X `}</button>
                          </li>
                        )))}
                      </ul>
                    </div>
                  </div>
                  <div className={styles.new__list_ctrlbox}>
                    <button onClick={() => setNew(!addNew)} className={styles.btn__cancel}>Cancel</button>
                    <button onClick={() => onSaveGroupKeyword()} className={styles.btn__save}>Save</button>
                  </div>
                </div>
              }
            </div>

          </div>
        </div>
      </section>
    </>
  )
}

export default Keywordanalyze