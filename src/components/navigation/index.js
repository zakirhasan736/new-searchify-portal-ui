import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Link } from 'react-router-dom';
import Brandlogo from '../../assets/img/brand-logo.svg'
import BrandlogoMobo from '../../assets/img/Searchify-logo.png'
import styles from './style.module.css';
import { AarrowIcon, BookIcon, FolderIcon, GraphIcon, SettingIcon } from './Icons';
const Nav = () => {
    const [navTitle, SetNavTitle] = useState("");

    const handleActive = (arg) => {
        if (navTitle === arg) {
            SetNavTitle("")
        }
        else {
            SetNavTitle(arg)
        }
    }

    return (
        <>
            <div className={styles.sidebar_section}>
                <div className={styles.sidebar_logo}><Link to="/">
                    <img src={Brandlogo} className={styles.brand_logo_desk} alt={Brandlogo} />
                    <img src={BrandlogoMobo} width='50px' className={styles.brand_logo_mobo} alt={BrandlogoMobo} />
                </Link></div>
                <nav className={styles.navbar_nav}>
                    <ul className={styles.navbar_navlist}>
                        <li>
                            <NavLink to="/dashboard">
                                <BookIcon />
                                <span className={styles.link__name}>Dashboard</span>
                                <span className={`${navTitle === "dashboard" && styles.active_Span}`} onClick={() => handleActive("dashboard")}>
                                <AarrowIcon />
                                </span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/SeoOptimization">
                                <SettingIcon />
                                <span className={styles.link__name}>Site optimization</span>
                                <span className={`${navTitle === "site" && styles.active_Span}`} onClick={() => handleActive("site")}>
                                    <AarrowIcon />
                                </span>
                            </NavLink>
                        </li>
                        <li>
                            <div className={styles.dropdown}>
                                <div className={styles.drop_Down_button}>
                                    <GraphIcon />
                                    <span className={styles.link__name}>Analytics</span>
                                    <span className={`${navTitle === "seo_ranking" && styles.active_Span}`} onClick={() => handleActive("seo_ranking")}>
                                        <AarrowIcon />
                                    </span>
                                </div>
                                {navTitle === "seo_ranking" &&
                                    <ul className={styles.dropDown_content}>
                                        <li>
                                            <Link to="/SEOranking"><GraphIcon /> Keywords</Link>
                                        </li>
                                        <li>
                                            <Link to="/keywordanalyze/home"><GraphIcon /> Keyword Analyze</Link>
                                        </li>
                                        <li>
                                            <Link to="/websitekeyword/home"><GraphIcon />Website Keywords</Link>
                                        </li>
                                        <li>
                                            <Link to="/keywordgeneretor/home"><GraphIcon />Generate Keywords</Link>
                                        </li>
                                    </ul>
                                }
                            </div>
                        </li>
                        <li>
                            <NavLink to="/works">
                                <FolderIcon />
                                <span className={styles.link__name}>My works</span>
                                <span className={`${navTitle === "work" && styles.active_Span}`} onClick={() => handleActive("work")}>
                                    <AarrowIcon />
                                </span>
                            </NavLink>
                        </li>
                    </ul>
                </nav>
            </div>
        </>

    )
}

export default Nav