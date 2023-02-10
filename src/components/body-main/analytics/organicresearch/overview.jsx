import React from 'react';
import styles from '../analytics.module.css';
import shapeImg6 from '../../../../assets/img/gradient-shape6.png';
import shapeImg3 from '../../../../assets/img/gradient-shape3.png';
import shapeImg4 from '../../../../assets/img/gradient-shape4.png';
// import infoModal1 from '../../../../assets/img/keywordmannager-modal1.svg';

import { TfiArrowLeft, TfiExport } from 'react-icons/tfi';
import { FiExternalLink } from 'react-icons/fi';
import FilterTabsOne from './filter-tabs/FilterTabsOne';

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
            <div className={styles.organic__research__top__view__box}>
              <div className={styles.keyword__top_box__wrap}>
                <a
                  href="/organicsearch/home"
                  className={styles.back_to_next__btn}
                >
                  <span>
                    <TfiArrowLeft />
                  </span>{' '}
                  Go to all lists
                </a>

                <div className={styles.key__top__nav_items}>
                  <h2 className={styles.key__top_nav_title}>
                    Organic Research:{' '}
                    <span className="link__text">
                      soapandmore.ca{' '}
                      <a href="/">
                        <FiExternalLink />
                      </a>
                    </span>{' '}
                  </h2>
                  <div className={styles.top__right_key__box}>
                    <button className={styles.share__info_item}>
                      <span className={styles.users__icon}>
                        <TfiExport />
                      </span>{' '}
                      Export to PDF
                    </button>
                  </div>
                </div>

                <div className={styles.topbar__key__filter__itembox}>
                  <div className={styles.database__filter_wrap_box}>
                    <div className={styles.search__and_database__filterbox}>
                      <div className={styles.topbar__key__tabs__filter_wrap}>
                        <div className={styles.topbar__key__tabs__filter}>
                          <button className={styles.tabs__filters_btn}>
                            CA <span className={styles.number__fild}>3.7k</span>
                          </button>
                          <button className={styles.tabs__filters_btn}>
                            US <span className={styles.number__fild}>3.2k</span>
                          </button>
                          <button className={styles.tabs__filters_btn}>
                            AU <span className={styles.number__fild}>362</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.filter__tabs__Box}>
                  <button className={styles.filter__tabs__btn__items}>
                    Overview
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Positions
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Position Changes
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Competitors
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Pages
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Subdomains
                  </button>
                </div>
              </div>
            </div>

            {/* ===========Tabs filter one================ */}
            <FilterTabsOne />

          </div>
        </div>
      </section>
    </>
  );
};

export default overview;
