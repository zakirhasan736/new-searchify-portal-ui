import React from 'react'
import styles from './home.module.css';
import ProjectCatelog from '../../core/projectCatelog/ProjectCatelog';
import shapeImg1 from '../../../assets/img/gradient-shape.png'
import shapeImg2 from '../../../assets/img/gradient-shape-2.png'
const DashboardHome = () => {
  return (
    <div className={styles.app_dashboard_home}>
      <img className={styles.app_shape_img} src={shapeImg1} alt={shapeImg1} />
      <img className={styles.app_shape_img2} src={shapeImg2} alt={shapeImg2} />
      <div className={styles.app_dashboard_wrapper}>

        <div className={styles.new__add_project}>
          <ProjectCatelog addNewProject={true} projectTitle='Projects' seeMoreBtn={false} AddProject={true} />
        </div>

        {/* <div className={styles.drafted__project}>
          <ProjectCatelog addNewProject={false} projectTitle='Drafts' seeMoreBtn={false} DrafteProject={false} />
        </div> */}
      </div>
    </div>
  )
}

export default DashboardHome