import React from 'react'
import styles from './searchInsightResults.module.css'
import { Link } from 'react-router-dom'
import { useNavigate } from "react-router-dom";
import {getProject, isWebsiteExist, updateProject, getCrawlingData, getWebsite} from "../../../utils/users/ProjectUtil";
import { pickupFieldFromSuggestion } from "../../../utils/users/ProjectUtil";

const SearchInsightResult = () => {
    let navigate = useNavigate();
    const SearchInsightData = [
        {
            id: 1,
            title: 'Title:',
            normalText: 'Some title here' ,
            url:' URL:',
            link: 'https://www.figma.com/file/',
            btnText: 'Explore',
        },
        {
            id: 2,
            title: 'Title:',
            normalText: 'Some title here' ,
            url:' URL:',
            link: 'https://www.figma.com/file/',
            btnText: 'Explore',
        },
        {
            id: 3,
            title: 'Title:',
            normalText: 'Some title here' ,
            url:' URL:',
            link: 'https://www.figma.com/file/',
            btnText: 'Explore',
        },
        {
            id: 4,
            title: 'Title:',
            normalText: 'Some title here' ,
            url:' URL:',
            link: 'https://www.figma.com/file/',
            btnText: 'Explore',
        },
    ]
    const routeChange = (link) => {
        navigate("/projectmaking", { state: {webpage: link }});
      }
    
    return (
        <>
            <div className={styles.SearchInsightResult__wrapper}>
                <h2 className={styles.pageOverview__title}>SITE SEO CRAWLED</h2>
                <div className={styles.searchResults__box}>
                    <ul className={styles.searchResults__list}>
                        <li className={styles.searchResults__list_items}>
                            <ul className={styles.search_project__list_box}>
                                <li className={styles.__project__list_items}>
                                        <div className={styles.__project_detailsbox}>
                                            <div style={{"width": "40%"}} className={styles.__project_details__Itembox}>
                                                <h5 className={styles.__details_list__title}>{"Page Url"}</h5>
                                            </div>
                                            <div style={{"width": "60%"}} className={styles.__project_details__Itembox}>
                                                <h5 className={styles.__details_list__title}>PAGE TITLE</h5>
                                            </div>
                                            
                                        </div>
                                    </li>
                                {getCrawlingData().internalResources.map((link) => (
                                    <li className={styles.__project__list_items}>
                                        <div className={styles.__project_detailsbox}>
                                            <div style={{"width": "40%"}} className={styles.__project_details__Itembox}>
                                                <h5 className={styles.__details_list__title}>{URL}</h5>
                                                <Link to='/'><code>{link.url}</code></Link>

                                            </div>
                                            <div style={{"width": "60%"}} className={styles.__project_details__Itembox}>
                                            <h5 className={styles.__details_list__title}>Title</h5>
                                                <p className={styles.normal_text}>{link.title}</p>
                                            </div>
                                        </div>
                                        <div className={styles.__project_details_btn}>
                                            <button  className={styles.explore__button}
                                                onClick={() => routeChange(link)}>Explore
                                             </button>
                                        </div>
                                    </li>
                                ))}

                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </>
    )
}

export default SearchInsightResult