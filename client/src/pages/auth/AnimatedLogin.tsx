import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle, signOut } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Loader2, Lock, User, Mail } from "lucide-react";
import CompanyLogo from "@/assets/company-logo.svg";
import { useAuth } from "../../hooks/use-auth";

export default function AnimatedLogin() {
  const { loginMutation, registerMutation } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    setIsProcessingRedirect(false);
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Por favor, ingresa usuario y contraseña",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await loginMutation.mutateAsync({ 
        username, 
        password 
      });
    } catch (error) {
      console.error("Login error:", error);
      // Toast is handled in the mutation
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      const currentDomain = window.location.hostname;
      const googleUser = await signInWithGoogle();
      
      const email = googleUser.email;
      
      try {
        const loginResponse = await loginMutation.mutateAsync({
          username: email,
          password: "google-auth-" + googleUser.uid
        });
        
        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido, ${googleUser.displayName || googleUser.email}`,
        });
        
        setLocation("/");
        return;
      } catch (loginError) {
        // Usuario no existe, intentar registrar
      }
      
      const registerResponse = await registerMutation.mutateAsync({
        username: email,
        email: email,
        password: "google-auth-" + googleUser.uid,
        name: googleUser.displayName || email.split('@')[0],
        role: 'user'
      });
      
      toast({
        title: "Registro e inicio de sesión exitosos",
        description: `Bienvenido, ${googleUser.displayName || googleUser.email}`,
      });
      
      setLocation("/");
    } catch (error) {
      let errorMessage = "Error de autenticación con Google";
      let helpMessage = "";
      
      if (error instanceof Error) {
        const errorObj = error as any;
        
        if (errorObj.code === "auth/operation-not-allowed") {
          errorMessage = "El proveedor de Google no está habilitado";
          helpMessage = "Ve a Firebase Console > Authentication > Sign-in method > Google y actívalo.";
        } else if (errorObj.code === "auth/unauthorized-domain" || error.message.includes("unauthorized_domain")) {
          errorMessage = "Dominio no autorizado en Firebase";
          helpMessage = `Agrega '${window.location.hostname}' en Firebase Console > Authentication > Settings > Authorized domains`;
        } else if (errorObj.code === "auth/popup-blocked" || errorObj.code === "auth/popup-closed-by-user" || 
                  error.message.includes("popup_closed") || error.message.includes("popup_block")) {
          errorMessage = "Ventana de autenticación cerrada o bloqueada";
          helpMessage = "Asegúrate de permitir ventanas emergentes en tu navegador";
        } else if (error.message.includes("network")) {
          errorMessage = "Error de red";
          helpMessage = "Verifica tu conexión a internet";
        } else if (errorObj.code === "auth/invalid-api-key" || error.message.includes("api-key-not-valid")) {
          errorMessage = "Error de configuración de Firebase";
          helpMessage = "La clave API no es válida. Contacta al administrador.";
        } else {
          errorMessage = errorObj.code ? `Error: ${errorObj.code}` : error.message;
        }
      }
      
      toast({
        title: "Error de inicio de sesión",
        description: errorMessage + (helpMessage ? `\n\n${helpMessage}` : ""),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función más simple para evitar errores
  // Redirect flow eliminado para evitar logs y comportamientos inesperados en demo

  const handleAppleLogin = async () => {
    toast({
      title: "Función no disponible",
      description: "El inicio de sesión con Apple no está disponible actualmente",
      variant: "destructive",
    });
  };

  const handleRegisterClick = () => {
    setRegisterOpen(true);
  };
  
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos",
        variant: "destructive",
      });
      return;
    }
    
    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }
    
    if (registerPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await registerMutation.mutateAsync({
        username: registerEmail,
        email: registerEmail,
        password: registerPassword,
        name: registerName,
        role: 'user'
      });
      
      // Limpiamos el formulario y cerramos el modal
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      setRegisterOpen(false);
      
    } catch (error) {
      console.error("Registration error:", error);
      // Toast is handled in the mutation
    }
  };

  // Esta funcionalidad ha sido simplificada

  // Definición de variantes de animación para elementos usando framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 0.8, 
        ease: "easeOut" 
      }
    }
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }
    },
    tap: { scale: 0.95 }
  };

  // Background circle animation
  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.3,
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  // Animación de fondo con círculos sutiles
  const circles = [
    { cx: "5%", cy: "10%", r: 60, color: "from-teal-50 to-blue-50", delay: 0 },
    { cx: "95%", cy: "20%", r: 80, color: "from-blue-50 to-teal-50", delay: 0.2 },
    { cx: "90%", cy: "90%", r: 70, color: "from-cyan-50 to-teal-50", delay: 0.4 },
    { cx: "15%", cy: "85%", r: 50, color: "from-teal-50 to-cyan-50", delay: 0.6 },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden">
      {/* Animated background circles */}
      {circles.map((circle, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full bg-gradient-to-r ${circle.color} blur-xl`}
          style={{ 
            left: circle.cx, 
            top: circle.cy, 
            width: circle.r * 2, 
            height: circle.r * 2,
            translateX: "-50%",
            translateY: "-50%"
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 0.2,
            transition: { 
              delay: circle.delay, 
              duration: 1, 
              ease: "easeOut" 
            }
          }}
        />
      ))}

      <motion.div 
        className="w-full max-w-md px-4 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div
          className="shadow-lg rounded-xl overflow-hidden bg-white border border-gray-200"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { duration: 0.5 } }}
          whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
        >
          <motion.div 
            className="flex justify-center py-6 bg-white"
            variants={logoVariants}
          >
            <motion.img 
              src={CompanyLogo} 
              alt="IVUMSA Logo" 
              className="h-20 object-contain"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
              whileHover={{ scale: 1.05, rotate: [0, -1, 1, -1, 0], transition: { duration: 0.5 } }}
            />
          </motion.div>
          
          <CardHeader className="pb-2">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-xl font-semibold text-center text-gray-800">
                Sistema de Gestión AssetLogix
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-center text-gray-600">
                Sistema Integrado de Gestión Documental y Mantenimiento
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <motion.div 
                    className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Mail className="h-5 w-5 text-gray-400" />
                  </motion.div>
                  <Input
                    id="username"
                    placeholder="Ingrese su correo electrónico"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 py-2 border-gray-300 focus:border-teal-500 focus:ring-teal-500 transition-all duration-300"
                  />
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <div className="relative">
                  <motion.div 
                    className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Lock className="h-5 w-5 text-gray-400" />
                  </motion.div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 py-2 border-gray-300 focus:border-teal-500 focus:ring-teal-500 transition-all duration-300"
                  />
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="p-4 bg-gradient-to-r from-blue-50 to-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="text-center">
                  <div className="text-sm text-gray-700 mb-2">
                    Credenciales de acceso al sistema
                  </div>
                  <div className="bg-white rounded-md p-3 border border-gray-300">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Usuario:</span>
                        <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800 font-bold">admin</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Contraseña:</span>
                        <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800 font-bold">123</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                variants={itemVariants}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Checkbox 
                    id="remember" 
                    className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4 transition-all duration-300"
                  />
                  <Label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                    Recordarme
                  </Label>
                </div>
                <Button 
                  variant="link" 
                  className="p-0 text-sm text-teal-600 hover:text-teal-800 transition-colors duration-300"
                >
                  ¿Olvidó su contraseña?
                </Button>
              </motion.div>
              
              <motion.div
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 shadow-md hover:shadow-lg transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      <span>Iniciando sesión...</span>
                    </div>
                  ) : (
                    <span>Iniciar sesión</span>
                  )}
                </Button>
              </motion.div>
            </form>
            
            <motion.div variants={itemVariants} className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O continúe con</span>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="grid grid-cols-1 gap-3">
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full flex items-center justify-center border border-gray-300 hover:bg-gray-50 text-gray-700 transition-all duration-300"
                  onClick={handleGoogleLogin}
                >
                  <motion.svg 
                    className="w-5 h-5 mr-2" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107"/>
                    <path d="M3.15302 7.3455L6.43851 9.755C7.32752 7.554 9.48052 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15902 2 4.82802 4.1685 3.15302 7.3455Z" fill="#FF3D00"/>
                    <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z" fill="#4CAF50"/>
                    <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2"/>
                  </motion.svg>
                  Iniciar sesión con Google
                </Button>
              </motion.div>
              
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full flex items-center justify-center border border-gray-300 hover:bg-gray-50 text-gray-700 transition-all duration-300"
                  onClick={handleAppleLogin}
                >
                  <motion.svg 
                    className="w-5 h-5 mr-2" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    xmlns="http://www.w3.org/2000/svg"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <path d="M17.05 20.28a11.45 11.45 0 0 1-1.14 1.76c-.6.73-1.25 1.4-1.96 1.96-.87.66-1.75.99-2.64.99-.67 0-1.5-.19-2.45-.56-.95-.38-1.82-.56-2.61-.56-.83 0-1.65.19-2.46.56-.81.36-1.47.55-1.97.56-.93.04-1.86-.34-2.77-1.14-.76-.61-1.51-1.35-2.24-2.2-1-.74-1.82-1.91-2.44-3.52C.16 16.34 0 14.53 0 12.7c0-2.08.45-3.86 1.34-5.31.89-1.45 2.06-2.41 3.51-2.71.69-.1 1.51.19 2.45.55s1.81.54 2.61.54c.81 0 1.69-.19 2.67-.55 1.05-.41 1.92-.58 2.6-.51 1.81.15 3.17.88 4.08 2.19-1.62.98-2.42 2.34-2.41 4.08.01 1.36.51 2.48 1.49 3.37.44.41.94.73 1.49.96-.16.51-.37 1.01-.59 1.49l-.19.48zM12.98 0c.02.17.02.34.02.51 0 1.24-.46 2.4-1.37 3.47-.91 1.05-2.09 1.72-3.44 1.62-.03-.15-.05-.31-.05-.48 0-1.21.52-2.36 1.39-3.37.43-.48 1.07-.93 1.91-1.36.84-.41 1.39-.63 1.54-.68z"/>
                  </motion.svg>
                  Iniciar sesión con Apple
                </Button>
              </motion.div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Servicios disponibles: Google y Apple
              </p>
            </motion.div>
          </CardContent>
          
          <CardFooter className="flex flex-col items-center justify-center pt-4 pb-6 space-y-4">
            <motion.div 
              variants={itemVariants}
              className="w-full"
            >
              <p className="text-sm text-gray-600 mb-3 text-center">
                ¿No tiene una cuenta?
              </p>
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full flex items-center justify-center border border-teal-500 bg-white hover:bg-teal-50 text-teal-600 font-medium transition-all duration-300 py-5"
                  onClick={handleRegisterClick}
                >
                  <motion.svg 
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 mr-2"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.5 }}
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </motion.svg>
                  Crear una nueva cuenta
                </Button>
              </motion.div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="text-center mt-3">
              <motion.p 
                className="text-xs text-gray-500 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                IVUMSA - PROYECTA - CONSTRUYE
              </motion.p>
              <motion.p 
                className="text-xs text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                © 2023-2025 IVUMSA SistemaGM. Todos los derechos reservados.
              </motion.p>
            </motion.div>
          </CardFooter>
        </motion.div>
      </motion.div>
      
      {/* Modal de registro */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center text-gray-800 mb-1">
              Crear una cuenta nueva
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Regístrese para acceder al SistemaGM de IVUMSA
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-name" className="text-sm font-medium text-gray-700">
                Nombre completo
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="register-name"
                  placeholder="Ingrese su nombre completo"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  disabled={isRegistering}
                  className="pl-10 py-2 border-gray-300 focus:border-teal-500 focus:ring-teal-500 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="register-email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="Ingrese su correo electrónico"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  disabled={isRegistering}
                  className="pl-10 py-2 border-gray-300 focus:border-teal-500 focus:ring-teal-500 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="register-password" className="text-sm font-medium text-gray-700">
                Contraseña
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Cree una contraseña"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  disabled={isRegistering}
                  className="pl-10 py-2 border-gray-300 focus:border-teal-500 focus:ring-teal-500 transition-all duration-300"
                />
              </div>
              <p className="text-xs text-gray-500">La contraseña debe tener al menos 6 caracteres</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="register-confirm-password" className="text-sm font-medium text-gray-700">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="register-confirm-password"
                  type="password"
                  placeholder="Confirme su contraseña"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  disabled={isRegistering}
                  className="pl-10 py-2 border-gray-300 focus:border-teal-500 focus:ring-teal-500 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="flex justify-center pt-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full"
              >
                <Button 
                  type="submit" 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 shadow-md hover:shadow-lg transition-all duration-300"
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      <span>Creando cuenta...</span>
                    </div>
                  ) : (
                    <span>Registrarme</span>
                  )}
                </Button>
              </motion.div>
            </div>
            
            <p className="text-xs text-center text-gray-500 mt-4">
              Al registrarse, acepta los términos de servicio y la política de privacidad de IVUMSA.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}