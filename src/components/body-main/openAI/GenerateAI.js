import React from 'react'
import styles from './openAI.module.css';
import { FcGoogle } from "react-icons/fc";
import { HiArrowRight, HiReply } from "react-icons/hi";
import shapeImg1 from '../../../assets/img/gradient-shape.png'
import shapeImg2 from '../../../assets/img/gradient-shape-2.png'
import SimpleInputField from '../../share/inputFieldBox/SimpleInputField'
const GenerateAI = () => {
  return (
    <>
      <div className={styles.app_openAI_home}>
        <img className={styles.app_shape_img} src={shapeImg1} alt={shapeImg1} />
        <img className={styles.app_shape_img2} src={shapeImg2} alt={shapeImg2} />

        <div className={styles.openAI__main__head_wrap}>

          <div className={styles.generator__head_box}>
            <span className={styles.features__icone} ><FcGoogle /></span>
            <div className={styles.generator__head_cont}>
              <h3 className={styles.feature_card_title}>Google ad-copy outputs</h3>
              <p className={styles.feature_card_desc}>Create key and benefit bullet points for Google Ads listing under the "about this item" section</p>
            </div>
          </div>

          <div className={styles.text_generator__right_cont}>
            <ul className={styles.text_generator__top_tabs}>
              <li className={styles.text_generator_tabs_item}>New Output</li>
            </ul>
            <button className={styles.generate_reset__btn} type='button'><span className={styles.icons}><HiReply /></span> Clear</button>
          </div>

        </div>
        <div className={styles.generate__AI__wrap}>
          <div className={styles.app_openAI_wrapper}>

            <div className={styles.text_generator__mainwrap}>

              {/* left sidebar box */}
              <div className={styles.text_generator_leftwrap}>
                <div className={styles.generate__textfild__wrap}>
                  <div className={styles.single_input_box}>
                    <SimpleInputField singleFieldTitle='Company name' singleFieldLenght='(0/80))' />
                  </div>
                  <div className={styles.single_input_box}>
                    <SimpleInputField singleFieldTitle='Product name' singleFieldLenght='(0/80)' />
                  </div>
                  <div className={styles.single_input_box}>
                    <SimpleInputField singleFieldTitle='Keywords' singleFieldLenght='(0/80)' />
                  </div>
                </div>
                <div className={styles.text_generator__bottomnav}>
                  <div className={styles.control__action__btnbox}>
                    <button className={styles.clear__input_btn} type='button'><span className={styles.icons}><HiReply /></span> Clear</button>
                    <button className={styles.generate_btn} type='button'>Generate <span className={styles.icons}><HiArrowRight /></span></button>
                  </div>
                </div>
              </div>

              {/* right sidebar box */}
              <div className={styles.text_generator_rightwrap}>


              </div>

            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default GenerateAI