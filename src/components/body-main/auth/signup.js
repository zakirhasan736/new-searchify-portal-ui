import React, { useState } from "react";
import styles from './auth.module.css';
import shapeImg3 from '../../../assets/img/gradient-shape3.png'
import shapeImg4 from '../../../assets/img/gradient-shape4.png'
import brandLogo from '../../../assets/img/Searchify-logo.png'
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
import { HiOutlineMail } from "react-icons/hi";
import { CiLock } from "react-icons/ci";
import { BiUser } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import validator from "validator";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import CONFIG from "../../../config/users/Constant";
import Loader from "../../share/loader/Loader";



const SignUp = () => {
    const [pending, setPending] = useState(false);
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [pwd, setPwd] = useState("");
    const [cpwd, setCpwd] = useState("");
    const [showPassword, setShowPassword] = useState({
        password: false,
        cpassword: false,
    });

    const navigate = useNavigate()

    const handleShowPassword = (name) => {
        if (name === "password") {
            setShowPassword({ showPassword, password: !showPassword.password });
        } else {
            setShowPassword({ showPassword, cpassword: !showPassword.cpassword });
        }
    };

    const handleSubmit = async (e) => {
        if (validator.isEmpty(email)) {
            toast.error("Please Enter Email!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (!validator.isEmail(email)) {
            toast.error("Please Enter Valid Email!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (validator.isEmpty(username)) {
            toast.error("Please Enter Username!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (validator.isEmpty(pwd)) {
            toast.error("Please Enter Password!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (!validator.isLength(pwd, { min: 8 })) {
            toast.error("Password must be more than 8 character!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (!validator.matches(pwd, /[a-z]/)) {
            toast.error("Password must contain a lowercase alphabet!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (!validator.matches(pwd, /[A-Z]/)) {
            toast.error("Password must contain a uppercase alphabet!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (!validator.matches(pwd, /[0-9]/)) {
            toast.error("Password must contain a number!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (
            !validator.matches(pwd, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/)
        ) {
            toast.error("Password must contain a special character!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (validator.isEmpty(cpwd)) {
            toast.error("Please Enter Confirm Password!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else if (pwd !== cpwd) {
            toast.error("Password and Confirm Password must be same!", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();
        } else {
            setPending(true);
            const user = await fetch(CONFIG.hostname + ':8081/users/signup', {
                body: JSON.stringify({ username: username, password: pwd, email: email, roles: ['ROLE_CLIENT'] }),
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            });
            if (user.status === 200) {
                setPending(false);
                navigate('/signin')
            }
            toast.success("Registration Successful, Please Login", {
                autoClose: 1500,
                style: { backgroundColor: "black", color: "white" },
            });
            e.preventDefault();

        }
    }

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
                        <h2 className={styles.app_auth_form_title}>Sign Up</h2>
                        <form className={styles.app_auth_form} action="" method="post">
                            <div className={styles.app_auth_form_group}>
                                <div className={styles.app_gradient_box}>
                                    <div className={styles.app_auth_iconbox}>
                                        <span className={styles.app_auth_form_icon}><HiOutlineMail /></span>
                                    </div>
                                    <input className={styles.app_auth_inputfild}
                                        autoComplete="off"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                        }}
                                        type="email" name="email" placeholder="Enter Email" />
                                </div>
                            </div>
                            <div className={styles.app_auth_form_group}>
                                <div className={styles.app_gradient_box}>
                                    <div className={styles.app_auth_iconbox}>
                                        <span className={styles.app_auth_form_icon}><BiUser /></span>
                                    </div>
                                    <input className={styles.app_auth_inputfild}
                                        autoComplete="off"
                                        value={username}
                                        onChange={(e) => {
                                            setUsername(e.target.value);
                                        }}
                                        type="text" name="text" placeholder="Enter Username" />
                                </div>
                            </div>
                            <div className={styles.app_auth_form_group}>
                                <div className={styles.app_gradient_box}>
                                    <div className={styles.app_auth_iconbox}>
                                        <span className={styles.app_auth_form_icon}><CiLock /></span>
                                        <span className={styles.app_auth_form_icon}
                                            onClick={() => {
                                                handleShowPassword("password");
                                            }}>{showPassword.password ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}</span>
                                    </div>
                                    <input className={styles.app_auth_inputfild}
                                        type={showPassword.password ? "text" : "password"}
                                        autoComplete="off"
                                        value={pwd}
                                        onChange={(e) => {
                                            setPwd(e.target.value);
                                        }}
                                        name="password" placeholder="Enter Password" />
                                </div>
                            </div>
                            <div className={styles.app_auth_form_group}>
                                <div className={styles.app_gradient_box}>
                                    <div className={styles.app_auth_iconbox}>
                                        <span className={styles.app_auth_form_icon}><CiLock /></span>
                                        <span className={styles.app_auth_form_icon}
                                            onClick={() => {
                                                handleShowPassword("cpassword");
                                            }}>{showPassword.cpassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}</span>
                                    </div>
                                    <input className={styles.app_auth_inputfild}
                                        type={showPassword.cpassword ? "text" : "password"}
                                        autoComplete="off"
                                        value={cpwd}
                                        onChange={(e) => {
                                            setCpwd(e.target.value);
                                        }}
                                        name="cpassword" placeholder="Enter Confirm Password" />
                                </div>
                            </div>
                            <div className={styles.app_auth_btn_contbox}>
                                <div className={styles.app_auth_linkbox}><span className={styles.link_boxtitle}>Already an account? </span> <a className={styles.app_auth_linkto} href='/login'>Signin</a></div>
                                <div className={styles.app_auth_btnbox}>
                                    <input type="button" className={styles.app_auth_btn} name="button" value="Sign Up"
                                        onClick={handleSubmit}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <ToastContainer />
            {/* loader */}
            {
                pending &&
                <div className={styles.loader}>
                    <Loader />
                </div>
            }
        </div>
    )
}

export default SignUp