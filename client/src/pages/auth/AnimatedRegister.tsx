import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
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

interface RegisterProps {
  register: (username: string, email: string, password: string, name: string, role: string) => Promise<any>;
}

export default function AnimatedRegister({ register }: RegisterProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !password || !confirmPassword || !name || !role) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(username, email, password, name, role);
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada. ¡Bienvenido!",
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error de registro",
        description: "No se pudo crear la cuenta. Intenta con diferentes credenciales.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    setLocation("/login");
  };
  
  // Animaciones
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-secondary-50">
      <motion.div 
        className="w-full max-w-md px-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Card className="shadow-lg overflow-hidden">
          <CardHeader className="space-y-1 text-center">
            <motion.div 
              className="flex justify-center mb-4"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-500 text-transparent bg-clip-text">
                Crear Cuenta
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription>
                Regístrate para acceder al sistema
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.form onSubmit={handleRegister} variants={itemVariants}>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                      id="name"
                      placeholder="Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Nombre de Usuario</Label>
                    <Input
                      id="username"
                      placeholder="juanperez"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Rol en la empresa</Label>
                  <Input
                    id="role"
                    placeholder="Ej: Administrador, Técnico, etc."
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full bg-primary-600 hover:bg-primary-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </div>
                    ) : (
                      "Registrarse"
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.form>
            
            <motion.div variants={itemVariants} className="text-center mt-4 text-sm">
              ¿Ya tienes una cuenta?{" "}
              <Button variant="link" className="p-0 text-primary-600" onClick={handleLoginClick}>
                Inicia sesión aquí
              </Button>
            </motion.div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <motion.p 
              variants={itemVariants}
              className="text-xs text-center text-secondary-500"
            >
              Al registrarte, aceptas nuestros Términos y Política de Privacidad.
            </motion.p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}