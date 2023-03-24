import React, { useState, useEffect, useMemo } from 'react';
import styles from '../analytics.module.css';
import shapeImg6 from '../../../../assets/img/gradient-shape6.png';
import shapeImg3 from '../../../../assets/img/gradient-shape3.png';
import shapeImg4 from '../../../../assets/img/gradient-shape4.png';
import infoModal1 from '../../../../assets/img/keywordmannager-modal1.svg';

import {
  AiOutlineSearch,
  AiOutlineUsergroupAdd,
  AiOutlineDelete,
  AiFillEdit,
} from 'react-icons/ai';

const Keywordmannager = () => {
  const [search, setsearch] = useState("");
  const [list, setList] = useState([]);
  const [updated, setUpdated] = useState([]);
  const [shareList, setShareList] = useState([]);
  const [ownList, setOwnList] = useState([]);
  const [createInput, setCreatedInput] = useState("");
  const [all, setAll] = useState(0);
  const [openListModal, setListModal] = useState(false);
  const [openShareModal, setShareModal] = useState(false);
  const [openSharedListModal, setopenSharedListModal] = useState(false);
  const [shareEmailInput, setSharedEmailInput] = useState("");
  const [shareKeywordInput, setSharedKeywordInput] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [openViwer, setopenViwer] = useState(false);
  const [editList, setEditList] = useState(null);
  const [editListval, setEditListval] = useState("");
  const [viewerList, setViewerList] = useState("");

  const [viewers] = useState([
      {
          id: 1,
          list: "Viewer"
      },
      {
          id: 2,
          list: "Editor"
      }
  ]);



  const handleSearch = () => {
    let data = updated.filter(item => item.list.toLowerCase() === search.toLowerCase());
    if (data.length === 0) {
      setNotFound(true);
    }
    setUpdated(data);
  }
  useMemo(() => {
    if (notFound && search === "") {
      setUpdated(list);
      setNotFound(false);
    }
  }, [notFound, search]);

  const handleRemove = (inx) => {
    let data = updated.filter((i, index) => index !== inx);
    setUpdated(data);
    setAll(data.length);
  }

  useMemo(() => {
    if (editListval !== "") {
      let find = updated.find((i, index) => index === editList);
      let data = find.list = editListval;
      setUpdated([...list, data]);
    }
  }, [editListval]);

  const handleShared = () => {
    const currentDate = new Date();
    const timestamp = currentDate.getTime();
    const listdata = {
      "list": shareKeywordInput,
      "email": shareEmailInput,
      "limit": "0/100",
      "updated": timestamp
    }
    setShareList([...shareList, listdata]);
    setAll(all + 1);
    setUpdated([...list, listdata]);
    setShareModal(false);
    setSharedEmailInput("");
    setSharedKeywordInput("");
    setViewerList("");
  }

  const handleOwnlist = () => {
    const currentDate = new Date();
    const timestamp = currentDate.getTime();
    const listdata = {
      "list": createInput,
      "limit": "0/100",
      "updated": timestamp
    }
    setOwnList([...ownList, listdata]);
    setAll(all + 1);
    setUpdated([...list, listdata]);
    setListModal(false);
  }
  const handlechnageList = (num) => {
    if (num === 1) {
      setUpdated([...list, ...ownList])
    }
    else if (num === 2) {
      setUpdated(ownList)
    }
    else if (num === 3) {
      setUpdated(shareList)
    }
  }
  useEffect(() => {
    const data = [
      {
        "list": "Soap and More",
        "limit": "0-100",
        "updated": "12hours ago"
      },
      {
        "list": "Soap and More2",
        "limit": "0-100",
        "updated": "1hours ago"
      },
      {
        "list": "Soap and More2",
        "limit": "0-100",
        "updated": "1hours ago"
      },
      {
        "list": "Soap and More2",
        "limit": "0-100",
        "updated": "1hours ago"
      },
      {
        "list": "Soap and More2",
        "limit": "0-100",
        "updated": "1hours ago"
      }
    ]
    setList(data);
    setUpdated(data);
    setAll(data.length)
    return () => {
      setList([])
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
            <div className={styles.keywordgap__main_wrapper_box}>
              {/* ============= */}
              <div className={styles.keywordgap__top_main}>
                <h2 className={styles.keyword__main_title}>Keyword Manager</h2>
                <p className={styles.keyword__main_desc}>
                  Collect your favorite keywords from across Semrush. Save your
                  findings, get fresh metrics, and export your findings into an
                  XLSX or CSV file or other Semrush tools.
                </p>
              </div>

              {/* ============= */}
              <div className={styles.keywordgap__top_main}>
                <div className={styles.keyword__middle___filterbox}>
                  <h3 className={styles.keyword__subtitle}>Keyword lists</h3>
                  <div className={styles.keyword__mannager__filterbox}>
                    <div className={styles.keyword_mannager_main_filter}>
                      <div className={styles.keyword_mannager__search_filter}>
                        <input
                          value={search}
                          type="seacrh"
                          className={styles.keywordmannager_searchbar}
                          placeholder="Search"
                          onChange={(e) => setsearch(e.target.value)}
                        />
                        <label
                          htmlFor="search"
                          className={styles.keyword__search_icon}
                        >
                          <button onClick={() => search.length > 3 && handleSearch()}>
                            <span className={styles.search_icon}>
                              <AiOutlineSearch />
                            </span>
                          </button>
                        </label>
                      </div>

                      <div className={styles.keyword_mannager__tab_filter}>
                        <ul className={styles.kayword__tabs__filter}>
                          <li className={styles.keyword_tabs__filter_item}>
                            <button onClick={() => handlechnageList(1)} className={styles.filters__tab}>All <span>{all}</span></button>
                          </li>
                          <li className={styles.keyword_tabs__filter_item}>
                            <button onClick={() => handlechnageList(2)} className={styles.filters__tab}>
                              My Own <span>{ownList.length}</span>
                            </button>
                          </li>
                          <li className={styles.keyword_tabs__filter_item}>
                            <button onClick={() => handlechnageList(3)} className={styles.filters__tab}>
                              Share With Me <span>{shareList.length}</span>
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className={styles.keyword_mannager__insight_filter}>
                      <button onClick={() => setShareModal(!openShareModal)} className={styles.keyword__share}>
                        <span className={styles.share__icon}>
                          <AiOutlineUsergroupAdd />
                        </span>{' '}
                        Share
                      </button>
                      <button onClick={() => setListModal(!openListModal)} className={styles.create__keyword__list}>
                        <span className={styles.add__list_icon}>+</span> Create
                        List
                      </button>
                    </div>
                  </div>

                  <div className={styles.keyword___filter_insight_view}>
                    <table className={styles.filter_insight__view}>
                      <thead>
                        <tr>
                          <th>List</th>
                          <th>Keyword Limit</th>
                          <th>Last Update</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          updated.filter(item => item.list !== undefined).map((item, index) => (
                            <tr>
                              <td>
                                {
                                  editList === index ?
                                    <input onBlur={() => { setEditList(null); setEditListval("") }} type="text" value={editListval} onChange={(e) => setEditListval(e.target.value)} /> :
                                    item.list + ' '
                                }
                                <span onClick={() => setEditList(index)} className={styles.edit__btn}>
                                  <AiFillEdit />
                                </span>
                              </td>
                              <td>
                                <span>{item.limit}</span>
                              </td>
                              <td>{item.updated}</td>
                              <td>
                                <div className={styles.action__box}>
                                  <button onClick={() => setShareModal(true)} className={styles.share__action}>
                                    <span>
                                      <AiOutlineUsergroupAdd />
                                    </span>
                                  </button>
                                  <button onClick={() => handleRemove(index)} className={styles.delete__action}>
                                    <AiOutlineDelete />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ================ */}
              <div className={styles.keyword___info_main}>
                <div className={styles.keywordmng__info__details_wrap}>
                  <h3 className={styles.keyword__subtitle}>
                    How to use Keyword Manager
                  </h3>
                  <div className={styles.keyword__mannager_info_box}>
                    <div className={styles.keyword_mannager__leftcont}>
                      <h5 className={styles.titles__of_topic}>
                        Add desired keywords to your lists from Semrush tools:
                      </h5>
                      <ul className={styles.topic__list_item}>
                        <li>
                          <a href="/">Keyword Magic</a>
                        </li>
                        <li>
                          <a href="/">Keyword Overview</a>
                        </li>
                        <li>
                          <a href="/">Organic Research</a>
                        </li>
                        <li>
                          <a href="/">Keyword Gap</a>
                        </li>
                      </ul>
                      <p className={styles.topic__desc}>
                        or import them manually
                      </p>
                    </div>
                    <div className={styles.keyword_mannager__middlecont}>
                      <img src={infoModal1} alt={infoModal1} />
                    </div>
                    <div className={styles.keyword_mannager__rightcont}>
                      <h5 className={styles.titles__of_topic}>
                        Send the best keywords to:
                      </h5>
                      <ul className={styles.topic__list_item}>
                        <li>
                          <a href="/">Position Tracking</a>
                        </li>
                        <li>
                          <a href="/">PPC Keyword Tool</a>
                        </li>
                      </ul>
                      <p className={styles.topic__desc}>
                        or export them to an <strong>XLSX</strong> or{' '}
                        <strong>CSV</strong>
                      </p>
                    </div>
                  </div>
                </div>
                {/* ====================== */}
                <div className={styles.keywordmng__info__details_wrap}>
                  <h3 className={styles.keyword__subtitle}>
                    Deep keyword analysis
                  </h3>
                </div>
              </div>
              {/* ==============POPUP box =============== */}
              {
                openListModal && <div className={styles.add_list__popup__box} >
                  <h3 className={styles.keyword__subtitle}>New keyword list</h3>
                  <div className={styles.add__keyword__list_input}>
                    <div className={styles.add__key_input__box}>
                      <input
                        type="text"
                        className={styles.add__key_list__input}
                        placeholder="Enter list name"
                        onChange={(e) => setCreatedInput(e.target.value)}
                      />
                    </div>
                    <div className={styles.add_list_control__box}>
                      <button onClick={() => createInput.length > 3 && handleOwnlist()} className={styles.create__list_button}>
                        Create list
                      </button>
                      <button onClick={() => setListModal(false)} className={styles.cancel__popup_button}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              }
              {/* =====popup end===== */}

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
                      <button onClick={() => (shareEmailInput.length > 3 && shareKeywordInput.length > 3) && handleShared()} className={styles.create__list_button}>
                        Create list
                      </button>
                    </div>
                  </div>
                </div>
              </div>}
              {/* =====popup end===== */}

            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Keywordmannager;
