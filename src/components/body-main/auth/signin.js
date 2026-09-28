"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useNavigate } from "@/lib/navigation";
import { parseJwt, userLogin } from "../../../utils/users/Helpers";
import { fetchProjectByUserId } from "../../../utils/users/ProjectUtil";
import { AuthField, AuthScreen, AuthSubmit } from "@/components/v3/AuthScreen";
import SocialLoginButtons from "./SocialLoginButtons";

export default function Signin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState("");
  const [toastKind, setToastKind] = useState("");

  const notice = (msg, kind = "") => {
    setToast(msg);
    setToastKind(kind);
  };

  const finishLogin = async (result) => {
    const data = parseJwt(result.token);
    const user = { data, result };
    userLogin(user);
    const resProject = await fetchProjectByUserId(user.data.sub);
    const resultProject = await resProject.json().catch(() => ({}));
    localStorage.setItem("project", JSON.stringify(resultProject));
    if (result.userType === "admin") navigate("/admin/tagmgmt");
    else navigate("/app");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("social") === "error") {
      notice(params.get("detail") || "Social login failed.");
      return;
    }
    const token = params.get("token");
    if (params.get("social") === "1" && token) {
      setPending(true);
      finishLogin({
        token,
        userType: params.get("userType") || "client",
        username: params.get("username") || "",
      }).finally(() => setPending(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return notice("Enter your username or email.");
    if (!pwd) return notice("Enter your password.");
    setPending(true);
    const res = await fetch("/api/v1/auth/signin", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ username: username.trim(), password: pwd }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.token) {
      setPending(false);
      notice(result.detail || "Sign in failed.");
      return;
    }
    await finishLogin(result);
    setPending(false);
  };

  return (
    <AuthScreen
      label="Workspace access"
      line1="SIGN"
      line2="IN."
      sub="Open the work queue, review title and description updates, then approve what goes live."
      toast={toast}
      toastKind={toastKind}
    >
      <form onSubmit={handleSubmit}>
        <AuthField
          label="Username or email"
          type="text"
          name="username"
          autoComplete="username"
          placeholder="you@agency.com"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <AuthField label="Password">
          <div className="sf-auth-pass">
            <input
              type={show ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
            />
            <button type="button" className="sf-link" onClick={() => setShow((v) => !v)}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </AuthField>
        <div className="sf-auth-row">
          <Link className="sf-link" href="/forgotpassword">
            Forgot password
          </Link>
        </div>
        <AuthSubmit disabled={pending}>{pending ? "Signing in…" : "Sign in →"}</AuthSubmit>
        <SocialLoginButtons onError={notice} />
        <p className="sf-auth-foot">
          New workspace? <Link href="/signup">Create access</Link>
        </p>
      </form>
    </AuthScreen>
  );
}
