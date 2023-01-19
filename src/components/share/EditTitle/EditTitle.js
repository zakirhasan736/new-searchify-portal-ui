import React, {  useEffect, useState }  from 'react'
import styles from './EditTitle.module.css'
import EditeIcon from '../../../assets/img/edit-2.png'
import {getProject, isWebsiteExist, updateProject, getCrawlingData, getWebsite} from "../../../utils/users/ProjectUtil";

const EditTitle = ({onChange, editingTitle , editedTitle, TitleGradient, isNew}) => {
  const [siteName, setSiteName] = useState(null);
  const [website, setWebsite] = useState(null);


  const onEditSiteNameChanged = (event) => {
    setSiteName(event.target.value);
    onChange(event.target.value);
  }

  useEffect(() => {
    if(getWebsite() != null && siteName == null && !isNew) {
        setSiteName(getWebsite().name);
    }
    
  })
  

  return (
    <>
     <div className={styles.input_file_titlebox}>
        <h4 className={styles.input_title}>
          {!siteName && <span style={{"color": "red"}}className={styles.required}> * (Please enter the valid url)</span>}
        </h4>
      </div>
    <div className={styles.edit__title_box}>
          {
            editingTitle && (
        <h2 className={styles.__project__title}>
              <input className={styles.project_titleInput} type='text' 
                value={siteName}  readOnly = {!isNew}
                onChange={onEditSiteNameChanged} placeholder='Project Name here' />
              <label className={styles.edite__icon__pen}><img src={EditeIcon} alt={EditeIcon} /></label>
        </h2>
            )
          }
            { editedTitle && (
               <h2 className={styles.__project__title}>
               Project Name here
              <label className={styles.edite__icon__pen}><img src={EditeIcon} alt={EditeIcon} /></label>
             </h2>
            )}
             { TitleGradient && (
               <h2 className={styles.__gradient__title}>
               <span>{siteName}</span>
              {/* <span className={styles.edite__icon__pen}><img src={EditeIcon} alt={EditeIcon} /></span> */}
             </h2>
            )}
    </div>
    </>
  )
}

export default EditTitle