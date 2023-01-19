import React from 'react'
import { Link } from 'react-router-dom'
import styles from './pageOerview.module.css'
import { useNavigate } from "react-router-dom";
import {getUser, userLogout } from "../../../utils/users/Helpers";
import {getProject, isWebsiteExist, updateProject, getCrawlingData, getWebsite} from "../../../utils/users/ProjectUtil";

const PageOverview = () => {
  let navigate = useNavigate();
  const routeChange = (link) => {
    navigate("/dashboard", {state: {websiteUrl: getWebsite().url}});
  }
  return (
    <>
     <div className={styles.PageOverview__wrapper_box}>
        <h2 className={styles.pageOverview__title}>Site Overview</h2>
        <div className={styles.pageOverview__contant_box}>
            <ul className={styles.pageOverview__project_details}>
                <li className={styles.__project_details_list}>
                    <h5 className={styles.__details_list__title}>URL:</h5>
                    {getWebsite() &&<Link to='/'><code style={{"margin-left": "50px"}} >{getWebsite().url}</code></Link>}
                    </li>
                    <li className={styles.__project_details_list}>
                    <h5 className={styles.__details_list__title}>Site name </h5>
                    {getWebsite() && <p style={{"margin-left": "50px"}} className={styles.simpleText}>{getWebsite().name}</p>}
                    </li>
                    <li className={styles.__project_details_list}>
                    <h5 className={styles.__details_list__title}>Ranking</h5>
                    <button className={styles.__view__dashboard__button} style={{"margin-left": "50px"}} 
                         onClick={() => routeChange()}
                    >VIEW YOUR SITE RANKING</button>
                    </li>
            </ul>
            {/* <div className={styles.button__action_box}>
              <Link to="/">New recommendations</Link>
            </div> */}
        </div>
     </div>
    </>
  )
}

export default PageOverview