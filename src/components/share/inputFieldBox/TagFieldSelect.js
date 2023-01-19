import React, { useState, useEffect } from 'react'
import styles from './inputField.module.css'
import removedIcon from '../../../assets/img/x.png'
import downArrowIcon from '../../../assets/img/chevron-down.png'
import { fetchSearchifyTags, fetchAllDomains, findDomain} from "../../../utils/users/TagUtil";

const TagFieldSelect = ({onChange, selectedTags, inputTitle, clear, currentDomain }) => {
  const [tags, setTags] = useState([]);

  const [tagsDb, setTagsDb] = useState([]);

  const [openTag, setOpenTags] = useState(false);

  const handleRemoveTags = (arg) => {
    let newtags = tags.filter((item) => item !== arg);
    setTags(newtags)
    onChange(newtags)
  }

  const handleRemoveAllTags = () => {
    setTags([])
    onChange([])
  }

  const addTags = (tg) => {
    if (tags.length > 0) {
      let exittags = tags.filter((item) => item === tg);
      if (exittags.length === 0) {
        setTags(prev => [...prev, tg])
        onChange(prev => [...prev, tg])
      }
    }
    else {
      setTags(prev => [...prev, tg])
      onChange(prev => [...prev, tg])
    }
    setOpenTags(false)
  }

  useEffect(() => {
    let tags = ["Automotive", "Retail", "Education", "Publisher", "Import", "IT software", "Healtcare"];
    setTagsDb(tags);
    const fetchTags = async () => {
      const data = await fetchSearchifyTags(currentDomain);
      const allTags = await data.json();
      setTagsDb(allTags);
    }
    fetchTags()
    return () => {
      setTagsDb([]);
    }
  }, [])

  useEffect(() => {
    if (clear) {
      handleRemoveAllTags();
    }
  }, [clear])
  
  return (
    <>
      <div className={styles.input_fild__wrapper}>

        <div className={styles.input_fild__contbox}>

          <div className={styles.input_file_titlebox}>
            <h4 className={styles.input_title}>{inputTitle} <span className={styles.required}>*</span></h4>
          </div>

          <div onClick={() => setOpenTags(!openTag)} className={styles.input_fild_box}>

            <div className={styles.icon__box}>
              <span onClick={() => handleRemoveAllTags()} className={styles.removed__icon}>
                <img src={removedIcon} alt={removedIcon} />
              </span>
              <span className={styles.spacher}></span>
              <span onClick={() => setOpenTags(!openTag)} className={styles.down_arrow__icon}>
                <img src={downArrowIcon} alt={downArrowIcon} />
              </span>
            </div>

            <div className={styles.input_fild_select}>
              {selectedTags.length > 0 && selectedTags.map((tag) => (
                <div className={styles.tags_content}>
                  <span>{tag.name}</span>
                  <img onClick={() => handleRemoveTags(tag)} src={removedIcon} alt={removedIcon} />
                </div>
              ))}
              <div className={`${openTag && styles.active_tag_items} ${styles.tag_items}`}>
                <ul>
                  {tagsDb.length > 0 && tagsDb.map((item) => (
                    <li className={`${tags.indexOf(item) !== -1 && styles.selected_color}`} onClick={() => addTags(item)}>{item.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TagFieldSelect