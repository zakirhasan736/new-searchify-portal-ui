import React, { useEffect, useState } from 'react'
import EditTitle from '../../share/EditTitle/EditTitle'
import BreadCrumb from '../../share/breadcrumb/BreadCrumb'
import shapeImg5 from '../../../assets/img/gradient-shape5.png'
import TagFieldSelect from '../../share/inputFieldBox/TagFieldSelect'
import DomainFieldSelect from '../../share/inputFieldBox/DomainFieldSelect'
import SimpleInputField from '../../share/inputFieldBox/SimpleInputField'
import SimpleTextarea from '../../share/inputFieldBox/SimpleTextarea'
import ProjectSuggestionCard from '../../share/projectSuggestion/ProjectSuggestionCard'
import DeepSuggestionCard from '../../share/projectSuggestion/DeepSuggestionCard'
import styles from './style.module.css'
import { db } from './db'
import { useNavigate, useLocation } from "react-router-dom";
import CONFIG from "../../../config/users/Constant";
import { getUser, userLogout } from "../../../utils/users/Helpers";
import {getProject, isWebsiteExist, updateProject, getCrawlingData, pickupWebsiteFromProject, getWebsite, addWebpageAndUpdateProject} from "../../../utils/users/ProjectUtil";
import { detectTagsData, fetchAllDomains,fetchDeepSuggestions, fetchSearchifyTags, simplifyTags, fetchSuggestionsByDomain } from "../../../utils/users/TagUtil";

const ProjectMakingTags = () => {
    const [data, setData] = useState([]);
    const [tags, setTags] = useState([]);
    const [showDeep, setShowDeep] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [deepSuggestions, setDeepSuggestions] = useState([]);
    const [suggestionCompanyName, setSuggestionCompanyName] = useState(null);
    const [suggestionProductName, setSuggestionProductName] = useState(null);
    const [suggestionKeywords, setSuggestionKeywords] = useState(null);
    const [suggestionDescriptions, setSuggestionDescriptions] = useState(null);
    const [clearInput, setInput] = useState(false);
    const [tab, setTabs] = useState("default");

    const location = useLocation();

    const webpage = location.state.webpage;

    const handleTabs = (name) => {
        setTabs(name);
        let newDB = db.filter((item => item.name.includes(tab)));
        setData(newDB);
    };
    const handleKeywordChanged = (e) => {
        setSuggestionKeywords(e.target.value);
    }
    const handleCompanyNameChanged = (e) => {
        setSuggestionCompanyName(e.target.value);
    }
    const handleProductNameChanged = (e) => {
        setSuggestionProductName(e.target.value);
    }
    const handleDescriptionsChanged = (e) => {
        setSuggestionDescriptions(e.target.value);
    }

    const handleUseIt = (item) => {

        setSuggestionDescriptions(item.description)
        setSuggestionKeywords(item.title)
      
    }
    const handleClearInput = () => {
        setSuggestionCompanyName("")
        setSuggestionProductName("")
        setSuggestionKeywords("")
        setSuggestionDescriptions("")
        const a = suggestionKeywords
        setTags([]);
        // if (!clearInput) {
        //     setInput(true)
        // }
    }

    const handleTagsChanged = (newTags) => {
        const dd = tags
        setTags(newTags)
    }

    const previewPageTitle = () => {
        let pageTitle = ""
        if(suggestionCompanyName) {
            pageTitle = pageTitle + suggestionCompanyName
        }
        if(suggestionProductName) {
            pageTitle = pageTitle + " | " + suggestionProductName
        }
        if(suggestionKeywords) {
            pageTitle = pageTitle + " | " + suggestionKeywords
        }
        if(pageTitle.length > 0) {
            return pageTitle;
        } else {
            return "Page Title";
        }
    }

    const previewMetaDescriptions = () => {
        if(suggestionDescriptions) {
            return  suggestionDescriptions 
        }
            return "Meta descriptions";
        
    }

    const handleSaveWebPageSuggestion = async () => {
        const currentWebpageSuggestion = {
            createdDate: Date().toLocaleString(),
            fieldContents: [{ name: 'title', value: previewPageTitle() },
            { name: 'keywords', value: suggestionKeywords },
            { name: 'description', value: suggestionDescriptions }
            ]
        };

        const currentWebpage = {
            id: null,
            templateId: null,
            name: null,
            url: webpage.url,
            ranking: null,
            currentSuggestion: currentWebpageSuggestion,
            revisions: null,
            settings: null,
            fieldContents: null,
            answers: null,
            gaTrackings: null
        }
        const res = await addWebpageAndUpdateProject(getProject(), getWebsite(), currentWebpage);
        const returnProject = await res.json();
        localStorage.setItem('project', JSON.stringify(returnProject));
        localStorage.setItem('currentWebsite', JSON.stringify(pickupWebsiteFromProject(returnProject, getWebsite().url)));

    }

    const handleDeepSuggestions = async () => {
        const res = await fetchDeepSuggestions(suggestionDescriptions);

        setDeepSuggestions(res)
        setShowDeep(true)
    }

    useEffect(() => {
        setData(db)
        const fetchSuggestions = async (domain) => {
            const res = await fetchSuggestionsByDomain(domain);
            const fetchSuggestions = await res.json();
            setSuggestions(fetchSuggestions)
        }
        fetchSuggestions(getWebsite().settings.domain);
        return () => {
            setData([])
        }
    }, [])

    var filteredSuggestions = [];
    filteredSuggestions = suggestions.filter((item) => {
        if (
            tags.length == 0
        ) {
            return item;
        } else {
            var relationships = item.relationships;
            for (let i = 0; i < relationships.length; i++) {
                var count = 0;
                for (let j = 0; j < tags.length; j++) {
                    if (tags[j].value === relationships[i].label) {
                        count++;
                    }
                }
            if (count === tags.length) {
                return item;
            }
            }
        }
    });

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
                            <div class="projectSuggestion_project__suggestion_result_wrap__Vsaow">
                                <div class="projectSuggestion_project_suggestion_contbox__BGVpi">
                                    <div style={{"font-size": "10px"}}>
                                        {webpage.url}
                                    </div>
                                    <h3 class="projectSuggestion___project_title__SjGoy">{previewPageTitle()}</h3>
                                    <p style={{"font-size": "10px"}} class="projectSuggestion___project_desc__i77ZL">{previewMetaDescriptions()}</p>
                                </div>
                            </div>
                            <div style={{"margin-bottom": "15px"}} className={styles.single_input_box}>
                                <SimpleInputField fieldTitle='Company name' name='Cname' 
                                   onChange = {handleCompanyNameChanged}
                                   value={suggestionCompanyName}
                                    clear={clearInput}/>
                            </div>
                            <div style={{"margin-bottom": "15px"}} className={styles.single_input_box}>
                                <SimpleInputField fieldTitle='Product name' name='Pname' 
                                    onChange = {handleProductNameChanged}
                                    value={suggestionProductName}
                                    clear={clearInput}/>
                            </div>
                            <div style={{"margin-bottom": "15px"}} className={styles.select__items__box}>
                                <TagFieldSelect inputTitle='Tags' clear={clearInput} 
                                 selectedTags = {tags}
                                 currentDomain={getWebsite().settings.domain}
                                 onChange = {handleTagsChanged}/>
                            </div>
                            <div style={{"margin-bottom": "15px"}} className={styles.single_input_box}>
                                <SimpleInputField fieldTitle='Keywords' name='keyword' 
                                    value={suggestionKeywords} 
                                    onChange = {handleKeywordChanged}
                                    clear={clearInput} />
                            </div>

                            <div style={{"margin-bottom": "15px"}} className={styles.single_input_box}>
                                <SimpleTextarea fieldTitle='Description' name='desc' 
                                    value = {suggestionDescriptions}
                                    onChange = {handleDescriptionsChanged}    
                                    clear={clearInput} />
                            </div>
                        </div>

                        <div className={styles.__project_making_btnbox}>
                            <button onClick={() => handleClearInput()} className={styles.__cancel__button}>Clear</button>
                            <button onClick = {handleSaveWebPageSuggestion} className={styles.__save__button}>Save</button>
                            <button onClick = {handleDeepSuggestions} className={styles.__ai__button}>AI Generation</button>
                        </div>
                    </div>
                    <div className={styles.seo_project_making_rightWrap}>
                        <div className={styles.__project_making__topbar}>
                            <div className={styles.__projects_type__tabs}>
                                <button onClick={() => setShowDeep(false)}
                                    className={`${tab==="default" && styles.active} ${styles.tabs__btn_styles}`}>
                                    List of suggestions
                                </button>
                                <button onClick={() => setShowDeep(true)} 
                                    className={`${tab==="deep" && styles.active} ${styles.tabs__btn_styles}`}>
                                    Deep suggestions
                                </button>
                            </div>
                        </div>
                        <div className={styles.__project_making_right_wrap}>
                            {!showDeep? (
                            <div className={styles.__suggestion__project_cont}>
                                {filteredSuggestions && filteredSuggestions.map((item) => (
                                    <ProjectSuggestionCard
                                        suggestion={item}
                                        applyIt = {handleUseIt}
                                    />
                                ))}

                            </div>
                            ): (
                            <div className={styles.__suggestion__project_cont}>
                                {deepSuggestions && deepSuggestions.map((item) => (
                                    <DeepSuggestionCard
                                        suggestion={item}
                                        applyIt = {handleUseIt}
                                    />
                                ))}

                            </div>
                            )
                            }
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default ProjectMakingTags