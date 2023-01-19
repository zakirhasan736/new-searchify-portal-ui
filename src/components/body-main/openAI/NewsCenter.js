import React from 'react'
import styles from './openAI.module.css';
import { FiCopy } from "react-icons/fi";
import {VscArrowBoth} from "react-icons/vsc";
import {MdOutlineArrowForwardIos} from "react-icons/md";
import shapeImg1 from '../../../assets/img/gradient-shape.png'
import shapeImg2 from '../../../assets/img/gradient-shape-2.png'
const NewsCenter = () => {
  return (
    <>
    <div className={styles.app_openAI_home}>
      <img className={styles.app_shape_img} src={shapeImg1} alt={shapeImg1} />
      <img className={styles.app_shape_img2} src={shapeImg2} alt={shapeImg2} />
      <div className={styles.app_openAI_wrapper}>
        <div className={styles.features_main_wrapper}>
         <h2 className={styles.openAI__main_title}>Announcement</h2>

          <div className={styles.news__main_content}>
            <div className={styles.news_card_box}>

              <div className={styles.news__card_item}>
                <div className={styles.news_heading__title__box}>
                <h3 className={styles.news_card_title}>Announcing the Gen AI Even</h3>
                <span className={styles.news__number}>1 of 1</span>
                </div>
                <p className={styles.news_card_desc}>
                Create key and benefit bullet points for Google Ads listing under the "about this item" section
                Create key and benefit bullet points for Google Ads listing under the "about this item" section
                Create key and benefit bullet points for Google Ads listing under the "about this item" section
                </p>
                <div className={styles.news_card__btnbox}>
                  <a href='/' className={styles.link__btn}>Get your tickets here</a>
                  <button type='button' className={styles.next__step__btn}>Next <span className={styles.arrow__right}><MdOutlineArrowForwardIos /></span></button>
                </div>
              </div>

              <div className={styles.news__card_item}>
                <div className={styles.news_heading__title__box}>
                <h3 className={styles.news_card_title}>Refer your frieds</h3>
                <p className={styles.news__share_update}>Give 10k credits <span className={styles.icons}><VscArrowBoth /></span> Get 10k credits</p>
                </div>
                <p className={styles.news_card_desc}>Create key and benefit bullet points for Google Ads listing under the "about this item" section</p>
                <div className={styles.news_card__btnbox}>
                  <button type='button' className={styles.copy_sharelink__btn}><span className={styles.arrow__right}><FiCopy /></span> Copy Share link</button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  </>
  )
}

export default NewsCenter