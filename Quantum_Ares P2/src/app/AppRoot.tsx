import { Outlet } from "react-router";

export default function AppRoot() {
  return (
    <div className="min-h-screen text-gray-900" style={{ background: "#F8FAFC" }}>
      <Outlet />
    </div>
  );
}
