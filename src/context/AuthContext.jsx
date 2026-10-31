// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { dbService } from '../services/db';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dbUsers = dbService.getUsers();
    setUsers(dbUsers);
    
    // Set first user as default logged-in user
    const savedUser = localStorage.getItem('isalu_current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else if (dbUsers && dbUsers.length > 0) {
      setCurrentUser(dbUsers[0]);
      localStorage.setItem('isalu_current_user', JSON.stringify(dbUsers[0]));
    }
    setLoading(false);
  }, []);

  const switchUser = (userId) => {
    const selectedUser = users.find(u => u.id === Number(userId));
    if (selectedUser) {
      setCurrentUser(selectedUser);
      localStorage.setItem('isalu_current_user', JSON.stringify(selectedUser));
    }
  };

  const value = {
    users,
    currentUser,
    loading,
    switchUser,
    isAuthenticated: !!currentUser,
    hasRole: (role) => currentUser?.role === role,
    isCMO: currentUser?.role === 'Chief Medical Officer',
    isAdmin: currentUser?.role === 'Hospital Administrator' || currentUser?.role === 'Chief Medical Officer'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
