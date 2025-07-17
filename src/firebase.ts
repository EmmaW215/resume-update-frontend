import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDXmgeu2EfnjCQkXwnU0xxIT17mXhwTm4M",
    authDomain: "matchwise-881a4.firebaseapp.com",
    projectId: "matchwise-881a4",
    storageBucket: "matchwise-881a4.firebasestorage.app",
    messagingSenderId: "308793199773",
    appId: "1:308793199773:web:d88050351e2de88047d874",
    measurementId: "G-MHQ19NX8W0"
};

// 防止多次初始化
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app; 