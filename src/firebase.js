// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 아까 복사한 firebaseConfig 내용을 여기에 붙여넣으세요.
const firebaseConfig = {
  apiKey: "AIzaSyAandnIKpK584VwMMKD0XshLym8HvFwGCU",
  authDomain: "reading-tracker-65581.firebaseapp.com",
  projectId: "reading-tracker-65581",
  storageBucket: "reading-tracker-65581.firebasestorage.app",
  messagingSenderId: "471677592972",
  appId: "1:471677592972:web:82772af652855ec96de2a9"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// DB 내보내기 (다른 파일에서 쓸 수 있게)
export const db = getFirestore(app);
