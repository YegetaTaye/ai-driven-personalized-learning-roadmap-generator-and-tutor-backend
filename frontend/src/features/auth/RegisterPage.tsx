import { Link } from "react-router-dom";
import { BrandMark } from "@/components/layout/BrandMark";
import { RegisterForm } from "./components/RegisterForm";
import { OAuthButtons } from "./components/OAuthButtons";

export default function RegisterPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#f3efe7" }}
    >
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-10">
          <BrandMark size={28} />
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 26,
              letterSpacing: "-0.01em",
              color: "#3d342a",
            }}
          >
            Yeneta
            <em style={{ fontStyle: "italic", color: "#6e645a" }}>.learn</em>
          </span>
        </Link>

        <div
          className="border rounded-2xl px-8 py-8"
          style={{ background: "#faf7f1", borderColor: "#d6cfbf" }}
        >
          <h1
            className="text-[28px] mb-1"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "#3d342a",
            }}
          >
            Create account
          </h1>
          <p
            className="mb-6 text-[15px]"
            style={{ color: "#6e645a", fontFamily: "'Crimson Pro', serif" }}
          >
            Start your learning journey
          </p>

          <RegisterForm />

          <div className="flex items-center gap-3 my-5">
            <span
              className="flex-1 border-t"
              style={{ borderColor: "#d6cfbf" }}
            />
            <span
              className="text-xs"
              style={{ color: "#9a9088", fontFamily: "'Crimson Pro', serif" }}
            >
              or continue with
            </span>
            <span
              className="flex-1 border-t"
              style={{ borderColor: "#d6cfbf" }}
            />
          </div>

          <OAuthButtons />
        </div>

        <p
          className="mt-5 text-center text-sm"
          style={{ color: "#9a9088", fontFamily: "'Crimson Pro', serif" }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "oklch(0.62 0.18 28)",
              textDecoration: "underline",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
