"use client";

import Signin from "@/components/body-main/auth/signin";

/** Forgot password — same SignIn.dc.html reset panel as /login?view=reset */
export default function ForgotPassword() {
  return <Signin initialView="reset" />;
}
