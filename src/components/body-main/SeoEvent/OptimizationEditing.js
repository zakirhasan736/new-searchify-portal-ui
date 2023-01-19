import React from 'react'
import styles from './SeoEvent.module.css'
import SearchWithbtn from '../../share/search/searchWithbtn'
import BreadCrumb from '../../share/breadcrumb/BreadCrumb'
import EditTitle from '../../share/EditTitle/EditTitle'
import PageOverview from '../../core/pageOverview/PageOverview'
import { Link } from 'react-router-dom'
import { RiDeleteBin6Line } from "react-icons/ri";
import SearchInsightResult from '../../core/searchInsight/SearchInsightResult'
import shapeImg3 from '../../../assets/img/gradient-shape3.png'
import shapeImg4 from '../../../assets/img/gradient-shape4.png'

const OptimizationEditing = () => {
    return (
        <>
            <div className={styles.app_SEO_Optimization}>
                <img className={styles.app_shape_img} src={shapeImg3} alt={shapeImg3} />
                <img className={styles.app_shape_img4} src={shapeImg4} alt={shapeImg3} />
                <div className={styles.SEO_Optimization_wrapper}>
                    <div className={styles.breadcrumb__box}>
                        <BreadCrumb withLinkText={true} />
                    </div>
                    <div className={styles.project_action_box}>
                        <div className={styles.editing__titlebox}>
                        <EditTitle editedTitle={true} />
                        </div>
                        <div className={styles.__delete_action_btn}>
                            <Link to='/' className={styles.project_delete__button}><span className={styles.delete__icons}><RiDeleteBin6Line /></span> Delete project</Link>
                        </div>
                    </div>
                    <div className={styles.search__inputbox}>
                        <SearchWithbtn />
                    </div>
                    <div className={styles.app__search_results_wrap}>
                        <PageOverview />
                        <SearchInsightResult />
                    </div>
                </div>
            </div>
        </>
    )
}

export default OptimizationEditing