// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage"
// https://firebase.google.com/docs/web/setup#available-libraries

import axios from "axios"

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER,
    appId: import.meta.env.VITE_APP_ID,
    measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

// Initialize Firebase
// TODO: Change signInWithPopup to signInWithRedirect, see if it would work or not
const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider()

const analytics = getAnalytics(app)
const auth = getAuth()

export const authWithGoogle = async () => {
    let user = null

    try {
        const authResult = await signInWithPopup(auth, provider)
        if (authResult) {
            user = authResult.user
        }

        return user
    }
    catch (err) {
        console.error(err)
    }
}

// PARTIAL_DONE: Implement auth checking before user upload images.
// DONE: Compress image before uploading
// TODO: Add chinese translation for words
// TODO: Set up firebase storage securely so Tea incident wont happen on my project again.
export const uploadImage = async (image, access_token) => {
    try {
        const { data } = await axios.post(
            `${import.meta.env.VITE_SERVER_DOMAIN}/upload-image`,
            { image },
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        return data.url;
    } catch (err) {
        const error = err?.response?.data?.error || err.message;
        console.error(error);
        return null;
    }
}
