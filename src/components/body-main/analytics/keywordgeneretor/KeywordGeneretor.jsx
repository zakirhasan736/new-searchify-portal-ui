import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import searchicon from '../../../../assets/icon/search.svg'
import styles from '../analytics.module.css'
import shapeImg6 from '../../../../assets/img/gradient-shape6.png'
import shapeImg3 from '../../../../assets/img/gradient-shape3.png'
import shapeImg4 from '../../../../assets/img/gradient-shape4.png'
import bulbeIcon from '../../../../assets/icon/lightBulbe.svg'
import { AiOutlineGoogle, AiOutlineAmazon, AiFillYoutube } from 'react-icons/ai'
import { useNavigate } from 'react-router-dom';
// import FilterSearchBtn from '../../../share/search/FilterSearchbtn'

const KeywordGeneretor = () => {
  const [text, setText] = useState('');
  const [value] = useDebounce(text, 1000);
  const [selectedtab1, setSelectedTab1] = useState("keyword");
  const [openResult, setResult] = useState(false);
  const [keywordList, setKeywordList] = useState([]);
  const [groupKeywordList, setGroupKeywordList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setKeywordList(prev => [...prev, value]);
  }, [value]);

  useEffect(() => {
    setKeywordList(["aaa", "gggg", "ccc", "rffff"]);
    setGroupKeywordList([
      {
        id: 1,
        name: "group1"
      },
      {
        id: 2,
        name: "group2"
      }, {
        id: 2,
        name: "group3"
      }
    ])
    return () => {
      setKeywordList([])
      setGroupKeywordList([])
    }
  }, []);


  return (
    <>
      <section onClick={() => openResult && setResult(false)} className={styles.keyword__wrap_section}>
        <img className={styles.app_shape_img6} src={shapeImg6} alt={shapeImg6} />
        <img className={styles.app_shape_img3} src={shapeImg3} alt={shapeImg3} />
        <img className={styles.app_shape_img4} src={shapeImg4} alt={shapeImg4} />
        <div className={styles.keyword__cont_box}>
          <div className={styles.keyword__cont_main}>

            <div className={styles.keyword_top__box}>
              <div className={styles.keyword_top_main_box}>
                <div className={styles.keyword_top_main_cont}>
                  <img className={styles.modal_icon__img} src={bulbeIcon} alt={bulbeIcon} width={105} />
                  <h3 className={styles.keyword_title}>Keyword Generator</h3>
                  <p className={styles.keyword_desc}>Discover keyword ideas from a seed keyword or keyword list</p>
                </div>
              </div>
            </div>

            <div className={styles.keyword_main__box}>
              <div className={styles.keyword_bottom_box}>
                <ul className={styles.site__link_item} >
                  <li><a href='/'><span className={styles.icon_item}><AiOutlineGoogle /></span> Google</a></li>
                  <li><a href='/'><span className={styles.icon_item}><AiOutlineAmazon /></span> Amazon</a></li>
                  <li><a href='/'><span className={styles.icon_item}><AiFillYoutube /></span> YouTube</a></li>
                </ul>
                <div className={styles.searchbar__withbtn}>
                  <div className={styles.search__inputbox}>
                    <div className={styles.filter__search_withbtn}>
                      <div className={styles.filter_search_inputbox}>
                        <label className={styles.search_icons}><img src={searchicon} alt={searchicon} /></label>
                        <input value={text} onClick={() => setResult(true)} className={styles.search_inputbar} placeholder={"Enter a keyword"} onChange={(e) => setText(e.target.value)} />
                      </div>
                      <button onClick={() => navigate("/keywordgeneretor/overview")} className={styles.input_testUrl_button}>
                        Generate
                      </button>
                    </div>

                    {/* show content */}
                    {openResult && <div onClick={(e) => e.stopPropagation()} className={styles.searchList__main_box}>
                      <ul className={styles.keyword_tabs_item}>
                        <li onClick={() => setSelectedTab1("keyword")} className={selectedtab1 === "keyword" && styles.active}>Keyword </li>
                        <li onClick={() => setSelectedTab1("list")} className={selectedtab1 === "list" && styles.active}>Keywords List</li>
                      </ul>
                      {selectedtab1 === "keyword" && <ul className={styles.search_generate_itembox}>
                        {keywordList.map((item) => (
                          <li className={styles.keyword_generator_li} onClick={() => { setText(item); setResult(false) }}>
                            {item}
                          </li>
                        ))}
                      </ul>}
                      {selectedtab1 === "list" && <ul className={styles.search_generate_itembox}>
                        {groupKeywordList.map((item) => (
                          <li className={styles.keyword_generator_li}>
                            {item.name}
                          </li>
                        ))}
                      </ul>}
                    </div>}
                  </div>
                </div>
                <div className={styles.generate__desc}>
                  <p className={styles.search_hint_desc}>Start with an example like <b>face masks</b> or <b>winter jackets</b></p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}

export default KeywordGeneretor