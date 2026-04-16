//hooks/useAuth.ts

"use client";

import { useEffect, useState } from "react";
import { AuthService } from "@/services/auth.service";

export function useAuth() {

  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{

    AuthService.me()
      .then(setUser)
      .catch(()=>{})
      .finally(()=>setLoading(false));

  },[]);

  return { user, loading };
}