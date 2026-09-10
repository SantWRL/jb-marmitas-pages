import { PropsWithChildren } from "react";
import MenuNav from "./MenuNav";
import Footer from "./Footer/Footer";

export default function DefaultPage({ children, onAuthClick }) {
  return (
    <>
      <MenuNav onAuthClick={onAuthClick} />
      {children}
      <Footer
        backgroundColor="bg-red"
        textColor="text-white"
        iconColor="fill-white"
        hoverIconColor="group-hover:desktop_lg:fill-dark"
      />
    </>
  );
}
