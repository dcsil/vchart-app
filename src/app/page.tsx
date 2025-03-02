"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Image from "next/image";
import { log } from "./utils/log";

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
          onClick={() => {
            log('Button was pressed on the Home page');
          }}
        >
          Press Me
        </button>
      </div>

      {/* Log Level Buttons */}
      <div className={styles.buttonGroup}>
        <button
          className="border border-black mt-4 mx-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => log('Debug button pressed', 'debug')}
        >
          Debug
        </button>
        <button
          className="border border-black mt-4 mx-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => log('Info button pressed', 'info')}
        >
          Info
        </button>
        <button
          className="border border-black mt-4 mx-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          onClick={() => log('Warn button pressed', 'warn')}
        >
          Warn
        </button>
        <button
          className="border border-black mt-4 mx-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={() => log('Error button pressed', 'error')}
        >
          Error
        </button>
      </div>
    </div>
  );
}
