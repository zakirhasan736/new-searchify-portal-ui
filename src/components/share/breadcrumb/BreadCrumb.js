import React from 'react'
import styles from './breadCrumb.module.css'
import { useNavigate } from 'react-router-dom';
import { BsChevronLeft } from "react-icons/bs";
const BreadCrumb = ({withLinkText}) => {
  const navigate = useNavigate();
  return (
    <> 
    <div className={styles.breadcrumb__wrapper}>
        <div className={styles.breadcrumb__contbox}>
            <button  onClick={() => navigate(-1)} className={styles.breadcrumb_back_btn}><span><BsChevronLeft/></span> <h6>Back</h6></button>
            {withLinkText && (
              <h3 className={styles.breadctumb__title}>
              SEO Optimization
              </h3>
            )}
        </div>
    </div>
    </>
  )
}

export default BreadCrumb