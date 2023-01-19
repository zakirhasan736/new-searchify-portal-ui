import React, { useState } from 'react'
import Moredots from '../../../assets/icon/More-dots.svg'
import { Link,  useNavigate } from 'react-router-dom';
import styles from './card.module.css';
import {getProject, isWebsiteExist, updateProject, getCrawlingData, getWebsite} from "../../../utils/users/ProjectUtil";


const Card = ({ cardTitle, cardSubTitle, cardDesc, cardSubTitle2, cardDesc2, website }) => {
  const [more, setMore] = useState(null);
  const navigate = useNavigate()

  const handleNextRoute = () => {
    localStorage.setItem('currentWebsite', JSON.stringify(website));
    localStorage.removeItem('crawlingData');
    navigate('/seooptimization');

  }

  const handleRemoveWebsite = async () => {
    const project = getProject()
    let updatedWebsites = project.websites.filter(item => item.url !== website.url)
    project.websites = updatedWebsites;
    const resProject = await updateProject(project);
    const resultProject = await resProject.json();
    localStorage.setItem('project', JSON.stringify(resultProject));
    navigate('/works');
    
  }
  return (
    <>
      <div  className={styles.projects__card__item_box}>
        <div className={styles.project__Card_box}>
          <h3 className={styles.project__card_title}>{cardTitle}</h3>
          <div className={styles.card__cont_box}>
            <h5 className={styles.card__cont_subtitle}>{cardSubTitle}</h5>
            <p className={styles.card__cont_desc}>{cardDesc}</p>
          </div>

          <div className={styles.card__cont__wrap}>
            <div className={styles.card__cont_box}>
              <h5 className={styles.card__cont_subtitle}>{cardSubTitle2}</h5>
              <p className={styles.card__cont_desc}>{cardDesc2}</p>
            </div>
            <div className={styles.card_action_morebox}>
              <img onClick={() => setMore(!more)} className={styles.card_action_icons} src={Moredots} alt={Moredots} />
              {/* active_card_action_info_list */}
              <ul onMouseLeave={() => setMore(null)} className={`${more && styles.active_card_action_info_list} ${styles.card_action_info_list}`}>
                <li className={styles.card__action__item} onClick={()=>handleNextRoute()}><Link to="/">Update</Link></li>
                <li className={styles.card__action__item} onClick={()=>handleRemoveWebsite()}><Link to="/">Remove</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>



    </>
  )
}

export default Card