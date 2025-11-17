import React from "react";

const Header = () => {
  return (
    <div className="w-full h-8 flex items-center justify-between">
      {/* Left empty intentionally */}
      <div></div>

      {/* Right (future actions like profile) */}
      <div className="flex items-center gap-3"></div>
    </div>
  );
};

export default Header;
