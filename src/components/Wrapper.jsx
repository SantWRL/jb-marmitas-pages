import { PropsWithChildren } from "react";

export default function Wrapper({ className = "", children }) {
  return (
    <div
      className={`w-full px-5 desktop_lg:mx-auto desktop_lg:max-w-7xl desktop_lg:px-0 ${className}`}
    >
      {children}
    </div>
  );
}
