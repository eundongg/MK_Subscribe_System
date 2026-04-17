import { useEffect, useState } from "react";

const PASSWORD_MIN_LENGTH = 8;

function isPasswordValid(password) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return false;
  }
  if (/\s/.test(password)) {
    return false;
  }
  const hasLetter = /\p{L}/u.test(password);
  const hasDigit = /\p{N}/u.test(password);
  return hasLetter && hasDigit;
}

const INITIAL_SIGNUP_FORM = {
  loginId: "",
  password: "",
  passwordConfirm: "",
  name: "",
  isOver14: false,
  agreeSignup: false,
};

const INITIAL_LOGIN_FORM = {
  loginId: "",
  password: "",
};

const INITIAL_ID_CHECK = {
  status: "idle",
  message: "",
  checkedLoginId: "",
};

export function useProductAuth() {
  const [authMode, setAuthMode] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  const [loginForm, setLoginForm] = useState(INITIAL_LOGIN_FORM);
  const [signupForm, setSignupForm] = useState(INITIAL_SIGNUP_FORM);
  const [idCheck, setIdCheck] = useState(INITIAL_ID_CHECK);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((response) => response.json())
      .then((data) => setCurrentUser(data.user || null))
      .catch(() => {
        setCurrentUser(null);
      });
  }, []);

  const passwordMatches =
    signupForm.passwordConfirm.trim() !== "" &&
    signupForm.password === signupForm.passwordConfirm;

  const canProceedSignup =
    signupForm.loginId.trim() !== "" &&
    isPasswordValid(signupForm.password) &&
    passwordMatches &&
    signupForm.name.trim() !== "" &&
    signupForm.isOver14 &&
    signupForm.agreeSignup &&
    idCheck.status === "available" &&
    idCheck.checkedLoginId === signupForm.loginId.trim();

  const canProceedLogin = loginForm.loginId.trim() !== "" && loginForm.password.trim() !== "";

  const openSignup = () => {
    setAuthMode("signup");
    setAuthMessage("");
    setSignupForm(INITIAL_SIGNUP_FORM);
    setIdCheck(INITIAL_ID_CHECK);
  };

  const openLogin = (message) => {
    setAuthMode("login");
    setAuthMessage(typeof message === "string" ? message : "");
    setLoginForm(INITIAL_LOGIN_FORM);
  };

  const closeAuthModal = () => {
    setAuthMode(null);
    setAuthMessage("");
  };

  const changeSignupField = (field, value) => {
    setSignupForm((prev) => {
      if (field === "password") {
        return {
          ...prev,
          password: value,
          passwordConfirm: "",
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });

    if (field === "loginId") {
      setIdCheck(INITIAL_ID_CHECK);
    }
  };

  const changeLoginField = (field, value) => {
    setLoginForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const checkLoginId = async () => {
    const loginId = signupForm.loginId.trim();
    if (!loginId) {
      setIdCheck({
        status: "error",
        message: "아이디를 먼저 입력해 주세요.",
        checkedLoginId: "",
      });
      return;
    }

    try {
      const response = await fetch(`/api/auth/check-login-id?loginId=${encodeURIComponent(loginId)}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        setIdCheck({
          status: "error",
          message: data.message || "중복 확인에 실패했습니다.",
          checkedLoginId: "",
        });
        return;
      }

      if (data.available) {
        setIdCheck({
          status: "available",
          message: "사용 가능한 아이디입니다.",
          checkedLoginId: loginId,
        });
        return;
      }

      setIdCheck({
        status: "taken",
        message: "이미 사용 중인 아이디입니다.",
        checkedLoginId: loginId,
      });
    } catch (error) {
      console.error(error);
      setIdCheck({
        status: "error",
        message: "중복 확인 중 오류가 발생했습니다.",
        checkedLoginId: "",
      });
    }
  };

  const signup = async () => {
    if (!canProceedSignup) {
      return false;
    }
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginId: signupForm.loginId,
          password: signupForm.password,
          name: signupForm.name,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthMessage(data.message || "회원가입에 실패했습니다.");
        return false;
      }
      setCurrentUser(data.user);
      setAuthMessage("");
      setAuthMode(null);
      return true;
    } catch (error) {
      console.error(error);
      setAuthMessage("회원가입 중 오류가 발생했습니다.");
      return false;
    }
  };

  const login = async () => {
    if (!canProceedLogin) {
      return false;
    }
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthMessage(data.message || "로그인에 실패했습니다.");
        return false;
      }
      setCurrentUser(data.user);
      setAuthMessage("");
      setAuthMode(null);
      return true;
    } catch (error) {
      console.error(error);
      setAuthMessage("로그인 중 오류가 발생했습니다.");
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setCurrentUser(null);
    } catch (error) {
      console.error(error);
    }
  };

  return {
    authMode,
    authMessage,
    currentUser,
    signupForm,
    loginForm,
    idCheck,
    passwordMatches,
    canProceedSignup,
    canProceedLogin,
    passwordMinLength: PASSWORD_MIN_LENGTH,
    openSignup,
    openLogin,
    closeAuthModal,
    changeSignupField,
    changeLoginField,
    checkLoginId,
    signup,
    login,
    logout,
  };
}
