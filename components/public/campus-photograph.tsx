import Image from "next/image";
import queensLawn from "@/public/images/queens-lawn.webp";

export function CampusPhotograph({ priority = false }: { priority?: boolean }) {
  return <figure className="campus-photograph">
    <div className="campus-photo-image"><Image src={queensLawn} alt="Queen’s Lawn at Imperial’s South Kensington campus, with Queen’s Tower on the right and the Central Library behind the trees" fill sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 800px) 45vw, (max-width: 1440px) 55vw, 800px" preload={priority} /></div>
    <figcaption><span>Queen’s Lawn, South Kensington · 2020</span><a href="https://commons.wikimedia.org/wiki/File:Queen%27s_Lawn_from_the_south-east_corner.jpg" target="_blank" rel="noreferrer">Photo: Shadowssettle · CC BY-SA 4.0 ↗</a></figcaption>
  </figure>;
}
