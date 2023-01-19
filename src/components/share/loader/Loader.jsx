import React from 'react';
import styles from './styles.module.css';
import Lottie from "lottie-react";
import animationdata from '../../../assets/img/v-3.json';

const Loader = () => {
    return ( 
        <div className={styles.loader}>
            <Lottie animationData={animationdata} loop={true} />
        </div>
    )
}

export default Loader