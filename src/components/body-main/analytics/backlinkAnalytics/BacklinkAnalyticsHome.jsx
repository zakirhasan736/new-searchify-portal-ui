import React from 'react'; 
import styles from '../analytics.module.css'
import shapeImg6 from '../../../../assets/img/gradient-shape6.png'
import shapeImg3 from '../../../../assets/img/gradient-shape3.png'
import shapeImg4 from '../../../../assets/img/gradient-shape4.png'
import infoModal23 from '../../../../assets/img/info-modal23.png';
import infoModal24 from '../../../../assets/img/infomodal24.png';
import infoModal25 from '../../../../assets/img/info-modal25.png';

const BacklinkAnalyticsHome = () => {
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
                <h2 className={styles.keyword__main_title}>Backlink Analytics</h2>
                <p className={styles.keyword__main_desc}>
                Quickly evaluate and compare link profiles in-depth, using the largest and most up-to-date <br /> backlink checker on the market.
                </p>
                <div className={styles.keyword__main_compere__box}>
                  {/* =============== */}
                  <div className={styles.keyword__compare_controlbox}>
                    <div className={styles.inputfild__box_organic}>
                    <input type="text" className={styles.keyword__inputfild__organic} placeholder='Enter domain, subdomain or URL' />
                    </div>
                    <div className={styles.competitor__controll_box}>
                     
                      <button className={styles.compare__button}>
                        Analyze
                      </button>
                    </div>
                  </div>
                  <h6 className={styles.example__of_domain_links}>Last checked: <a href="/">ebay.com</a></h6>
                </div>
              </div>

              <div className={styles.keyword___info_main}>

                <div className={styles.info_details_steps}>

                  <div className={styles.info_details__items}>
                     <h4>> 43 trillion quality backlinks</h4>
                     <p>Check backlinks accurately for nearly any website.</p>
                     <p>According to research, our backlink database is the largest among well-known competitors and continues to grow.</p>
                  </div>

                  <div className={styles.info_details__items}>
                     <h4>Fastest backlink discovery tool</h4>
                     <p>Evaluate your performance and be the first to know about competitors' campaigns.</p>
                     <p>We constantly update the database allowing you to find backlinks on Semrush as fast as possible.</p>
                  </div>

                  <div className={styles.info_details__items}>
                     <h4>Reliable Authority Score</h4>
                     <p>Be confident in your insights with proven metrics.</p>
                     <p>Our Authority Score metric helps you analyze backlink quality, and is based on only the most authoritative data sources, such as links and traffic.</p>
                  </div>

                </div>
                <h3 className={styles.keyword__subtitle}>Discover every detail about your and your competitors' <br /> backlinks</h3>

                <div className={styles.keyword__info__details_wrap}>
                  {/* ================ */}
                  <div className={styles.keyword__info__details_item}>
                    <div className={styles.info__details_modalimg__item}>
                      <img
                        src={infoModal23}
                        alt={infoModal23}
                        className={styles.info_details_modal1}
                      />
                    </div>
                    <div className={styles.info__details_cont_text__item}>
                      <h3 className={styles.keyword__subtitle}>
                      Track any domain's backlinks
                      </h3>
                      <ul className={styles.info__desc__list}>
                      <li className={styles.keyword__info_desc}>Explore your rivals' keyword rankings on desktop and mobile</li>
                      <li className={styles.keyword__info_desc}>View their landing pages displayed in the SERPs for a given keyword</li>
                        <li className={styles.keyword__info_desc}>See how much traffic a search term is bringing organically</li>
                      </ul>
                     
                    </div>
                  </div>
                  {/* ================ */}
                  <div className={styles.keyword__info__details_item}>
                    <div className={styles.info__details_modalimg__item}>
                      <img
                        src={infoModal24}
                        alt={infoModal24}
                        className={styles.info_details_modal1}
                      />
                    </div>
                    <div className={styles.info__details_cont_text__item}>
                      <h3 className={styles.keyword__subtitle}>
                      Conduct deep link analysis
                      </h3>
                      <ul className={styles.info__desc__list}>
                      <li className={styles.keyword__info_desc}>Keep close tabs on the dynamic organic competitive landscape</li>
                      <li className={styles.keyword__info_desc}>Get a visual representation of where your site stands amongst other organic search players</li>
                        <li className={styles.keyword__info_desc}>See how much traffic a search term is bringing organically</li>
                      </ul>
                    </div>
                  </div>
                  {/* ================ */}
                  <div className={styles.keyword__info__details_item}>
                    <div className={styles.info__details_modalimg__item}>
                      <img
                        src={infoModal25}
                        alt={infoModal25}
                        className={styles.info_details_modal1}
                      />
                    </div>
                    <div className={styles.info__details_cont_text__item}>
                      <h3 className={styles.keyword__subtitle}>
                      Delve into your competitors' marketing and PR strategies
                      </h3>
                      <ul className={styles.info__desc__list}>
                      <li className={styles.keyword__info_desc}>Keep abreast of how your rivals' domain positions are changing in organic results</li>
                      <li className={styles.keyword__info_desc}>Find out which new keywords helped your competitors enter the Google or Bing top 20</li>
                        <li className={styles.keyword__info_desc}>Understand where your own tactics are winning and if there's room for improvement</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.keywordgap__top_main}>
                <h2 className={styles.keyword__main_title}>Get started!</h2>
                <p className={styles.keyword__main_desc}>
                Enter your competitor's website and discover every detail about their backlinks.
                </p>
                <div className={styles.keyword__main_compere__box}>
                  {/* =============== */}
                  <div className={styles.keyword__compare_controlbox}>
                    <div className={styles.inputfild__box_organic}>
                    <input type="text" className={styles.keyword__inputfild__organic} placeholder='Enter domain, subdomain or URL' />
                    </div>
                    <div className={styles.competitor__controll_box}>
                     
                      <button className={styles.compare__button}>
                        Analyze
                      </button>
                    </div>
                  </div>
                  <h6 className={styles.example__of_domain_links}>Last checked: <a href="/">ebay.com</a></h6>
                </div>
              </div>

              <div className={styles.keywordgap__top_main}>
                <h2 className={styles.keyword__main_title}>Want more backlink data?</h2>
                <p className={styles.keyword__main_desc}>
                Secure your link-building SEO efforts and protect your site from Google <br /> penalties with the <a href="/">Backlink Audit tool</a>
                </p>
              </div>


            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default BacklinkAnalyticsHome