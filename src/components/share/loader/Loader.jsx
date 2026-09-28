"use client";
import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import animationdata from "../../../assets/img/v-3.json";

const Loader = () => {
  const [Lottie, setLottie] = useState(null);

  useEffect(() => {
    let alive = true;
    import("lottie-react").then((mod) => {
      if (alive) setLottie(() => mod.default);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className={styles.loader}>
      {Lottie ? <Lottie animationData={animationdata} loop={true} /> : null}
    </div>
  );
};

export default Loader;
