import { useEffect, useState } from "react";
import Drawer from "../../ui/Drawer";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthDrawer({ onSuccess }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login"); // login | register

  useEffect(() => {
    const handler = (e) => {
      setMode(e?.detail?.mode || "login");
      setOpen(true);
    };

    window.addEventListener("zf:open-auth", handler);
    return () => window.removeEventListener("zf:open-auth", handler);

  }, []);

  const handleSuccess = (user) => {
    setOpen(false);
    onSuccess?.(user);
  };

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title={mode === "login" ? "Login" : "Create account"}
      subtitle={
        mode === "login"
          ? "Login to continue"
          : "Create an account to continue"
      }
    >
      <div className="space-y-6">
        {mode === "login" ? (
          <>
            <LoginForm onLogin={handleSuccess} />

            <div className="text-center text-sm text-gray-500">
              Don’t have an account?{" "}
              <button
                className="text-indigo-600 hover:underline"
                onClick={() => setMode("register")}
              >
                Register
              </button>
            </div>
          </>
        ) : (
          <>
            <RegisterForm onRegister={handleSuccess} />

            <div className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button
                className="text-indigo-600 hover:underline"
                onClick={() => setMode("login")}
              >
                Login
              </button>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
