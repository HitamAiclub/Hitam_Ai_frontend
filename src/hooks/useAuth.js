import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      setUser(user);
      if (user) {
        try {
          const idTokenResult = await getIdTokenResult(user);
          const adminClaim = idTokenResult?.claims?.admin;
          setIsAdmin(!!adminClaim);
        } catch (err) {
          console.error('Error fetching token claims', err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { user, isAdmin, loading };
};