import React, { useEffect,useState } from 'react';
import styles from './user.module.css';
import profileImg from '../../../assets/img/Profile-pic.png';
import arrowDownImg from '../../../assets/img/Profile-dropdown.png';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, userLogout } from "../../../utils/users/Helpers";

const User = () => {
  const [open, setOpen] = useState(null);
  const [user, setUser] = useState(null)

  const navigate = useNavigate()

  const logOut = () => {
    userLogout();
    navigate("/signin");
  }
  useEffect(() => {
    const fetchUser = () => {
      if (user == null) {
          const currentUser = getUser();   

          setUser(currentUser);
      }
    }
    fetchUser();
    setOpen(null)
  }, [])
  return (
    <>
      <div className={styles.user_wrap_box}>
        <div onClick={() => setOpen(!open)} className={styles.user_image_box}>
          <div className={styles.userImg}>
            <img src={profileImg} alt={profileImg} />
          </div>
          <img src={arrowDownImg} alt={arrowDownImg} />
        </div>
        {open && <div className={styles.user_dropdown_box}>
          <div className={styles.user__info__head}>
            <img src={profileImg} alt={profileImg} />
            {user &&<div className={styles.user__info_context}>
              
              <h2 className={styles.user_name}>{user.data.sub}</h2>
              {/* <p className={styles.user_email}>{user.email}</p> */}
            </div>}
          </div>
          <ul className={styles.user_info_link}>
            <li><Link to="/UserProfile" >Account settings</Link></li>
            <li><a href="/" >Get Help</a></li>
          </ul>
          <a href='/' onClick={() => logOut()} className={styles.auth_action__btn} >Sign Out</a>
        </div>}
      </div>
    </>
  )
}

export default User