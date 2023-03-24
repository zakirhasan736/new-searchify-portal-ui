import React, { useState } from 'react';
import styles from '../analytics.module.css';
import shapeImg6 from '../../../../assets/img/gradient-shape6.png';
import shapeImg3 from '../../../../assets/img/gradient-shape3.png';
import shapeImg4 from '../../../../assets/img/gradient-shape4.png';
// import infoModal1 from '../../../../assets/img/keywordmannager-modal1.svg';

import { TfiArrowLeft, TfiExport, TfiAngleDown } from 'react-icons/tfi';
import { FiExternalLink, FiSearch } from 'react-icons/fi';
import { AiOutlineDelete } from 'react-icons/ai';
// import FilterTabsTwo from './filter-tabs/FilterTabsTwo';
const BacklinkAnalyticsOverview = () => {
  const [openValueList, setValueList] = useState(false);
  const [volumeListSelected, setValuelistSelected] = useState('');
  const [kdOpen, setKdOpen] = useState(false);
  const [selected__kd, setSelectedKd] = useState('');
  const [intOpen, setIntOpen] = useState(false);
  const [serpOpen, setSerpOpen] = useState(false);
  const [selected__int, setSelectedInt] = useState('');
  const [selected__serp, setSelectedSerp] = useState('');
  const [openDencity, setDencityOpen] = useState(false);
  const [openPotential, setPotentialOpen] = useState(false);
  const [openTags, setTagslOpen] = useState(false);
  const [cpcOpen, setCpcOpen] = useState(false);

  const [select__intItem] = useState([
    {
      id: 1,
      name: 'Informational',
    },
    {
      id: 2,
      name: 'Naviagation',
    },
    {
      id: 3,
      name: 'Commercial',
    },
    {
      id: 4,
      name: 'Transactional',
    },
  ]);

  const [select__serpItem] = useState([
    {
      id: 1,
      listItems: 'Informational',
    },
    {
      id: 2,
      listItems: 'Naviagation',
    },
    {
      id: 3,
      listItems: 'Commercial',
    },
    {
      id: 4,
      listItems: 'Transactional',
    },
  ]);
  const [valumeListItem] = useState([
    {
      id: 1,
      listItems: 'All domains',
    },
    {
      id: 2,
      listItems: 'You-domain',
    },
    {
      id: 3,
      listItems: 'Competitors',
    },
  ]);
  const [select__kd] = useState([
    {
      id: 1,
      name: 'All domains',
    },
    {
      id: 2,
      name: 'Your-domain',
    },
    {
      id: 3,
      name: 'Competitors',
    },
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
                    Backlinks:{' '}
                    <span className="link__text">
                      ebay.com{' '}
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

                <div className={styles.filter__tabs__Box}>
                  <button className={styles.filter__tabs__btn__items}>
                    Overview
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Network Graph
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Backlinks
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Anchors
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Referring Domains
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Outbound Domains
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Indexed Pages
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Competitors
                  </button>
                  <button className={styles.filter__tabs__btn__items}>
                    Referring IPs
                  </button>
                </div>
              </div>
            </div>
            {/* ==================================== */}

            <div className={styles.organic__insight_overview_tabs1}>
              {/* ============= */}
              <div className={styles.insight__overview__middlecont}>
                <div className={styles.keyword__overlape__box}>
                  <div className={styles.tabs__filters__box_wrap}>
                  
                  </div>

                  <div className={styles.keyword__insight__graph}>
                    <div className={styles.insight__overview_box}>
                      <h6 className={styles.insight__title}>Keywords</h6>
                      <h3 className={styles.insight__info}>
                        3.2K{' '}
                        <span className={styles.insight_percent}>1.66%</span>
                      </h3>
                    </div>

                    <div className={styles.insight__overview_box}>
                      <h6 className={styles.insight__title}>Traffic</h6>
                      <h3 className={styles.insight__info}>
                        717{' '}
                        <span className={styles.insight_percent}>-12.88%</span>
                      </h3>
                    </div>

                    <div className={styles.insight__overview_box}>
                      <h6 className={styles.insight__title}>Traffic Cost</h6>
                      <h3 className={styles.insight__info}>
                        $772{' '}
                        <span className={styles.insight_percent}>-10.34% </span>
                      </h3>
                    </div>
                  </div>
                </div>

                <div className={styles.organicsearch__modal__insight__view}>
                
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BacklinkAnalyticsOverview;
