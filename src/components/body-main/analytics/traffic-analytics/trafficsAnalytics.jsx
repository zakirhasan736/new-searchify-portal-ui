"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../analytics.module.css";
import { loadFeatures } from "@/lib/clientApi";

const TrafficHome = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    loadFeatures("traffic-analytics").then((records) => {
      setRows(records.flatMap((record) => record.payload?.rows || []));
    });
  }, []);

  return (
    <section className={styles.SEORanking__wrap_section}>
      <div className={styles.analytics_overview_titlebox}>
        <h2 className={styles.analytics_title}>Traffic Analytics</h2>
        <p style={{ color: "#cfcfcf", maxWidth: 680, marginTop: 8 }}>
          Stored sessions, users, and engagement. Open the overview to build a competitor list.
        </p>
        <p style={{ marginTop: 16 }}>
          <Link href="/trafficsAnalytics/overview">Open overview</Link>
        </p>
      </div>
      <div style={{ padding: "0 24px 32px", color: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")}>
                <td style={{ padding: "10px 8px", borderBottom: "1px solid #2a2a2a" }}>{row[0]}</td>
                <td style={{ padding: "10px 8px", borderBottom: "1px solid #2a2a2a" }}>{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TrafficHome;
