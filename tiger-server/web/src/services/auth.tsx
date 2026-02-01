import React, { createContext, useContext, useState, useEffect } from 'react'

type AuthContext = {
  token: string | null;
  setToken: (t: string | null) => void;
}
const Ctx = createContext<AuthContext>({ token: null, setToken: ()=>{} });
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('tiger_token'));
  useEffect(()=>{ if (token) localStorage.setItem('tiger_token', token); else localStorage.removeItem('tiger_token'); }, [token]);
  return <Ctx.Provider value={{ token, setToken: setTokenState }}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx);

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}){
  init.headers = init.headers || {};
  const token = localStorage.getItem('tiger_token');
  if (token) (init.headers as any)['Authorization'] = 'Bearer ' + token;
  return fetch(input, init);
}
