import React from 'react'
import styles from './openAI.module.css';
import { FcGoogle } from "react-icons/fc";
import shapeImg1 from '../../../assets/img/gradient-shape.png'
import shapeImg2 from '../../../assets/img/gradient-shape-2.png'
const FeaturesAI = () => {
  return (
    <>
      <div className={styles.app_openAI_home}>
        <img className={styles.app_shape_img} src={shapeImg1} alt={shapeImg1} />
        <img className={styles.app_shape_img2} src={shapeImg2} alt={shapeImg2} />
        <div className={styles.app_openAI_wrapper}>
          <div className={styles.features_main_wrapper}>
           <h2 className={styles.openAI__main_title}>AI Features</h2>
            <div className={styles.feature_top_box}>
              <ul className={styles.feature_filterbox}>
                <li className={styles.filter__btnitem}><button type='button' className={styles.filter_btn}>All</button></li>
                <li className={styles.filter__btnitem}><button type='button' className={styles.filter_btn}>Ads</button></li>
                <li className={styles.filter__btnitem}><button type='button' className={styles.filter_btn}>Grammer</button></li>
                <li className={styles.filter__btnitem}><button type='button' className={styles.filter_btn}>Blog</button></li>
              </ul>
            </div> 

            <div className={styles.features__main_content}>
              <div className={styles.features_card_box}>

                <div className={styles.feature__card_item}>
                  <span className={styles.features__icone} ><FcGoogle /></span>
                  <h3 className={styles.feature_card_title}><a href='/' >Google ad-copy outputs</a></h3>
                  <p className={styles.feature_card_desc}>Create key and benefit bullet points for Google Ads listing under the "about this item" section</p>
                </div>

                <div className={styles.feature__card_item}>
                  <span className={styles.features__icone} ><FcGoogle /></span>
                   <h3 className={styles.feature_card_title}><a href='/' >Facebook ad-copy outputs</a></h3>
                  <p className={styles.feature_card_desc}>Create key and benefit bullet points for Facebook Ads listing under the "about this item" section</p>
                </div>

                <div className={styles.feature__card_item}>
                  <span className={styles.features__icone} ><FcGoogle /></span>
                   <h3 className={styles.feature_card_title}><a href='/' >Google ad-copy outputs</a></h3>
                  <p className={styles.feature_card_desc}>Create key and benefit bullet points for Google Ads listing under the "about this item" section</p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default FeaturesAI