import React from 'react';
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

const keywordmannager = () => {
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
                          type="seacrh"
                          className={styles.keywordmannager_searchbar}
                          placeholder="Search"
                        />
                        <label
                          htmlFor="search"
                          className={styles.keyword__search_icon}
                        >
                          <button>
                            <span className={styles.search_icon}>
                              <AiOutlineSearch />
                            </span>
                          </button>
                        </label>
                      </div>

                      <div className={styles.keyword_mannager__tab_filter}>
                        <ul className={styles.kayword__tabs__filter}>
                          <li className={styles.keyword_tabs__filter_item}>
                            <button className={styles.filters__tab}>All <span>0</span></button>
                          </li>
                          <li className={styles.keyword_tabs__filter_item}>
                            <button className={styles.filters__tab}>
                              My Own <span>0</span>
                            </button>
                          </li>
                          <li className={styles.keyword_tabs__filter_item}>
                            <button className={styles.filters__tab}>
                              Share With Me <span>0</span>
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className={styles.keyword_mannager__insight_filter}>
                      <button className={styles.keyword__share}>
                        <span className={styles.share__icon}>
                          <AiOutlineUsergroupAdd />
                        </span>{' '}
                        Share
                      </button>
                      <button className={styles.create__keyword__list}>
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
                        <tr>
                          <td>
                            Soap and More{' '}
                            <span className={styles.edit__btn}>
                              <AiFillEdit />
                            </span>
                          </td>
                          <td>
                            <span>0/1000</span>
                          </td>
                          <td>6 hours</td>
                          <td>
                            <div className={styles.action__box}>
                              <button className={styles.share__action}>
                                <span>
                                  <AiOutlineUsergroupAdd />
                                </span>
                              </button>
                              <button className={styles.delete__action}>
                                <AiOutlineDelete />
                              </button>
                            </div>
                          </td>
                        </tr>
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
              <div className={styles.add_list__popup__box} >
                <h3 className={styles.keyword__subtitle}>New keyword list</h3>
                <div className={styles.add__keyword__list_input}>
                  <div className={styles.add__key_input__box}>
                    <input
                      type="text"
                      className={styles.add__key_list__input}
                      placeholder="Enter list name"
                    />
                  </div>
                  <div className={styles.add_list_control__box}>
                    <button className={styles.create__list_button}>
                      Create list
                    </button>
                    <button className={styles.cancel__popup_button}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
              {/* =====popup end===== */}

              {/* ==============POPUP box =============== */}
              <div className={styles.share_key__popup__box}  >
                <button className={styles.close__popup_btn}>x</button>
                <h3 className={styles.keyword__subtitle}>
                  Share keyword lists
                </h3>
                <div className={styles.add__keyword__list_input}>
                <div className={styles.add__key_input__boxwrap}>
                <label htmlFor="select" className={styles.key__list__title}>
                      Keyword lists <span>0/2</span>
                    </label>
                <div className={styles.add__key_input__box}>
                    <input
                      type="select"
                      className={styles.add__key_list__input}
                      placeholder="select keyword list"
                    />
                    <ul className={styles.key__group__list}>
                      <li className={styles.key__list_select}></li>
                    </ul>
                  </div>
                </div>


                  <div className={styles.key__send__user_info_box}>

                    <div className={styles.user__info__gmail}>
                      <label htmlFor="email" className={styles.title_label}>
                        Email addresses <span>0</span>
                      </label>
                     <div className={styles.user__info__input_box}>
                     <input
                        type="text"
                        className={styles.user_input__gmail}
                        placeholder="mark@example.com, eve@example.com"
                      />
                     </div>
                    </div>

                    <div className={styles.user__permition_selectbox}>
                      <span className={styles.user__permission_select_item}>
                        Viwer
                      </span>
                      <ul className={styles.user__permission__list_item}>
                        <li></li>
                      </ul>
                    </div>
                    <div className={styles.add_list_control__box}>
                      <button className={styles.create__list_button}>
                        Create list
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* =====popup end===== */}

            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default keywordmannager;
