import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";

const icons = [
  { name: "Instagram", icon: FaInstagram, href: "https://instagram.com/jbmarmitasdelivery" },
  { name: "Facebook", icon: FaFacebook, href: "https://facebook.com/jbmarmitas" },
  { name: "WhatsApp", icon: FaWhatsapp, href: "https://wa.me/5599999042932" },
];

export default function IconList({ iconColor, hoverIconColor }) {
  return (
    <div className="flex gap-5">
      {icons.map(({ name, icon: Icon, href }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noreferrer"
          title={name}
          className="group"
        >
          <Icon
            className={`w-8 h-8 transition-colors duration-300 ${iconColor} ${hoverIconColor}`}
          />
        </a>
      ))}
    </div>
  );
}
