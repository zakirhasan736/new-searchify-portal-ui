import React, { useState } from 'react'
import { ToastContainer, toast } from "react-toastify";
import validator from "validator";
import styles from './auth.module.css';
import shapeImg3 from '../../../assets/img/gradient-shape3.png'
import shapeImg4 from '../../../assets/img/gradient-shape4.png'
import brandLogo from '../../../assets/img/Searchify-logo.png'
import { AiOutlineEyeInvisible } from "react-icons/ai";
import { CiLock } from "react-icons/ci";


const ForgotPassword = () => {

    const [newPass, setPassword] = useState("");
    const [confrimNewPass, setconfrimNewPass] = useState("");
    const [showPassword, setShowPassword] = useState({
        password: false,
    });

    const handleShowPassword = () => {
        setShowPassword({ showPassword, password: !showPassword.password });
    };

    const handleUpdatePass = async (oldPass, newPass) => {
        //call api to update password
    };
    const handleSubmit = async (e) => {
        if (validator.isEmpty(newPass)) {
            toast.error("Please Enter New Password!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        }
        else if (validator.isEmpty(confrimNewPass)) {
            toast.error("Please Enter New Password!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        }
        else if (!validator.isLength(newPass, { min: 8 })) {
            toast.error("Password must be more than 8 character!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (!validator.matches(newPass, /[a-z]/)) {
            toast.error("Password must contain a lowercase alphabet!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (!validator.matches(newPass, /[A-Z]/)) {
            toast.error("Password must contain a uppercase alphabet!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (!validator.matches(newPass, /[0-9]/)) {
            toast.error("Password must contain a number!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (
            !validator.matches(newPass, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/)
        ) {
            toast.error("Password must contain a special character!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        }
        else if (newPass !== confrimNewPass) {
            toast.error("Password and Confirm Password must be same!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        }
        else {
            //call api call function and passed the update password 
            //handleUpdatePass(newPass,confrimNewPass)
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
                        <h2 className={styles.app_auth_form_title}>Update Your Password</h2>
                        <form className={styles.app_auth_form}>
                            <div className={styles.app_auth_form_group}>
                                <div className={styles.app_gradient_box}>
                                    <div className={styles.app_auth_iconbox}>
                                        <span className={styles.app_auth_form_icon}><CiLock /></span>
                                        <span className={styles.app_auth_form_icon}><AiOutlineEyeInvisible /></span>
                                    </div>
                                    <input className={styles.app_auth_inputfild} type="password" name="password" placeholder="Enter New Password" onChange={(e)=>setPassword(e.target.value)}/>
                                </div>
                            </div>
                            <div className={styles.app_auth_form_group}>
                                <div className={styles.app_gradient_box}>
                                    <div className={styles.app_auth_iconbox}>
                                        <span className={styles.app_auth_form_icon}><CiLock /></span>
                                        <span className={styles.app_auth_form_icon}><AiOutlineEyeInvisible /></span>
                                    </div>
                                    <input className={styles.app_auth_inputfild} type="password" name="password" placeholder="Enter New Confirm Password" onChange={(e)=>setconfrimNewPass(e.target.value)}/>
                                </div>
                            </div>
                            <div className={styles.app_auth_btn_contbox}>
                                <div className={styles.app_auth_btnbox}>
                                    <input type="button" className={styles.app_auth_btn} name="button" value="Update" onClick={handleSubmit} />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    )
}

export default ForgotPassword