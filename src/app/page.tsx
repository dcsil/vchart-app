"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Image from "next/image";

export default function Home() {
  const [message, setMessage] = useState<string>("Loading...");

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Error fetching data"));
  }, []);

  return (
    <div className={styles.container}>
      {/* Logo Section */}
      <div className={styles.logoContainer}>
        <Image
          src="/logo.png"
          alt="VChart Logo"
          width={100}
          height={100}
          className={styles.logo}
          priority
        />
      </div>

      {/* Content Section */}
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome to VChart</h1>
        <p className={styles.message}>{message}</p>
        <button
          className="border border-black mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => console.log('button pressed')}
        >
          Press Me
        </button>
      </div>
    </div>
  );
}
