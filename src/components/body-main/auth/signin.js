import React, { useState } from "react";
import styles from './auth.module.css';
import validator from "validator";
import shapeImg3 from '../../../assets/img/gradient-shape3.png'
import shapeImg4 from '../../../assets/img/gradient-shape4.png'
import brandLogo from '../../../assets/img/Searchify-logo.png'
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
import { CiLock } from "react-icons/ci";
import { BiUser } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import CONFIG from "../../../config/users/Constant";
import { parseJwt, userLogin } from "../../../utils/users/Helpers";
import { fetchProjectByUserId } from "../../../utils/users/ProjectUtil";
import Loader from "../../share/loader/Loader";

const Signin = () => {
    let navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [pwd, setPwd] = useState("");
    const [pending,setPending] = useState(false);

    const [showPassword, setShowPassword] = useState({
        password: false,
    });

    const handleShowPassword = () => {
        setShowPassword({ showPassword, password: !showPassword.password });
    };

    const handleLogin = async (username, password) => {
        return await fetch(CONFIG.hostname + ':8081/users/signin?username=' + username + '&password=' + password, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST'
        });
    };
    const handleSubmit = async (e) => {
        if (validator.isEmpty(username)) {
            toast.error("Please Enter Username!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventusers();
        }
        else if (validator.isEmpty(pwd)) {
            toast.error("Please Enter Password!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventusers();
        } else {
            setPending(true);
            const res = await handleLogin(username, pwd);
            const result = await res.json();
            const data = parseJwt(result.token);
            const user = { data, result };
            if(result.token){
                setPending(false); 
            }
            const resProject = await fetchProjectByUserId(user.data.sub);
            const resultProject = await resProject.json();
            localStorage.setItem('project', JSON.stringify(resultProject));
            userLogin(user);
           
            if (result.userType === "client") {
                
                navigate("/works");

            }
            else if (result.userType === "admin") {
              
                navigate("/admin/tagmgmt");
            }
        }
    };
    return (
        <div className={styles.app_auth_wrapper}>
            <img className={styles.app_shape_img} src={shapeImg3} alt={shapeImg3} />
            <img className={styles.app_shape_img4} src={shapeImg4} alt={shapeImg4} />
            <div className={styles.app_auth_contbox}>
                <div className={styles.app_auth__form_contbox}>
                    <div className={styles.app_auth__bandlogo}>
                        <img src={brandLogo} alt={brandLogo} width={'90px'} />
                    </div>
                    <div className={styles.app_auth_formbox}>
                        <h2 className={styles.app_auth_form_title}>Sign In</h2>
                        <form className={styles.app_auth_form} action="" method="post">
                            <div className={styles.app_auth_form_group}>
                                <div className={styles.app_gradient_box}>
                                    <div className={styles.app_auth_iconbox}>
                                        <span className={styles.app_auth_form_icon}><BiUser /></span>
                                    </div>
                                    <input className={styles.app_auth_inputfild} type="text" name="username"
                                        placeholder="Enter Username"
                                        value={username}
                                        onChange={(e) => {
                                            setUsername(e.target.value);
                                        }} />
                                </div>
                            </div>
                            <div className={styles.app_auth_form_group}>
                                <div className={styles.app_gradient_box}>
                                    <div className={styles.app_auth_iconbox}>
                                    <span className={styles.app_auth_form_icon}><CiLock /></span>
                                        <span onClick={() => handleShowPassword()} className={styles.app_auth_form_icon}>{showPassword.password ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}</span>
                                    </div>
                                    <input className={styles.app_auth_inputfild} type={showPassword.password ? "text" : "password"} name="password"
                                        placeholder="Enter Password" value={pwd}
                                        onChange={(e) => {
                                            setPwd(e.target.value);
                                        }} />
                                </div>
                                <a className={styles.app_auth_link} href='/forgotpassword'>Forgot Password?</a>
                            </div>
                            <div className={styles.app_auth_btn_contbox}>
                                <div className={styles.app_auth_linkbox}><span className={styles.link_boxtitle}>New Registration?</span> <a className={styles.app_auth_linkto} href='/signup'>Signup</a></div>
                                <div className={styles.app_auth_btnbox}>
                                    <input type="button" className={styles.app_auth_btn} name="button" value="Sign In"
                                        onClick={handleSubmit} />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                {/* loader */}
            {
                pending &&
                <div className={styles.loader}>
                    <Loader />
                </div>
            }
            </div>
            <ToastContainer />
      
        </div>
    )
}

export default Signin