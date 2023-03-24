import React, { useState,useEffect}  from 'react'; 
import styles from '../../body-main/analytics/analytics.module.css'
import {
    TfiAngleDown,
  
  } from 'react-icons/tfi';
const CountrySelect = () => {
    const [country, setCountries] = useState([]);    
    const [selected_country_name, updatedCountryName] = useState("US");
    const [openCountryList, updatedOpenCountryList] = useState(null);
    
    useEffect(() => {
      fetch("https://restcountries.com/v3.1/all")
        .then((res) => res.json())
        .then((data) => {
          setCountries(data);
        });
    }, []);
  return (
    <>
                        <div className={styles.country__select_widget}>
                        <li className={styles.selected_country_list} onClick={() => updatedOpenCountryList(!openCountryList)}> {selected_country_name}
                         <span className={styles.arrow_down}>< TfiAngleDown /></span>
                        </li>
                        {openCountryList && <div className={styles.openListcontent}>
                          {country.map((item, index) => (
                            <ul className={styles.country_container} key={index}>
                              <li className={styles.image_container}>
                                <img src={item.flags.png} alt={item.name.common} />
                              </li>
                              <h6 onClick={() => { updatedCountryName(item.cca2); updatedOpenCountryList(false) }}>{item.cca2}</h6>
                            </ul>
                          ))}
                        </div>}
                      </div>
    </>
  )
}

export default CountrySelect