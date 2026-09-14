import { FaInstagram, FaWhatsapp } from "react-icons/fa";

// A empresa só tem Instagram e WhatsApp (sem Facebook).
const icons = [
  { name: "Instagram", icon: FaInstagram, href: "https://instagram.com/jbmarmitasdelivery" },
  { name: "WhatsApp", icon: FaWhatsapp, href: "https://wa.me/5599999042932" },
];

export default function IconList({ iconColor, hoverIconColor }) {
  return (
    <div className="flex items-center gap-7">
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
            className={`w-12 h-12 transition duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 ${iconColor} ${hoverIconColor}`}
          />
        </a>
      ))}
    </div>
  );
}
