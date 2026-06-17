import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRequiresVerification(false);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } else {
        if (res.status === 403 && data.requiresVerification) {
          setRequiresVerification(true);
          localStorage.setItem("signupEmail", form.email);
          setError(data.error || "Please verify your email");
        } else {
          setError(data.error || "Login failed");
        }
      }
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/resend-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: form.email }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        navigate("/verify-email", { state: { email: form.email } });
      } else {
        setError(data.error || "Failed to resend OTP");
      }
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm shadow-xl bg-base-100">
        <form onSubmit={handleLogin} className="card-body">
          <h2 className="card-title justify-center">Login</h2>

          {error && (
            <div className={`alert ${requiresVerification ? "alert-warning" : "alert-error"}`}>
              <span>{error}</span>
            </div>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input input-bordered"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input input-bordered"
            value={form.password}
            onChange={handleChange}
            required
          />

          <div className="form-control mt-4">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading || requiresVerification}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>

          {requiresVerification && (
            <button
              type="button"
              onClick={handleResendOtp}
              className="btn btn-warning btn-sm w-full"
              disabled={resendLoading}
            >
              {resendLoading ? "Sending..." : "Verify Email Now"}
            </button>
          )}

          <div className="text-center text-sm mt-4">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="btn btn-link btn-sm p-0"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
