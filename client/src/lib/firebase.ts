export interface GoogleUser {
  email: string;
  displayName: string | null;
  uid: string;
}

export const signInWithGoogle = async (): Promise<GoogleUser> => {
  return {
    uid: "demo-uid",
    email: "demo@company.com",
    displayName: "Usuario Demo"
  } as GoogleUser;
};

export const signInWithGoogleRedirect = async () => {
  throw new Error("Google redirect not available");
};

export const getCurrentUser = (): Promise<GoogleUser | null> => {
  return new Promise((resolve) => {
    resolve(null);
  });
};

export const signOut = () => {
  return Promise.resolve();
};

export const loginWithGoogle = signInWithGoogle;
export const loginWithEmail = async (email: string, password: string) => {
  throw new Error("Email login not implemented in this version");
};

export const auth = null;
