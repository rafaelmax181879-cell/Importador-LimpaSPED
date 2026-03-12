import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext({});

const SUPER_ADMIN_EMAIL = 'rafael.max181873@gmail.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { nome_completo, cargo, trocar_senha, ... }
  const [office, setOffice] = useState(null); // { razao_social_completa, logo_url, cnpj, ... }
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isSuperAdmin = (user?.email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  const login = (userData, officeData) => {
    setUser(userData);
    setOffice(officeData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setOffice(null);
    setIsAuthenticated(false);
  };

  const updatePasswordStatus = () => {
    if (user) {
      setUser({ ...user, trocar_senha: false });
    }
  };

  return (
    <AuthContext.Provider value={{ user, office, isAuthenticated, isSuperAdmin, login, logout, updatePasswordStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
