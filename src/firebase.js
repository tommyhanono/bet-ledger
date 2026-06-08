import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyA8bo_nr2Zpj7IhsTKG7i8L2fIa-HklG_Q",
  authDomain: "bet-ledger-1e13c.firebaseapp.com",
  projectId: "bet-ledger-1e13c",
  storageBucket: "bet-ledger-1e13c.firebasestorage.app",
  messagingSenderId: "1021526936759",
  appId: "1:1021526936759:web:07f4b96c17af4f15741132",
  measurementId: "G-0WWGTTW12B"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
