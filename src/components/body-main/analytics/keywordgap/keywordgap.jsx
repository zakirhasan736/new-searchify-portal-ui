import React from 'react';
import styles from '../analytics.module.css';
import shapeImg6 from '../../../../assets/img/gradient-shape6.png';
import shapeImg3 from '../../../../assets/img/gradient-shape3.png';
import shapeImg4 from '../../../../assets/img/gradient-shape4.png';
import infoModal1 from '../../../../assets/img/info-modal1.png';
import infoModal2 from '../../../../assets/img/info-modal2.png';
import infoModal3 from '../../../../assets/img/info-modal3.png';
// import SelectItems from '../../../share/select/SelectItems';
// import { Link } from 'react-router-dom'
import {
  TfiAngleDown,

} from 'react-icons/tfi';
const keywordgap = () => {
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
              <div className={styles.keywordgap__top_main}>
                <h2 className={styles.keyword__main_title}>Keyword Gap</h2>
                <p className={styles.keyword__main_desc}>
                  A tool that helps you compare your keyword profile with your
                  competitors.
                </p>
                <div className={styles.keyword__main_compere__box}>

                  <div className={styles.keyword__input_item_mainbox}>
                    <div className={styles.keyword_inputfild__contbox}>
                      <div className={styles.keyword__input_fildbox}>
                        <label
                          htmlFor="text"
                          className={styles.seal__text_color}
                        >
                          <span>You</span>
                        </label>
                        <input
                          type="text"
                          className={styles.add__domain_fild}
                          placeholder="add domain"
                        />
                      </div>
                      <div className={styles.select_domain_type}>
                        <span className={styles.selected__item_text}>
                        root domain <span className={styles.arrow_down}>< TfiAngleDown /></span>
                        </span>
                        <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}>Root domain</li>
                        <li className={styles.select__widget__items}>Exact URl</li>
                        <li className={styles.select__widget__items}>Subdomain</li>
                          <li className={styles.select__widget__items}>Subfolder</li>
                        </ul>
                      </div>
                    </div>
                    <div className={styles.select__keyword_type}>
                      <span className={styles.selected__item_text}>
                        organic keywords <span className={styles.arrow_down}>< TfiAngleDown /></span>
                      </span>
                      <ul className={styles.keyword__select_widget_box}>
                      <li className={styles.select__widget__items}>Organic keywords</li>
                      <li className={styles.select__widget__items}>Paid keywords</li>
                        <li className={styles.select__widget__items}>PLA kerwords</li>
                      </ul>
                    </div>
                  </div>
                  {/* ===================== */}

                  <div className={styles.keyword__input_item_mainbox}>
                    <div className={styles.keyword_inputfild__contbox}>
                      <div className={styles.keyword__input_fildbox}>
                        <label
                          htmlFor="text"
                          className={styles.seal__text_color}
                        >
                          <span></span>
                        </label>
                        <input
                          type="text"
                          className={styles.add__domain_fild}
                          placeholder="add domain"
                        />
                      </div>
                      <div className={styles.select_domain_type}>
                        <span className={styles.selected__item_text}>
                          root domain <span className={styles.arrow_down}>< TfiAngleDown /></span>
                        </span>
                        <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}>Root domain</li>
                        <li className={styles.select__widget__items}>Exact URl</li>
                        <li className={styles.select__widget__items}>Subdomain</li>
                          <li className={styles.select__widget__items}>Subfolder</li>
                        </ul>
                      </div>
                    </div>
                    <div className={styles.select__keyword_type}>
                      <span className={styles.selected__item_text}>
                        organic keywords <span className={styles.arrow_down}>< TfiAngleDown /></span>
                      </span>
                      <ul className={styles.keyword__select_widget_box}>
                      <li className={styles.select__widget__items}>Organic keywords</li>
                      <li className={styles.select__widget__items}>Paid keywords</li>
                        <li className={styles.select__widget__items}>PLA kerwords</li>
                      </ul>
                    </div>
                  </div>

                  {/* <div className={styles.keyword__input_item_mainbox}>
                    <div className={styles.keyword_inputfild__contbox}>
                      <div className={styles.keyword__input_fildbox}>
                        <label
                          htmlFor="text"
                          className={styles.seal__text_color}
                        >
                          <span></span>
                        </label>
                        <input
                          type="text"
                          className={styles.add__domain_fild}
                          placeholder="add domain"
                        />
                      </div>

                      <div className={styles.select_domain_type}>
                        <span className={styles.selected__item_text}>
                          root domain  <span className={styles.arrow_down}>< TfiAngleDown /></span>
                        </span>
                        <ul className={styles.keyword__select_widget_box}>
                          <li className={styles.select__widget__items}></li>
                        </ul>
                      </div>
                    </div>
                    <div className={styles.select__keyword_type}>
                      <span className={styles.selected__item_text}>
                        organic keywords  <span className={styles.arrow_down}>< TfiAngleDown /></span>
                      </span>
                      <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}></li>
                      </ul>
                    </div>
                  </div>

                  <div className={styles.keyword__input_item_mainbox}>
                    <div className={styles.keyword_inputfild__contbox}>
                      <div className={styles.keyword__input_fildbox}>
                        <label
                          htmlFor="text"
                          className={styles.seal__text_color}
                        >
                          <span></span>
                        </label>
                        <input
                          type="text"
                          className={styles.add__domain_fild}
                          placeholder="add domain"
                        />
                      </div>
                      <div className={styles.select_domain_type}>
                        <span className={styles.selected__item_text}>
                          root domain  <span className={styles.arrow_down}>< TfiAngleDown /></span>
                        </span>
                        <ul className={styles.keyword__select_widget_box}>
                          <li className={styles.select__widget__items}></li>
                        </ul>
                      </div>
                    </div>
                    <div className={styles.select__keyword_type}>
                      <span className={styles.selected__item_text}>
                        organic keywords  <span className={styles.arrow_down}>< TfiAngleDown /></span>
                      </span>
                      <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}></li>
                      </ul>
                    </div>
                  </div>

                  <div className={styles.keyword__input_item_mainbox}>
                    <div className={styles.keyword_inputfild__contbox}>
                      <div className={styles.keyword__input_fildbox}>
                        <label
                          htmlFor="text"
                          className={styles.seal__text_color}
                        >
                          <span></span>
                        </label>
                        <input
                          type="text"
                          className={styles.add__domain_fild}
                          placeholder="add domain"
                        />
                      </div>
                      <div className={styles.select_domain_type}>
                        <span className={styles.selected__item_text}>
                          root domain  <span className={styles.arrow_down}>< TfiAngleDown /></span>
                        </span>
                        <ul className={styles.keyword__select_widget_box}>
                          <li className={styles.select__widget__items}></li>
                        </ul>
                      </div>
                    </div>
                    <div className={styles.select__keyword_type}>
                      <span className={styles.selected__item_text}>
                        organic keywords  <span className={styles.arrow_down}>< TfiAngleDown /></span>
                      </span>
                      <ul className={styles.keyword__select_widget_box}>
                        <li className={styles.select__widget__items}></li>
                      </ul>
                    </div>
                  </div> */}

                  {/* =============== */}
                  <div className={styles.keyword__compare_controlbox}>
                    <button className={styles.add__competitor_fild}>
                      + Add up to 3 competitors
                    </button>
                    <div className={styles.competitor__controll_box}>
                      <div className={styles.country__select_widget}>USA <span className={styles.arrow_down}>< TfiAngleDown /></span></div>
                      <button className={styles.compare__button}>
                        Compare
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.keyword___info_main}>
                <h3 className={styles.keyword__subtitle}>How It Work</h3>

                <div className={styles.keyword__info__details_wrap}>
                  {/* ================ */}
                  <div className={styles.keyword__info__details_item}>
                    <div className={styles.info__details_modalimg__item}>
                      <img
                        src={infoModal1}
                        alt={infoModal1}
                        className={styles.info_details_modal1}
                      />
                    </div>
                    <div className={styles.info__details_cont_text__item}>
                      <h3 className={styles.keyword__subtitle}>
                        Enter your competitors
                      </h3>
                      <p className={styles.keyword__info_desc}>
                        Specify up to 5 any domains, subdomains, folders or
                        exact URLs. Get a list containing all common and unique
                        keywords they rank for.
                      </p>
                    </div>
                  </div>
                  {/* ================ */}
                  <div className={styles.keyword__info__details_item}>
                    <div className={styles.info__details_modalimg__item}>
                      <img
                        src={infoModal2}
                        alt={infoModal2}
                        className={styles.info_details_modal1}
                      />
                    </div>
                    <div className={styles.info__details_cont_text__item}>
                      <h3 className={styles.keyword__subtitle}>
                      Choose keyword types
                      </h3>
                      <p className={styles.keyword__info_desc}>
                      Switch between the keywords for organic, paid search, and PLA. Mix the types, see how they intersect, and assess your SEO and PPC efforts.
                      </p>
                    </div>
                  </div>
                  {/* ================ */}
                  <div className={styles.keyword__info__details_item}>
                    <div className={styles.info__details_modalimg__item}>
                      <img
                        src={infoModal3}
                        alt={infoModal3}
                        className={styles.info_details_modal1}
                      />
                    </div>
                    <div className={styles.info__details_cont_text__item}>
                      <h3 className={styles.keyword__subtitle}>
                      Get insights to stay ahead
                      </h3>
                      <p className={styles.keyword__info_desc}>
                      Find out the competitors with the largest keyword profile. Create your own keyword masterlist helping you beat your competitors.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default keywordgap;
