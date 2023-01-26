import React, { useState, useEffect, useMemo } from 'react'
import styles from './openAI.module.css';
import { FcGoogle } from "react-icons/fc";
import shapeImg1 from '../../../assets/img/gradient-shape.png'
import shapeImg2 from '../../../assets/img/gradient-shape-2.png'
import { db } from './openAIdb';
import { Link } from 'react-router-dom';
const FeaturesAI = () => {

  const [data, setData] = useState([]);
  const [filter, setFilterText] = useState("");

  const handleFilter = useMemo(() => { 
    if (filter.length > 0) {
      let data = db.filter((item) => item.categories.includes(filter));
      setData(data)
    }
  }, [filter]);

  useEffect(() => {
    setData(db)

    return () => {
      setData([])
    }
  }, [])


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
                <li onClick={() => setFilterText("all")} className={styles.filter__btnitem}><button type='button' className={styles.filter_btn}>All</button></li>
                <li onClick={() => setFilterText("ads")} className={styles.filter__btnitem}><button type='button' className={styles.filter_btn}>Ads</button></li>
                <li onClick={() => setFilterText("grammer")} className={styles.filter__btnitem}><button type='button' className={styles.filter_btn}>Grammer</button></li>
                <li onClick={() => setFilterText("blog")} className={styles.filter__btnitem}><button type='button' className={styles.filter_btn}>Blog</button></li>
              </ul>
            </div>

            <div className={styles.features__main_content}>
              <div className={styles.features_card_box}>
                {
                  data.map(((item, index) => (
                    <div key={index} className={styles.feature__card_item}>
                      <span className={styles.features__icone} ><FcGoogle /></span>
                      <h3 className={styles.feature_card_title}><Link to={`/text-generator/${item.id}`} >{item.title}</Link></h3>
                      <p className={styles.feature_card_desc}>{item.desc}</p>
                    </div>
                  )))
                }
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default FeaturesAI