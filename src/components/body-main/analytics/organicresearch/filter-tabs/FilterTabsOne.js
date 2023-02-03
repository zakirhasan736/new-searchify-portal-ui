import React from 'react';
import styles from '../../analytics.module.css';

import {
    TfiAngleDoubleRight,
} from 'react-icons/tfi';

const FilterTabsOne = () => {
    return (
        <>
            <div className={styles.organic__insight_overview_tabs1}>
                {/* ============= */}
                <div className={styles.insight__overview__middlecont}>
                    <div className={styles.keyword__overlape__box}>
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

                            <div className={styles.insight__overview_box}>
                                <h6 className={styles.insight__title}>Branded Traffic</h6>
                                <h3 className={styles.insight__info}>
                                    312 <span className={styles.insight_percent}>0.0%</span>
                                </h3>
                            </div>

                            <div className={styles.insight__overview_box}>
                                <h6 className={styles.insight__title}>
                                    Non-Branded Traffic
                                </h6>
                                <h3 className={styles.insight__info}>
                                    405{' '}
                                    <span className={styles.insight_percent}>-20.74%</span>
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* ============= */}
                    <div className={styles.top__organic_keywords__box}>
                        <h4 className={styles.top__title}>
                            Top Organic Keywords{' '}
                            <span className={styles.highlight__text}>you</span>
                        </h4>
                        <div className={styles.keyword__insight__graph}>
                            <div className={styles.insight__graph__top_head}>
                                <h6 className={styles.title}>Keyword</h6>
                                <h6 className={styles.title}>Volume</h6>
                            </div>
                            <ul className={styles.insight__graph_details}>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <button className={styles.view__more}>
                            View all 3.2K organic keywords
                        </button>
                    </div>

                    <div className={styles.top_position_changes}>
                        <h4 className={styles.top__title}>Top Position Changes </h4>
                        <div className={styles.top__insight_overview_left}>
                            <div className={styles.topbar__key__tabs__filter}>
                                <button className={styles.tabs__filters_btn}>
                                    {' '}
                                    New{' '}
                                </button>
                                <button className={styles.tabs__filters_btn}>Low</button>
                                <button className={styles.tabs__filters_btn}>
                                    Improved
                                </button>
                                <button className={styles.tabs__filters_btn}>
                                    Declined
                                </button>
                            </div>
                        </div>
                        <div className={styles.keyword__insight__graph}>
                            <div className={styles.insight__graph__top_head}>
                                <h6 className={styles.title}>Keyword</h6>
                                <h6 className={styles.title}>Volume</h6>
                            </div>
                            <ul className={styles.insight__graph_details}>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <button className={styles.view__more}>
                            View all 22 declined keywords
                        </button>
                    </div>

                    {/* ============= */}

                    <div className={styles.top__keyintend__box}>
                        <h4 className={styles.top__title}>Keywords by Intent </h4>
                        <div className={styles.keyword__insight__graph}>
                            <div className={styles.insight__graph__top_head}>
                                <h6 className={styles.title}>Keyword</h6>
                                <h6 className={styles.title}>Volume</h6>
                            </div>
                            <ul className={styles.insight__graph_details}>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <button className={styles.view__more}>
                            View full report
                        </button>
                    </div>

                    <div className={styles.keyword__serp_features__box}>
                        <h4 className={styles.top__title}>SERP Features </h4>
                        <button className={styles.view__more}>View details</button>
                    </div>
                    {/* ================ */}
                    <div className={styles.keyword__top_pages__box}>
                        <h4 className={styles.top__title}>Top Pages </h4>
                        <div className={styles.keyword__insight__graph}>
                            <div className={styles.insight__graph__top_head}>
                                <h6 className={styles.title}>Keyword</h6>
                                <h6 className={styles.title}>Volume</h6>
                            </div>
                            <ul className={styles.insight__graph_details}>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <button className={styles.view__more}>
                            View all 617 pages
                        </button>
                    </div>
                    {/* ================ */}
                    <div className={styles.keyword__top_subdomains__box}>
                        <h4 className={styles.top__title}>Top Subdomains </h4>
                        <div className={styles.keyword__insight__graph}>
                            <div className={styles.insight__graph__top_head}>
                                <h6 className={styles.title}>Keyword</h6>
                                <h6 className={styles.title}>Volume</h6>
                            </div>
                            <ul className={styles.insight__graph_details}>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <button className={styles.view__more}>
                            View all 1 subdomains
                        </button>
                    </div>
                    {/* ================ */}
                    <div className={styles.keyword__organic_competitors__box}>
                        <h4 className={styles.top__title}>
                            Main Organic Competitors{' '}
                        </h4>
                        <div className={styles.keyword__insight__graph}>
                            <div className={styles.insight__graph__top_head}>
                                <h6 className={styles.title}>Keyword</h6>
                                <h6 className={styles.title}>Volume</h6>
                            </div>
                            <ul className={styles.insight__graph_details}>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                                <li className={styles.insight__graph__item}>
                                    <a href="/" className={styles.graph_item_link}>
                                        sage hill apartments
                                        <span className={styles.arrow_right_icon}>
                                            <TfiAngleDoubleRight />
                                        </span>
                                    </a>
                                    <span className={styles.insight_right__item}>
                                        1,000
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <button className={styles.view__more}>
                            View all 2.2K competitors
                        </button>
                    </div>
                    {/* ================ */}
                    <div className={styles.competitive_positioning_map__box}>
                        <h4 className={styles.top__title}>
                            Competitive Positioning Map{' '}
                        </h4>
                        <button className={styles.view__more}>View details</button>
                    </div>
                </div>
            </div>

        </>
    );
};

export default FilterTabsOne;
