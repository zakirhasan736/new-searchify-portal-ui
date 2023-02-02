import React  from 'react'; 
import styles from '../analytics.module.css'
import shapeImg6 from '../../../../assets/img/gradient-shape6.png'
import shapeImg3 from '../../../../assets/img/gradient-shape3.png'
import shapeImg4 from '../../../../assets/img/gradient-shape4.png'
import infoModal4 from '../../../../assets/img/info-modal4.png';

// import { Link } from 'react-router-dom'
const organicsearch = () => {
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
                <h2 className={styles.keyword__main_title}>Organic Research</h2>
                <p className={styles.keyword__main_desc}>
                Do you want to reach the top of the SERP? <br />
Start with learning what works best for your competitors.
                </p>
                <div className={styles.keyword__main_compere__box}>
                  {/* =============== */}
                  <div className={styles.keyword__compare_controlbox}>
                    <div className={styles.inputfild__box_organic}>
                    <input type="text" className={styles.keyword__inputfild__organic} placeholder='Enter domain, subdomain or URL' />
                    </div>
                    <div className={styles.competitor__controll_box}>
                      <div className={styles.country__select_widget}>USA</div>
                      <button className={styles.compare__button}>
                        Compare
                      </button>
                    </div>
                  </div>
                  <h6 className={styles.example__of_domain_links}>Examples: <a href="/">ebay.com</a> <a href="/">shopzilla.com</a> <a href="/">amazon.com</a></h6>
                </div>
              </div>

              <div className={styles.keyword___info_main}>
                {/* <h3 className={styles.keyword__subtitle}>How It Work</h3> */}

                <div className={styles.keyword__info__details_wrap}>
                  {/* ================ */}
                  <div className={styles.keyword__info__details_item}>
                    <div className={styles.info__details_modalimg__item}>
                      <img
                        src={infoModal4}
                        alt={infoModal4}
                        className={styles.info_details_modal1}
                      />
                    </div>
                    <div className={styles.info__details_cont_text__item}>
                      <h3 className={styles.keyword__subtitle}>
                      Discover competitors' best keywords
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
                        src={infoModal4}
                        alt={infoModal4}
                        className={styles.info_details_modal1}
                      />
                    </div>
                    <div className={styles.info__details_cont_text__item}>
                      <h3 className={styles.keyword__subtitle}>
                      Find new organic competitors
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
                        src={infoModal4}
                        alt={infoModal4}
                        className={styles.info_details_modal1}
                      />
                    </div>
                    <div className={styles.info__details_cont_text__item}>
                      <h3 className={styles.keyword__subtitle}>
                      Observe domains' position changes
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
                <h2 className={styles.keyword__main_title}>Get a free private one-to-one demo!</h2>
                <p className={styles.keyword__main_desc}>
                Our specialists will guide you through how to make the most of the Semrush platform from the beginning.
                </p>
                <a href="/" className={styles.cta__button_cointrol}>Request private demo</a>
              </div>


            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default organicsearch