import React from 'react';
import { Link,  useNavigate } from 'react-router-dom';
import styles from './projectcatelog.module.css';
import PlusIcon from '../../../assets/img/plus-icon.png'
import Card from '../../share/card/card';
import {getUser ,userLogout } from "../../../utils/users/Helpers";
import {getProject, getCrawlingData, getWebsite} from "../../../utils/users/ProjectUtil";
import { fetchAllDomains} from "../../../utils/users/TagUtil";

const ProjectCatelog = ({ projectTitle, addNewProject, seeMoreBtn, AddProject, DrafteProject }) => {

  const navigate = useNavigate()
  const handleCreateNew = () => {
    localStorage.removeItem('currentWebsite')
    navigate('/seooptimization/new')
  }
  const AddProjectData = [
    {
      id: 1,
      cardTitle: 'Project name',
      cardSubTitle: 'Product name',
      cardDesc: 'Name name',
      cardSubTitle2: 'Description',
      cardDesc2: `Description of project is an important thing of...`
    },
    {
      id: 2,
      cardTitle: 'Project name',
      cardSubTitle: 'Product name',
      cardDesc: 'Name name',
      cardSubTitle2: 'Description',
      cardDesc2: `Description of project is an  important thing of...`
    },
    {
      id: 3,
      cardTitle: 'Project name',
      cardSubTitle: 'Product name',
      cardDesc: 'Name name',
      cardSubTitle2: 'Description',
      cardDesc2: `Description of project is an  important thing of...`
    }
    ,
    {
      id: 4,
      cardTitle: 'Project name',
      cardSubTitle: 'Product name',
      cardDesc: 'Name name',
      cardSubTitle2: 'Description',
      cardDesc2: `Description of project is an  important thing of...`
    }
  ]
  const DrafteProjectData = [
    {
      id: 1,
      cardTitle: 'Project name2',
      cardSubTitle: 'Product name',
      cardDesc: 'Name name',
      cardSubTitle2: 'Description',
      cardDesc2: `Description of project is an  important thing of...`
    },
    {
      id: 2,
      cardTitle: 'Project name2',
      cardSubTitle: 'Product name',
      cardDesc: 'Name name',
      cardSubTitle2: 'Description',
      cardDesc2: `Description of project is an  important thing of...`
    },
    {
      id: 3,
      cardTitle: 'Project name2',
      cardSubTitle: 'Product name',
      cardDesc: 'Name name',
      cardSubTitle2: 'Description',
      cardDesc2: `Description of project is an  important thing of...`
    }
  ]
  return (
    <>
      <section className={styles.project_catelog_section}>
        <div className={styles.project_catelog_wrap}>
          <h2 className={styles.project_title}>{projectTitle}</h2>
          <div className={styles.project_catelog_cont_box}>
          <div className={styles.project__wrap_box}>
            <div className={styles.project__content_wrap}>
              {addNewProject && (
                <div onClick={handleCreateNew} className={styles.add_new__project}>
                  <img src={PlusIcon} alt={PlusIcon} className={styles.plus__icon} />
                  <h5 className={styles.add__projectsbtn__title}>New Project</h5>
                </div>
              )}
              {AddProject && (
                <div className={styles.projects__item}>
                  {
                    // AddProjectData.map(({ id, cardTitle, cardSubTitle, cardDesc, cardSubTitle2, cardDesc2 }) => (
                      getProject().websites?.map((website, i) => (
                      <Card
                        key={website.name}
                        cardTitle={website.name}
                        cardSubTitle={"Site Name"}
                        cardDesc={website.name}
                        cardSubTitle2={"Site Url"}
                        cardDesc2={website.url}
                        website={website}
                      />
                    ))}
                </div>
              )}
              {DrafteProject && (
                <div className={styles.projects__item}>
                  {
                    DrafteProjectData.map(({ id, cardTitle, cardSubTitle, cardDesc, cardSubTitle2, cardDesc2 }) => (
                      <Card
                        key={id}
                        cardTitle={cardTitle}
                        cardSubTitle={cardSubTitle}
                        cardDesc={cardDesc}
                        cardSubTitle2={cardSubTitle2}
                        cardDesc2={cardDesc2}
                      />
                    ))}
                    
                </div>
              )}             
            </div>
            {seeMoreBtn && (
              <div className={styles.project__item_box_more}>
                <Link to='/' className={styles.seeAll__btn}>See all</Link>
              </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default ProjectCatelog