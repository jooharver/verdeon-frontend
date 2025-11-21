// lib/menuConfig.js

import React from 'react';
import { 
  FaHome, 
  FaBriefcase,        // (My Project)
  FaListAlt,          // (List Project)
  FaLeaf,             // (Carbon Market)
  FaChartPie,         // (Portfolio)
  FaUser,             // (Account)
  FaTachometerAlt,  // (Dashboard)
  FaUsers,            // (Manage Users)
  FaTasks,            // (Manage/Review Projects)
} from 'react-icons/fa';

// 1. DEFINISIKAN SEMUA MENU YANG MUNGKIN ADA
const allMenus = {
  // Common
  home: { 
    path: '/home', 
    title: 'Home', 
    icon: <FaHome /> 
  },
  account: { 
    path: '/account', 
    title: 'Account', 
    icon: <FaUser /> 
  },
  
  // Admin
  adminDashboard: { 
    path: '/admin/dashboard', 
    title: 'Admin Dashboard', 
    icon: <FaTachometerAlt /> 
  },
  manageUsers: { 
    path: '/admin/user', 
    title: 'Manage Users', 
    icon: <FaUsers /> 
  },
  manageProjects: { 
    path: '/admin/project', 
    title: 'Manage Projects', 
    icon: <FaTasks /> 
  },

  // Issuer (My Project)
  myProject: { 
    path: '/my-project', 
    title: 'My Project', 
    icon: <FaBriefcase /> 
  },

  listProject: { 
    path: '/list-project', 
    title: 'List Project', 
    icon: <FaListAlt /> 
  },

  // Buyer (Market & Portfolio)
  carbonMarket: { 
    path: '/carbon-market', 
    title: 'Carbon Market', 
    icon: <FaLeaf /> 
  },
  myPortfolio: { 
    path: '/portfolio', 
    title: 'Portfolio', 
    icon: <FaChartPie /> 
  },

  // Auditor
  auditorDashboard: { 
    path: '/auditor/dashboard', 
    title: 'Auditor Dashboard', 
    icon: <FaTachometerAlt /> 
  },
  reviewProjects: { 
    path: '/auditor/review', 
    title: 'Review Projects', 
    icon: <FaTasks /> 
  },
};

// 2. PETAKAN ROLE KE MENU YANG DIIZINKAN
export const MENU_ITEMS_BY_ROLE = {
  admin: [
    allMenus.adminDashboard,
    allMenus.manageUsers,
    allMenus.manageProjects,
    allMenus.account,
  ],
  issuer: [
    allMenus.home,
    allMenus.myProject,
    allMenus.listProject,
    allMenus.carbonMarket,
    allMenus.account,
  ],
  buyer: [
    allMenus.home,
    allMenus.carbonMarket,
    allMenus.myPortfolio,
    allMenus.account,
  ],
  auditor: [
    allMenus.home,
    allMenus.auditorDashboard,
    allMenus.reviewProjects,
    allMenus.account,
  ],
  
  // Fallback jika user punya role aneh atau tidak terdaftar
  default: [
    allMenus.home,
    allMenus.account,
  ]
};