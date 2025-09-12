// Utilidad para limpiar completamente la sesión
export const clearAllSessionData = () => {
  // Limpiar localStorage
  localStorage.clear();
  
  // Limpiar sessionStorage  
  sessionStorage.clear();
  
  // Limpiar cookies manualmente
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  console.log("✅ Todos los datos de sesión han sido limpiados");
};

// Función para forzar logout completo
export const forceLogout = () => {
  clearAllSessionData();
  
  // Redirigir con recarga completa
  window.location.href = "/auth";
};
