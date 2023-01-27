import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './SeoEvent.module.css'
import shapeImg3 from '../../../assets/img/gradient-shape3.png'
import SearchWithbtn from '../../share/search/searchWithbtn'
import BreadCrumb from '../../share/breadcrumb/BreadCrumb'
import DomainFieldSelect from '../../share/inputFieldBox/DomainFieldSelect'
import EditTitle from '../../share/EditTitle/EditTitle'
import PageOverview from '../../core/pageOverview/PageOverview'
import SearchInsightResult from '../../core/searchInsight/SearchInsightResult'
import SiteInsightResult from '../../core/searchInsight/SiteInsightResult'
import CONFIG from "../../../config/users/Constant";
import { getUser, userLogout } from "../../../utils/users/Helpers";
import { getProject, isWebsiteExist, updateProject, getCrawlingData, getWebsite } from "../../../utils/users/ProjectUtil";
import { detectTagsData, fetchAllDomains, fetchSearchifyTags, simplifyTags } from "../../../utils/users/TagUtil";
import Loader from '../../share/loader/Loader';

export const SeoOptimization = () => {
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [websites, setWebsites] = useState(null);
  const [website, setWebsite] = useState(null);
  const [siteName, setSiteName] = useState(null);
  const [siteUrl, setSiteUrl] = useState(null);
  const [siteEditUrl, setEditSiteUrl] = useState("");
  const [domains, setDomains] = useState([]);
  const [domain, setDomain] = useState(null);
  const [show, setShow] = useState(false);
  const [showWebsiteOverview, setShowWebsiteOverview] = useState(false);
  const [isRetry, setIsRetry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tagResult, setTagResult] = useState({});
  const [crawlingResult, setCrawlingResult] = useState("");
  const [crawlingInternalLinks, setCrawlingInternalLinks] = useState("");

  const navigate = useNavigate()
  const location = useLocation()


  useEffect(() => {
    if (getWebsite() == null) {
      navigate('/seooptimization/new')
    }
    if (getWebsite() != null && siteUrl == null) {
      setSiteUrl(getWebsite().url);
      setWebsite(getWebsite())
    }

    if (getProject()?.websites != null && websites == null) {
      setWebsites(getProject()?.websites);
    }
    // else{
    //     setWebsites([]);
    // }

    if (location.state && location.state.show) {
      setShow(true)
    }

    const fetchUser = () => {
      if (user == null) {
        const currentUser = getUser();
        const currentProject = getProject();
        if (currentUser == null) {
          navigate("/");
        }
        setUser(currentUser);
        setProject(currentProject);
      }
    }
    fetchUser();

  }, [websites, user, project]);
  const onEditSiteNameChanged = (event) => {
    setSiteName(event);
  };

  const onEditSiteUrlChanged = (event) => {
    setSiteUrl(event);
    setEditSiteUrl(event);
  };

  const handleSelectDomain = async (e) => {
    setDomain(e)
  }

  const handleCrawling = async (event) => {
    setLoading(true);
    setIsRetry(false);
    const res = await fetch(CONFIG.hostname + ":8082/crawl/", {
      body: JSON.stringify({ link: siteUrl }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const data = await res.json();
    const text = [];
    if (data.current.error != "invalid url") {
      setLoading(false);
      const settings = [{ name: "domain", value: domain }];
      const updatedWebsite = { name: siteName, url: siteUrl, tokenId: null, ranking: null, settings: settings, templates: null, webPages: null }
      setWebsite(updatedWebsite);

      if (!isWebsiteExist(websites, siteUrl)) {
        if (websites == null) {
          setWebsites([]);
        }
        const updatedWebsites = websites;
        updatedWebsites.push(updatedWebsite);

        setWebsites(updatedWebsites);
        const currentProject = project;
        currentProject.websites = updatedWebsites;
        setProject(currentProject)
        const resProject = await updateProject(currentProject);
        const resultProject = await resProject.json();
        localStorage.setItem('project', JSON.stringify(resultProject));
        localStorage.setItem('currentWebsite', JSON.stringify(updatedWebsite));
      }

      // text.push(data.current.description);

      //Detect tagging for the current page
      // const res1 = await fetchTags(text);
      // const tagResponse = await res1.json();
      // setTagResult(tagResponse[0]);
      setCrawlingResult(data.current);
      setCrawlingInternalLinks(data.internalResources);

      localStorage.setItem('crawlingData', JSON.stringify(data));
      setShow(true);
      setShowWebsiteOverview(!showWebsiteOverview);
      //Get all domains
      const fetchDomainsResult = await fetchAllDomains();
      const allDomains = await fetchDomainsResult.json();

      // const detectedDomain = getDomainFromTag(tagResponse[0].classifications[0]);
      const fetchTagByDetectedDomain = await fetchSearchifyTags(domain);
      const allTags = await fetchTagByDetectedDomain.json();
      // const detectedTags = detectTagsData(simplifyTags(tagResponse[0].classifications), allTags);

      // props.setGetFromHome({ suggestionName: data.current.title, suggestionTitle: data.current.title, suggestionDescription: data.current.description, tags: allTags, detectedTags: detectTagsData(simplifyTags(tagResponse[0].classifications), allTags), domains: allDomains, domain: detectedDomain });
    }

    else {
      setIsRetry(true);
    }
  };


  return (
    <>
      <div className={styles.app_SEO_Optimization}>
        <img className={styles.app_shape_img} src={shapeImg3} alt={shapeImg3} />
        <div className={styles.SEO_Optimization_wrapper}>
          <div className={styles.breadcrumb__box}>
            <BreadCrumb withLinkText={true} />
          </div>

          <div className={styles.project_action_box}>
            <div className={styles.editing__titlebox}>
              <EditTitle onChange={onEditSiteNameChanged} editingTitle={true} isNew={false} />
            </div>
            <div className={styles.__drop_action_btn}>
              <div className={styles.select__items__box}>

                {website && <DomainFieldSelect  onDomainChange={handleSelectDomain} 
                                    currentDomain={website.settings.domain}
                                    inputTitle='Select Industry' />
                }
              </div>
            </div>
          </div>
          <div className={styles.search__inputbox}>
            <SearchWithbtn
              buttonLabel={"Check"}
              onChange={onEditSiteUrlChanged}
              onClick={handleCrawling}
              readOnly={true}
            />
          </div>
          <div className={styles.app__search_results_wrap}>
            <PageOverview />
            <SiteInsightResult />
            {show && (<SearchInsightResult />
            )}
          </div>
        </div>
        {
          loading &&
          <div className={styles.loader}>
            <Loader />
          </div>
        }
      </div>
    </>
  )
}
export default SeoOptimization

