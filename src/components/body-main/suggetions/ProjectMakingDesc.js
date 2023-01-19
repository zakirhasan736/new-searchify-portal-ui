import React, { useState, useEffect } from 'react'
import EditTitle from '../../share/EditTitle/EditTitle'
import BreadCrumb from '../../share/breadcrumb/BreadCrumb'
import { Link } from 'react-router-dom'
import shapeImg5 from '../../../assets/img/gradient-shape5.png'
import InputFieldSelect from '../../share/inputFieldBox/InputFieldSelect'
import SimpleInputField from '../../share/inputFieldBox/SimpleInputField'
import SimpleTextarea from '../../share/inputFieldBox/SimpleTextarea'
import ProjectSuggestionCard from '../../share/projectSuggestion/ProjectSuggestionCard'
import styles from './style.module.css'
import { db } from './db'
import Loader from '../../share/loader/Loader'


const ProjectMakingDesc = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleTabs = (name) => {
        setLoading(true)
        let newDB = db.filter((item => item.name.includes(name)));
        setLoading(false)
        setData(newDB);
    }
    useEffect(() => {
        setLoading(true)
        setData(db)
        return () => {
            setLoading(false)
            setData([])
        }
    }, [])

    const handleSelectDomain = async (e) => {
        console.log(e);
    }
    return (
        <>
            <section className={styles.app_seo_project_making}>
                <img className={styles.app_shape_img5} src={shapeImg5} alt={shapeImg5} />
                <div className={styles.seo_project_making_wrapper}>
                    <div className={styles.seo_project_making_leftWrap}>
                        <div className={styles.__project_making__topbar}>
                            <div className={styles.breadcrumb__boxitem}>
                                <BreadCrumb />
                            </div>
                            <div className={styles.gradient__titlebox}>
                                <EditTitle TitleGradient={true} />
                            </div>
                        </div>
                        <div className={styles.project_making__wrapbox_left}>
                            <div className={styles.select__items__box}>
                                <InputFieldSelect inputTitle='Category'
                                    onChange={handleSelectDomain} />
                            </div>
                            <div className={styles.select__items__box}>
                                <InputFieldSelect inputTitle='Tags' />
                            </div>
                            <div className={styles.single_input_box}>
                                <SimpleInputField singleFieldTitle='Company name' singleFieldLenght='(0/80))' />
                            </div>
                            <div className={styles.single_input_box}>
                                <SimpleInputField singleFieldTitle='Product name' singleFieldLenght='(0/80)' />
                            </div>
                            <div className={styles.single_input_box}>
                                <SimpleInputField singleFieldTitle='Keywords' singleFieldLenght='(0/80)' />
                            </div>
                            <div className="desc_text_box">
                                <SimpleTextarea DescTitle='Description' DesctextLenght='(0/400)' />
                            </div>
                        </div>

                        <div className={styles.__project_making_btnbox}>
                            <Link className={styles.__cancel__button} top="/">Clear</Link>
                            <Link className={styles.__save__button} top="/">Save</Link>
                        </div>
                    </div>
                    <div className={styles.seo_project_making_rightWrap}>
                        <div className={styles.__project_making__topbar}>
                            <div className={styles.__projects_type__tabs}>
                                <button onClick={() => handleTabs("default")} className={styles.tabs__btn_styles}>List of suggestions</button>
                                <button onClick={() => handleTabs("deep")} className={styles.tabs__btn_styles}>Deep suggestions</button>
                            </div>
                        </div>
                        <div className={styles.__project_making_right_wrap}>
                            <div className={styles.__suggestion__project_cont}>
                                {data.length > 0 ? data.map(({ id, title, desc, btn1, btn2, btn3 }) => (
                                    <ProjectSuggestionCard
                                        key={id}
                                        title={title}
                                        desc={desc}
                                        btn1={btn1}
                                        btn2={btn2}
                                        btn3={btn3}
                                    />
                                )) :
                                    <div className={styles.loader}>
                                        <Loader />
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default ProjectMakingDesc