import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function VerifyEmailPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from location state or localStorage
  const email = location.state?.email || localStorage.getItem("signupEmail");

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card w-full max-w-sm shadow-xl bg-base-100">
          <div className="card-body">
            <h2 className="card-title justify-center">Email Verification</h2>
            <p className="text-error">No email found. Please sign up first.</p>
            <button
              onClick={() => navigate("/signup")}
              className="btn btn-primary mt-4"
            >
              Go to Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/verify-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setSuccess("✓ Email verified successfully! Redirecting to login...");
        setTimeout(() => {
          localStorage.removeItem("signupEmail");
          navigate("/login");
        }, 2000);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setResendLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/resend-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setSuccess("✓ OTP sent successfully! Check your email.");
        setOtp("");
      } else {
        setError(data.error || "Failed to resend OTP");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm shadow-xl bg-base-100">
        <form onSubmit={handleVerify} className="card-body">
          <h2 className="card-title justify-center">Verify Email</h2>

          <div className="bg-base-200 p-3 rounded text-sm text-center mb-4">
            <p>Verification code sent to:</p>
            <p className="font-semibold">{email}</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span>{success}</span>
            </div>
          )}

          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            className="input input-bordered"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength="6"
            required
            disabled={loading || !!success}
          />

          <div className="form-control mt-4">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading || !otp || !!success}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>

          <div className="divider">or</div>

          <button
            type="button"
            onClick={handleResendOtp}
            className="btn btn-ghost btn-sm w-full"
            disabled={resendLoading || loading}
          >
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="btn btn-link btn-sm w-full mt-2"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
