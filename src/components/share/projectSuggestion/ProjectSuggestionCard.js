import React from 'react'
import styles from './projectSuggestion.module.css'
import { Link } from 'react-router-dom'
const ProjectSuggestionCard = ({applyIt, suggestion}) => {

  const handleUseIt = () => {
    applyIt(suggestion)
  }
  return (
    <>
      <div className={styles.project__suggestion_result_wrap}>
        <div className={styles.project_suggestion_contbox} >
           <h3 className={styles.__project_title}>{suggestion.title}</h3>
           <p className={styles.__project_desc}>
          {suggestion.description}
           </p>
        </div>
        <div className={styles.__suggestion_action_btn}>
          {/* <Link to='/' className={styles.__rename_btn}>{btn1}</Link>
          <Link to='/' className={styles.__copy_btn}>{btn2}</Link> */}
          <button className={styles.__useIt_btn} onClick = {handleUseIt}>Use it</button>
          {/* <Link className={styles.__useIt_btn}>Use it</Link> */}
        </div>
      </div>
    </>
  )
}

export default ProjectSuggestionCard