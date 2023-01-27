import React, { useState, useEffect } from 'react'
import { useDebounce } from 'use-debounce';
import styles from '../analytics.module.css'
import shapeImg6 from '../../../../assets/img/gradient-shape6.png'
import shapeImg3 from '../../../../assets/img/gradient-shape3.png'
import shapeImg4 from '../../../../assets/img/gradient-shape4.png'
// import FilterSearch from '../../../share/search/FilterSearch';
import searchicon from '../../../../assets/icon/search.svg';
import { Link } from 'react-router-dom';

const WebsiteKeyword = () => {
  const [recentWeb, setRecentWeb] = useState([]);
  const [saveWeb, setSaveWeb] = useState([]);
  const [webTab, setWebTab] = useState("recent");
  const [text, setText] = useState('');
  const [value] = useDebounce(text, 1000);
  const [openResult, setResult] = useState(false);

  useEffect(() => {
    let filter = saveWeb.filter((item) => item === value);
    if (filter.length) {
      setRecentWeb(filter);
    }
  }, [value]);

  useEffect(() => {
    setSaveWeb(["apple.com", "google.com", "yahoo.com", "hulu.com", "netflix.com"])
    return () => {
      setSaveWeb([])
    }
  }, [])

  return (
    <>
      <section onClick={() => { openResult && setResult(false) }} className={styles.keyword__wrap_section}>
        <img className={styles.app_shape_img6} src={shapeImg6} alt={shapeImg6} />
        <img className={styles.app_shape_img3} src={shapeImg3} alt={shapeImg3} />
        <img className={styles.app_shape_img4} src={shapeImg4} alt={shapeImg4} />
        <div className={styles.keyword__cont_box}>
          <div className={styles.keyword__cont_main}>

            <div className={styles.keyword_top__box}>
              <div className={styles.keyword_top_main_box}>
                <h3 className={styles.keyword_title}>Website Keywords</h3>
                <p className={styles.keyword_desc}>Learn which keywords are working best for your competitors</p>
                <div className={styles.filter_search_inputbox}>
                  <label className={styles.search_icons}><img src={searchicon} alt={searchicon} /></label>
                  <input onClick={() => setResult(true)} onChange={(e) => setText(e.target.value)} className={styles.search_inputbar} placeholder={"Search for a website"} />
                  {openResult && <div onClick={(e) => e.stopPropagation()} className={styles.searchList}>
                    <ul>
                      <li>Recent searchs</li>
                      {recentWeb.length ? recentWeb.map((item) => (
                        <li>
                          <Link to="/websitekeyword/overview">{item}</Link>
                        </li>
                      ))
                        :
                        saveWeb.map((item) => (
                          <li>
                            <Link to="/websitekeyword/overview">{item}</Link>
                          </li>
                        ))}
                    </ul>
                  </div>}
                </div>
              </div>
            </div>

            <div className={styles.keywordgeneretor_main__box}>
              <div className={styles.keyword_bottom_box}>

                <div className={styles.keyword_bottom_headbox}>
                  <div className={styles.keyword_bottom_tabs__btn}>
                    <ul className={styles.keyword_tabs_item}>
                      <li onClick={() => setWebTab("recent")} className={webTab === "recent" && styles.active}>Recent Websites <span className={styles.count_number}>{`(${recentWeb.length})`}</span> </li>
                      <li className={webTab === "save" && styles.active} onClick={() => setWebTab("save")}>Saved Websites <span className={styles.count_number}>{`(${saveWeb.length})`}</span> </li>
                    </ul>
                  </div>
                  {/* <a href='/' className={styles.add__new_list}><span className={styles.plus_icon}><BiPlus /></span> new list</a> */}
                </div>

                <div className={styles.keyword_bottom_contbox}>
                  <div className={styles.keyword_newlist_popupbox}>
                    {webTab === "recent" &&
                      <ul>
                        {
                          recentWeb.map((item) => (
                            <li>{item}</li>
                          ))
                        }
                      </ul>
                    }
                    {webTab === "save" &&
                      <ul>
                        {
                          saveWeb.map((item) => (
                            <li>{item}</li>
                          ))
                        }
                      </ul>
                    }
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

export default WebsiteKeyword