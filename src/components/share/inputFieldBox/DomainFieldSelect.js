import React, { useState, useEffect } from 'react'
import styles from './domainField.module.css'
import removedIcon from '../../../assets/img/x.png'
import downArrowIcon from '../../../assets/img/chevron-down.png'
import { fetchAllDomains, findDomain} from "../../../utils/users/TagUtil";

const DomainFieldSelect = ({onDomainChange, inputTitle, clear, currentDomain }) => {

  const [domains, setDomains] = useState([]);

  const [domain, setDomain] = useState(null);

  const [domainsDb, setDomainsDb] = useState([]);

  const [openDomain, setOpenDomains] = useState(false);

  const handleRemoveDomains = (arg) => {
    let newdomains = domains.filter((item) => item !== arg);
    setDomains(newdomains)
  }

  const handleRemoveAllDomains = () => {
    setDomains([])
    setDomain(null)
  }

  const addDomain = (tg) => {
    setDomains([tg]);
    setDomain(tg);
    onDomainChange(tg);
    setOpenDomains(false)
  }

  useEffect(() => {
    const fetchDomains = async () => {
      const data = await fetchAllDomains();
      const allDomains = await data.json();
      setDomainsDb(allDomains);
      if(currentDomain){
        let currentDo = findDomain(currentDomain, allDomains)
        setDomains([currentDo]);
      }
    }

    fetchDomains();    
    return () => {
      setDomainsDb([]);
    }
  }, [])

  useEffect(() => {
    if (clear) {
      handleRemoveAllDomains();
    }
  }, [clear])
  
  
  return (
    <>
      <div className={styles.input_fild__wrapper}>

        <div className={styles.input_fild__contbox}>

          <div className={styles.input_file_titlebox}>
            <h4 className={styles.input_title}>{inputTitle} 
            {(!domain && !currentDomain) && <span style={{"color": "red"}}className={styles.required}> * (Input your domain here)</span>}
            
            </h4>
          </div>

          <div onClick={() => setOpenDomains(!openDomain)} className={styles.input_fild_box}>

            <div className={styles.icon__box}>
              <span onClick={() => handleRemoveAllDomains()} className={styles.removed__icon}>
                <img src={removedIcon} alt={removedIcon} />
              </span>
              <span className={styles.spacher}></span>
              <span onClick={() => setOpenDomains(!openDomain)} className={styles.down_arrow__icon}>
                <img src={downArrowIcon} alt={downArrowIcon} />
              </span>
            </div>

            <div className={styles.input_fild_select}>
              {domains.length > 0 && domains.map((domain) => (
                <div className={styles.domains_content}>
                  <span>{domain.name}</span>
                  <img onClick={() => handleRemoveDomains(domain)} src={removedIcon} alt={removedIcon} />
                </div>
              ))}
              <div className={`${openDomain && styles.active_domain_items} ${styles.domain_items}`}>
                <ul>
                  {domainsDb.length > 0 && domainsDb.map((item) => (
                    <li className={`${domains.indexOf(item) !== -1 && styles.selected_color}`} onClick={() => addDomain(item)}>{item.name}</li>
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

export default DomainFieldSelect