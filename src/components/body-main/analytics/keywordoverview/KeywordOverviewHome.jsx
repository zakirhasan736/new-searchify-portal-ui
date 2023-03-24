import React from 'react'; 
import styles from '../analytics.module.css'
import shapeImg6 from '../../../../assets/img/gradient-shape6.png'
import shapeImg3 from '../../../../assets/img/gradient-shape3.png'
import shapeImg4 from '../../../../assets/img/gradient-shape4.png'
import infoModal6 from '../../../../assets/img/infomodal16.png';
import infoModal7 from '../../../../assets/img/infomodal17.png';
import infoModal8 from '../../../../assets/img/infomodal18.png';
import infoModal5 from '../../../../assets/img/infoModal15.png';
import CountrySelect from '../../../share/countryselect/CountrySelect';
import { Accordion } from '../../../share/accordion/Accordion';

const KeywordOverviewHome = () => {
  const accordianData = [
    {
      id: 1,
      question: 'Can I see both organic and paid data for keywords?',
      answer: `Yes. You can view the organic value of a keyword by looking at the SERP Analysis report in the tool. Alternatively, you can analyze the paid value of a keyword by looking at the PLA Copies, Ad Copies, and Keyword Ad History widgets.`,
    },
    {
      id: 2,
      question: 'Can I filter the keyword data based on location and device?',
      answer: `Yes. You can filter search volume by country (while still being able to see the overall global volume) and device (desktop or mobile). You can also view historical data going back to 2012.`,
    },
    {
      id: 3,
      question: 'How is the Keyword Difficulty score calculated within the tool?',
      answer: `The Keyword Difficulty score is generated based on a variety of factors, including the median number of referring domains pointing to the ranking URLs, the median ratio of dofollow/nofollow links, the median authority score of the domains, and the SERP-related qualities of the keyword itself.`,
    }
  ];
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
                <h2 className={styles.keyword__main_title}>Keyword Overview</h2>
                <p className={styles.keyword__main_desc}>
                Dive into the largest keyword research database on the market <br />
                 and analyze everything you need to know about a keyword.
                </p>
                <div className={styles.keyword__main_compere__box}>
                  {/* =============== */}
                  <div className={styles.keyword__compare_controlbox}>
                    <div className={styles.inputfild__box_organic}>
                    <input type="text" className={styles.keyword__inputfild__organic} placeholder='Enter keyword' />
                    </div>
                    <div className={styles.competitor__controll_box}>
                     
                       <CountrySelect />

                      <button className={styles.compare__button}>
                        Search
                      </button>
                    </div>
                  </div>
                  <h6 className={styles.example__of_domain_links}>Examples: <a href="/">loans</a> <a href="/">movies</a> <a href="/">how to buy audible books</a></h6>
                </div>
              </div>

              <div className={styles.keyword___info_main}>
                <h3 className={styles.keyword__subtitle}>Look what you’ll get inside</h3>

                <div className={styles.keyword__info__details_wrap}>
                  <div className={styles.info_modal_full}>
                  <img src={infoModal5} alt={infoModal5} className={styles.info_details_img} />
                  </div>
                  {/* ================ */}
                  <div className={styles.keyword__info__details_item}>
                    <div className={styles.info__details_modalimg__item}>
                      <img
                        src={infoModal6}
                        alt={infoModal6}
                        className={styles.info_details_modal1}
                      />
                    </div>
                    <div className={styles.info__details_cont_text__item}>
                      <h3 className={styles.keyword__subtitle}>
                      Analyze competitors on the SERP
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
                        src={infoModal8}
                        alt={infoModal8}
                        className={styles.info_details_modal1}
                      />
                    </div>
                    <div className={styles.info__details_cont_text__item}>
                      <h3 className={styles.keyword__subtitle}>
                      Get a historical perspective
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
                        src={infoModal7}
                        alt={infoModal7}
                        className={styles.info_details_modal1}
                      />
                    </div>
                    <div className={styles.info__details_cont_text__item}>
                      <h3 className={styles.keyword__subtitle}>
                      Explore keyword ideas
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
                <h2 className={styles.keyword__main_title}>Get all the data you need on any keyword</h2>
                <div className={styles.keyword__main_compere__box}>
                  {/* =============== */}
                  <div className={styles.keyword__compare_controlbox}>
                    <div className={styles.inputfild__box_organic}>
                    <input type="text" className={styles.keyword__inputfild__organic} placeholder='Enter keyword' />
                    </div>
                    <div className={styles.competitor__controll_box}>
                     
                       <CountrySelect />

                      <button className={styles.compare__button}>
                        Search
                      </button>
                    </div>
                  </div>
                  <h6 className={styles.example__of_domain_links}>Examples: <a href="/">loans</a> <a href="/">movies</a> <a href="/">how to buy audible books</a></h6>
                </div>


              </div>

              <div className={styles.keywordgap__top_main}>
                <h2 className={styles.keyword__main_title}>FAQ</h2>
                <div className={styles.questions__items_wrap}>

                {accordianData.map(({ id, question, answer }) => (
                     <Accordion key={id} id={id} question={question} answer={answer} />
                ))}

                </div>
              </div>


            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default KeywordOverviewHome