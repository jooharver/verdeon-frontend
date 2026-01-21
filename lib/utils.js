// lib/utils.js

export const getDashboardByRole = (role) => {
  if (!role) return '/home'; // Jaga-jaga jika role null

  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    
    case 'auditor':
      return '/auditor/dashboard';

    // Buyer & Issuer (sesuai requestmu: ke Home)
    case 'buyer':
    case 'issuer':
      return '/home'; 

    default:
      return '/home'; 
  }
};