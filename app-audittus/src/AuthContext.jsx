import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { nome_completo, cargo, trocar_senha, ... }
  const [office, setOffice] = useState(null); // { razao_social_completa, logo_url, cnpj, ... }
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    <AuthContext.Provider value={{ user, office, isAuthenticated, login, logout, updatePasswordStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
