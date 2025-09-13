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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { loginWithGoogle, loginWithEmail } from "@/lib/firebase";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface LoginProps {
  login: (username: string, password: string) => Promise<void>;
}

export default function Login({ login }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Process redirect result from Google login
  useEffect(() => {
    const processRedirect = async () => {
      try {
        setIsProcessingRedirect(true);
        const user = await handleRedirectResult();
        if (user) {
          // User successfully logged in with Google
          toast({
            title: "Inicio de sesión exitoso",
            description: `Bienvenido, ${user.displayName || user.email}`,
          });
          setLocation("/");
        }
      } catch (error) {
        console.error("Login redirect error:", error);
        toast({
          title: "Error de inicio de sesión",
          description: "Hubo un problema al iniciar sesión con Google",
          variant: "destructive",
        });
      } finally {
        setIsProcessingRedirect(false);
      }
    };

    processRedirect();
  }, [toast, setLocation]);

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
    
    setIsLoading(true);
    
    try {
      await login(username, password);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error de inicio de sesión",
        description: "Usuario o contraseña incorrectos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      // No need to handle success here as it will redirect to Google and then back
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: "Error de inicio de sesión",
        description: "No se pudo iniciar el proceso de inicio de sesión con Google",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    setLocation("/register");
  };

  if (isProcessingRedirect) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-700">Procesando inicio de sesión...</p>
        </div>
      </div>
    );
  }

  // Definición de animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.03,
      boxShadow: "0px 5px 15px rgba(0,0,0,0.1)"
    },
    tap: { 
      scale: 0.97 
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-secondary-50">
      <motion.div 
        className="w-full max-w-md px-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg overflow-hidden">
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </motion.div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-500 text-transparent bg-clip-text">AssetLogix</CardTitle>
              <CardDescription>
                Sistema Integrado de Gestión Documental y Mantenimiento
              </CardDescription>
            </CardHeader>
          </motion.div>
          <CardContent className="space-y-4">
            {/* Google Login Button */}
            <motion.div 
              className="flex flex-col items-center gap-2"
              variants={itemVariants}
            >
              <motion.div 
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="w-full"
              >
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full flex items-center justify-center" 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                      </svg>
                      <span className="inline-block relative">
                        Iniciar sesión con Google
                        <motion.span 
                          className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500"
                          initial={{ width: "0%" }}
                          whileHover={{ width: "100%" }}
                          transition={{ duration: 0.3 }}
                        />
                      </span>
                    </>
                  )}
                </Button>
              </motion.div>
              <p className="text-xs text-amber-600">Nota: Requiere configuración completa en Firebase</p>
            </motion.div>

            <motion.div className="relative" variants={itemVariants}>
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-secondary-500">Continúa con tu cuenta</span>
              </div>
            </motion.div>

            <motion.form onSubmit={handleEmailLogin} variants={itemVariants}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    placeholder="Ingresa tu usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <Button variant="link" className="text-xs text-primary-600 px-0">
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-4">
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button 
                      type="submit" 
                      className="w-full bg-primary-600 hover:bg-primary-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Iniciando sesión...
                        </div>
                      ) : (
                        "Iniciar sesión"
                      )}
                    </Button>
                  </motion.div>
                  
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button 
                      type="button" 
                      onClick={handleEmailLogin}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Procesando...
                        </div>
                      ) : (
                        "Confirmar Inicio de Sesión"
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.form>

            <motion.div className="text-center text-sm mt-4" variants={itemVariants}>
              ¿No tienes una cuenta?{" "}
              <Button variant="link" className="p-0 text-primary-600" onClick={handleRegisterClick}>
                Regístrate aquí
              </Button>
            </motion.div>

            <motion.div 
              className="text-center text-sm text-secondary-500 mt-4" 
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <p>Usuarios de demostración:</p>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <motion.div 
                  className="border border-secondary-200 rounded p-2"
                  whileHover={{ scale: 1.05, boxShadow: "0px 3px 8px rgba(0,0,0,0.1)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <p className="font-medium">Administrador</p>
                  <p>usuario: admin</p>
                  <p>clave: admin123</p>
                </motion.div>
                <motion.div 
                  className="border border-secondary-200 rounded p-2"
                  whileHover={{ scale: 1.05, boxShadow: "0px 3px 8px rgba(0,0,0,0.1)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <p className="font-medium">Técnico</p>
                  <p>usuario: technician</p>
                  <p>clave: tech123</p>
                </motion.div>
                <motion.div 
                  className="border border-secondary-200 rounded p-2"
                  whileHover={{ scale: 1.05, boxShadow: "0px 3px 8px rgba(0,0,0,0.1)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <p className="font-medium">Usuario</p>
                  <p>usuario: user</p>
                  <p>clave: user123</p>
                </motion.div>
              </div>
            </motion.div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <motion.p 
              className="text-xs text-center text-secondary-500 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              © 2023 AssetLogix. Todos los derechos reservados.
            </motion.p>
          </CardFooter>
        </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
