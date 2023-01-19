import React, { useRef, useState } from 'react';
import styles from './analytics.module.css';
import shapeImg6 from '../../../assets/img/gradient-shape6.png';
import shapeImg7 from '../../../assets/img/gradient-shape-7.png';
import UserImg from '../../../assets/img/Profile-pic.png';
import GoogleIcon from '../../../assets/img/google.png';
import Mastercard from '../../../assets/img/Mastercard_2019_logo 1.png';

const UserProfile = () => {
    const [imgUrl, setImgUrl] = useState(UserImg);
    const imgRef = useRef(null);
    const [editField, setField] = useState(null);

    const handleImgChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            let reader = new FileReader()
            reader.readAsDataURL(e.target.files[0])
            reader.onload = () => {
                setImgUrl(reader.result)
            }
        }
    };
    const handleRemoveImg = () => {
        setImgUrl(UserImg);
        imgRef.current.defaultValue = ""
    }

    const handleEdit = (arg) => {
        setField(arg)
    }
    return (
        <>
            <section className={styles.SEORanking__wrap_section}>
                <img className={styles.app_shape_img6} src={shapeImg6} alt={shapeImg6} />
                <img className={styles.app_shape_img7} src={shapeImg7} alt={shapeImg7} />
                <div className={styles.analytics_overview_titlebox}>
                    <h2 className={styles.analytics_title}>User profile settings</h2>
                </div>

                <div className={styles.user__profile_box}>
                    {/* user photo box */}
                    <div className={styles.user__photo_box}>
                        <h5 className={styles.user__title}>Profile photo</h5>

                        <div className={styles.user__Photo_action}>

                            <div className={styles.user__photo}>
                                <img src={imgUrl} alt={UserImg} />
                            </div>
                            <div className={styles.photo__action}>
                                <button onClick={() => handleRemoveImg()} className={styles.removed__photo_btn}>Remove Photo</button>
                                <div className={styles.add__photo_btn}>
                                    <button className={styles.file_button}>Change</button>
                                    <input ref={imgRef} type="file" name="avatar" accept="image/png, image/jpeg" onChange={handleImgChange} />
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className={styles.user__info_box}>
                        {/* personal info  */}
                        <div className={styles.user__personal_cont}>
                            <div className={styles.user__personal_info}>
                                <div className={styles.user__info_wrap}>
                                    <div className={styles.user__titlebox}>
                                        <h5 className={styles.user__title}>Name</h5>
                                        {editField === "name" ?
                                            <input className={styles.editField} defaultValue="Aida Kirakosyan" />
                                            : <p className={styles.user__title_text}>Aida Kirakosyan</p>
                                        }
                                    </div>
                                    <div className={styles.user__btn_action}>
                                        <button onClick={() => handleEdit("name")} className={styles.edit__btn}>Edit</button>
                                    </div>
                                </div>
                                <div className={styles.user__info_wrap}>
                                    <div className={styles.user__titlebox}>
                                        <h5 className={styles.user__title}>Company Name</h5>
                                        {editField === "cName" ?
                                            <input className={styles.editField} defaultValue="Aida Kirakosyan" />
                                            : <p className={styles.user__title_text}>Aida Kirakosyan</p>
                                        }
                                    </div>
                                    <div className={styles.user__btn_action}>
                                        <button onClick={() => handleEdit("cName")} className={styles.edit__btn}>Edit</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* user integration  */}
                        <div className={styles.user__integrate__wrap}>
                            <div className={styles.user__email_cont}>
                                <div className={styles.user__email_info}>
                                    <div className={styles.user_email_info_wrap}>
                                        <div className={styles.user__titlebox}>
                                            <h5 className={styles.user__title}>Email address</h5>
                                            {editField === "email" ?
                                                <input className={styles.editField} defaultValue="Aida Kirakosyan" />
                                                : <p className={styles.user__title_text}>Aida Kirakosyan</p>
                                            }
                                        </div>
                                        <div className={styles.user__btn_action}>
                                            <button onClick={() => handleEdit("email")} className={styles.edit__btn}>Edit</button>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.user__integaretion_platform}>
                                    <h5 className={styles.user__title}>Integrated Platforms</h5>

                                    <div className={styles.user__int_platform_box}>

                                        <div className={styles.user__int_card}>
                                            <div className={styles.int_platform_iconbox}>
                                                <img src={GoogleIcon} alt={GoogleIcon} className={styles.plateform_icon} />
                                                <h4 className={styles.plateform__name}>Google</h4>
                                            </div>
                                            <h6 className={styles.user__name}>Aida Kirakosyan</h6>
                                            <a href="#!" className={styles.int_action__btn} >Disconnect</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* payment and subscribtion */}
                        <div className={styles.user__pay_and_subs_wrap}>
                            <div className={styles.user__pay_and_subs_cont}>

                                <div className={styles.user__payment_int}>
                                    <div className={styles.user__titlebox}>
                                        <h5 className={styles.user__title}>Payment Method</h5>
                                        <span className={styles.payment__mothode_type}><img src={Mastercard} alt={Mastercard} />  **** **** **** 1111</span>
                                        <p className={styles.user__desc_text}>Your next billing date is December 1, 2022</p>
                                    </div>
                                    <div className={styles.user__btn_action}>
                                        <a href='#!' className={styles.action_type__btn}>Manage payment info</a>
                                    </div>
                                </div>

                                <div className={styles.user__subs_int}>

                                    <div className={styles.user__titlebox}>
                                        <h5 className={styles.user__title}>Payment Method</h5>
                                    </div>

                                    <div className={styles.user__subs_contbox}>
                                        <p className={styles.user__title_text}>Premium</p>

                                        <div className={styles.user__btn_action}>
                                            <a href='#!' className={styles.action_type__btn}>Change plan</a>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                        {/* login and security  */}
                        <div className={styles.logins__and_security_wrap}>
                            <div className={styles.logins__and_security_contbox}>

                                <div className={styles.logins___contbox}>
                                    <div className={styles.user__titlebox}>
                                        <h5 className={styles.user__title}>Login & Security</h5>
                                    </div>
                                    <div className={styles.user__security_contbox}>
                                        <p className={styles.user__title_text}>Password </p>

                                        <div className={styles.user__btn_action}>
                                            <a href='#!' className={styles.action_type__btn}>Change password</a>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.security___contbox}>
                                    <div className={styles.user__titlebox}>
                                        <h5 className={styles.user__title}>Security</h5>
                                    </div>
                                    <div className={styles.user__security_contbox}>
                                        <div className={styles.user__title__box}>
                                            <p className={styles.user__title_text}>Sign out from all your devices</p>

                                        </div>

                                        <div className={styles.user__btn_action}>
                                            <a href='#!' className={styles.action_type__btn}>Sign out from all devices</a>
                                        </div>
                                    </div>
                                    <p className={styles.user__desc_text}>Logged in on a shared device but forgot to sign out? End all sessions
                                        by signing out from all devices.
                                    </p>
                                </div>

                                <div className={styles.security_insert__contbox}>
                                    <div className={styles.user__security_contbox}>
                                        <p className={styles.user__title_text}>Delete your account</p>

                                        <div className={styles.user__btn_action}>
                                            <a href='#!' className={styles.action__delete_btn}>Delete Account</a>
                                        </div>
                                    </div>
                                    <p className={styles.user__desc_text}>By deleting your account, you'll no longer be able to access any of
                                        your projects in Searchify.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </>
    )
}

export default UserProfile