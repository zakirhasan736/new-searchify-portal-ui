import React, { useState, useEffect } from 'react'
import styles from './openAI.module.css';
import { FcGoogle } from "react-icons/fc";
import { HiArrowRight, HiReply } from "react-icons/hi";
import shapeImg1 from '../../../assets/img/gradient-shape.png'
import shapeImg2 from '../../../assets/img/gradient-shape-2.png'
import SimpleInputField from '../../share/inputFieldBox/SimpleInputField'
import { useParams } from 'react-router-dom';
import { db } from './openAIdb';
import TokenInput from '../../share/inputFieldBox/TokenInput';
const GenerateAI = () => {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [textDB, setTextDB] = useState([]);
  const [clear, setClear] = useState(false);

  const [state, setState] = useState({
    Cname: "",
    Pname: "",
    tokens: ""
  })

  const clearInput = () => {
    setState({
      Cname: "",
      Pname: "",
      tokens: ""
    });
    setClear(true)
  }

  const clearTextGenerator = () => {
    setTextDB([])
  }

  const generatetext = () => {
    setTextDB(textDB => [...textDB, state]);
    clearInput();
  }
  const handleChange = e => setState(prevState => ({ ...prevState, [e.target.name]: e.target.value }));

  useEffect(() => {
    let dbs = db.filter((item) => item.id === id);
    setData(dbs);
  }, [id]);

  return (
    <>
      <div className={styles.app_openAI_home}>
        <img className={styles.app_shape_img} src={shapeImg1} alt={shapeImg1} />
        <img className={styles.app_shape_img2} src={shapeImg2} alt={shapeImg2} />

        <div className={styles.openAI__main__head_wrap}>

          <div className={styles.generator__head_box}>
            <span className={styles.features__icone} ><FcGoogle /></span>
            <div className={styles.generator__head_cont}>
              <h3 className={styles.feature_card_title}>{data[0]?.title}</h3>
              <p className={styles.feature_card_desc}>{data[0]?.desc}</p>
            </div>
          </div>
          <div className={styles.text_generator__right_cont}>
            <ul className={styles.text_generator__top_tabs}>
              <li className={styles.text_generator_tabs_item}>New Output</li>
            </ul>
            <button onClick={() => clearTextGenerator()} className={styles.generate_reset__btn} type='button'><span className={styles.icons}><HiReply /></span> Clear</button>
          </div>

        </div>
        <div className={styles.generate__AI__wrap}>
          <div className={styles.app_openAI_wrapper}>

            <div className={styles.text_generator__mainwrap}>

              {/* left sidebar box */}
              <div className={styles.text_generator_leftwrap}>
                <div className={styles.generate__textfild__wrap}>
                  <div className={styles.single_input_box}>
                    <SimpleInputField onChange={handleChange} clear={clear} fieldTitle='Type of Written' value={state.Cname} singleFieldLenght='(0/80))' name="Cname" />
                  </div>
                  <div className={styles.single_input_box}>
                    <SimpleInputField onChange={handleChange} clear={clear} fieldTitle='Domain Title' value={state.Pname} singleFieldLenght='(0/80)' name="Pname" />
                  </div>
                  <div className={styles.single_input_box}>
                    <TokenInput onChange={handleChange} clear={clear} fieldTitle='Number of Tokens' value={state.tokens} singleFieldLenght='(0/80)' name="tokens" />
                  </div>
                </div>
                <div className={styles.text_generator__bottomnav}>
                  <div className={styles.control__action__btnbox}>
                    <button onClick={() => clearInput()} className={styles.clear__input_btn} type='button'><span className={styles.icons}><HiReply /></span> Clear</button>
                    <button onClick={() => state.Cname && state.Pname && state.tokens && generatetext()} className={styles.generate_btn} type='button'>Generate <span className={styles.icons}><HiArrowRight /></span></button>
                  </div>
                </div>
              </div>

              {/* right sidebar box */}
              <div className={styles.text_generator_rightwrap}>
                {
                  textDB.length > 0 &&
                  textDB.map((item, index) => (
                    <div key={index} className={styles.generated__item_box}>
                      <h6>{item.Cname}</h6>
                      <h6>{item.Pname}</h6>
                      <h6>{item.tokens}</h6>
                    </div>
                  ))
                }
              </div>

            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default GenerateAI